import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/state/auth_controller.dart';
import '../data/arena_repository.dart';
import '../../curriculum/models/course_module.dart';
import '../../curriculum/state/curriculum_controller.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../services/audio_recorder_service.dart';
import '../widgets/mic_button.dart';
import '../widgets/decibel_visualizer.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '_path_helper_stub.dart' if (dart.library.io) '_path_helper_native.dart';

class ArenaScreen extends StatefulWidget {
  const ArenaScreen({
    super.key,
    this.initialTopic,
    this.remedialPlanId,
    this.remedialTopicName,
    this.remedialActionItems = const [],
    this.startImmediately = false,
  });

  final CourseTopic? initialTopic;
  final String? remedialPlanId;
  final String? remedialTopicName;
  final List<String> remedialActionItems;
  final bool startImmediately;

  @override
  State<ArenaScreen> createState() => _ArenaScreenState();
}

class _ArenaScreenState extends State<ArenaScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _messages = <_DialogueMessage>[];
  final _speech = FlutterTts();
  CourseTopic? _selectedTopic;
  bool _sessionStarted = false;
  bool _starting = false;
  bool _loadingInitialRemedialSession = false;
  bool _sending = false;
  bool _backendSession = false;
  bool _isRemedialFallback = false;
  bool _isCompleted = false;
  bool _endingSession = false;
  bool _autoSubmitPaused = false;
  int _turnCount = 0;
  int _autoSubmitSeconds = 10;
  Timer? _autoSubmitTimer;
  String? _sessionId;
  String? _sessionNotice;

  final _audioRecorder = AudioRecorder();
  final _audioPlayer = AudioPlayer();
  final _audioService = AudioSessionService();
  bool _isRecording = false;
  bool _isAgentSpeaking = false;
  double _amplitude = 0.0;

  @override
  void initState() {
    super.initState();
    _selectedTopic = widget.initialTopic;
    _loadingInitialRemedialSession = widget.startImmediately;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await context.read<CurriculumController>().loadModules();
      if (!mounted || !widget.startImmediately) return;
      await _startSession();
    });

    _setupAudioListeners();
  }

  void _setupAudioListeners() {
    _speech.setStartHandler(() {
      if (mounted) setState(() => _isAgentSpeaking = true);
    });
    _speech.setCompletionHandler(() {
      if (mounted) setState(() => _isAgentSpeaking = false);
    });
    _speech.setCancelHandler(() {
      if (mounted) setState(() => _isAgentSpeaking = false);
    });

    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isAgentSpeaking = state == PlayerState.playing;
        });
      }
    });
  }

  @override
  void dispose() {
    _autoSubmitTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    _speech.stop();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      await _stopRecordingAndSend();
    } else {
      await _startRecording();
    }
  }

  Future<void> _startRecording() async {
    if (_sending || _isCompleted) return;
    var recordingStarted = false;
    try {
      await _audioPlayer.stop();
      await _speech.stop();
      if (mounted) setState(() => _isAgentSpeaking = false);

      final status = await Permission.microphone.request();
      if (status != PermissionStatus.granted ||
          !await _audioRecorder.hasPermission()) {
        _showAudioError('Microphone permission is required to record.');
        return;
      }

      if (kIsWeb) {
        await _audioRecorder
            .start(const RecordConfig(encoder: AudioEncoder.opus), path: '');
      } else {
        final path = await getAudioTempPath();
        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: path,
        );
      }
      if (!mounted) return;
      setState(() => _isRecording = true);
      recordingStarted = true;
      _startAmplitudeTimer();
    } catch (error) {
      _showAudioError('Could not start recording. Check microphone access and try again.');
    } finally {
      if (!recordingStarted && mounted) {
        setState(() {
          _isRecording = false;
          _amplitude = 0;
        });
      }
    }
  }

  void _startAmplitudeTimer() {
    Future.doWhile(() async {
      if (!_isRecording) return false;
      final amp = await _audioRecorder.getAmplitude();
      if (mounted) {
        setState(() {
          _amplitude = (amp.current + 160) / 160;
        });
      }
      await Future.delayed(const Duration(milliseconds: 100));
      return mounted && _isRecording;
    });
  }

  Future<void> _stopRecordingAndSend() async {
    if (!_isRecording) return;
    setState(() {
      _sending = true;
      _sessionNotice = 'Analyzing speech...';
    });
    try {
      final path = await _audioRecorder.stop();
      if (path == null || path.isEmpty) {
        throw StateError('No audio was captured. Please try again.');
      }
      if (!_isCompleted) await _sendAudio(path);
    } catch (error) {
      // ignore: avoid_print
      print('AUDIO UPLOAD ERROR: $error');
      if (mounted) setState(() => _sessionNotice = 'Audio upload failed: $error');
      _showAudioError('Audio upload failed: $error');
    } finally {
      if (mounted) {
        setState(() {
          _isRecording = false;
          _sending = false;
          _amplitude = 0;
        });
      }
    }
  }

  Future<void> _sendAudio(String path) async {
    if (_isCompleted) return;
    setState(() {
      _sessionNotice = 'Analyzing speech...';
    });
    if (_backendSession) {
      final response = await _audioService.sendAudioTurn(
        sessionId: _sessionId!,
        audioPath: path,
      );
      final aiText = response['aiText']?.toString() ?? '';
      setState(() {
        _messages.add(_DialogueMessage(
            text: response['transcript']?.toString() ?? '',
            fromGuide: false));
        _messages.add(_DialogueMessage(text: aiText, fromGuide: true));
        _recordAssistantTurn(aiText, response);
        _sessionNotice =
            _isCompleted ? 'Session complete.' : 'AI response received.';
      });
      _scrollToBottom();
      await _speakResponse(aiText);
      if (response['audioUrl'] != null) {
        await _audioPlayer.play(UrlSource(response['audioUrl']));
      }
    } else {
      setState(() {
        _messages.add(const _DialogueMessage(
            text: '(Simulated audio transcript)', fromGuide: false));
        _messages.add(const _DialogueMessage(
            text: 'I heard you! This is a simulated response.',
            fromGuide: true));
        _recordAssistantTurn('I heard you! This is a simulated response.');
        _sessionNotice = 'Practice dialogue';
      });
      _scrollToBottom();
    }
  }

  void _showAudioError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _sendTypedMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sending || _isCompleted) return;
    if (_isRemedialFallback) {
      _messageController.clear();
      final tasks = widget.remedialActionItems;
      final task = tasks.isEmpty
          ? 'your understanding of ${widget.remedialTopicName ?? 'this topic'}'
          : tasks[_turnCount % tasks.length];
      final response =
          'Let us work through this remedial task: $task. What is your reasoning?';
      setState(() {
        _messages.add(_DialogueMessage(text: text, fromGuide: false));
        _messages.add(_DialogueMessage(text: response, fromGuide: true));
        _recordAssistantTurn(response);
        _sessionNotice =
            _isCompleted ? 'Session complete.' : 'Guided remedial practice';
      });
      _scrollToBottom();
      await _speakResponse(response);
      return;
    }
    if (!_backendSession || _sessionId == null) {
      setState(
          () => _sessionNotice = 'Connect a backend session before sending.');
      return;
    }

    _messageController.clear();
    setState(() {
      _sending = true;
      _sessionNotice = 'Tutor is thinking...';
      _messages.add(_DialogueMessage(text: text, fromGuide: false));
    });
    _scrollToBottom();
    try {
      final result = await context.read<ArenaRepository>().sendTurn(
            sessionId: _sessionId!,
            studentText: text,
          );
      if (!mounted) return;
      final response =
          (result['aiText'] ?? result['AiText'] ?? result['message'] ?? '')
              .toString();
      if (response.trim().isEmpty) {
        throw const FormatException(
            'The AI service returned an empty response.');
      }
      setState(() {
        _messages.add(_DialogueMessage(text: response, fromGuide: true));
        _recordAssistantTurn(response, result);
        _sessionNotice =
            _isCompleted ? 'Session complete.' : 'AI response received.';
      });
      _scrollToBottom();
      await _speakResponse(response);
    } catch (_) {
      if (mounted) {
        setState(() => _sessionNotice = 'Message could not be sent.');
      }
    } finally {
      if (mounted) {
        setState(() => _sending = false);
      }
    }
  }

  void _recordAssistantTurn(String response, [Map<String, dynamic>? payload]) {
    final wasCompleted = _isCompleted;
    _turnCount += 1;
    final completionMessage = response.toLowerCase().contains(
          'we have reached the end of our session',
        );
    final completionFlag = payload?['isCompleted'] == true ||
        payload?['completed'] == true ||
        payload?['sessionCompleted'] == true ||
        payload?['sessionStatus']?.toString().toLowerCase() == 'completed';
    _isCompleted = _turnCount >= 10 || completionMessage || completionFlag;
    if (_isCompleted && !wasCompleted && _backendSession && _sessionId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _startAutoSubmitCountdown();
      });
    }
  }

  void _startAutoSubmitCountdown() {
    if (_autoSubmitTimer != null || _autoSubmitPaused || _endingSession) return;
    _autoSubmitSeconds = 10;
    _autoSubmitTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() => _autoSubmitSeconds -= 1);
      if (_autoSubmitSeconds <= 0) {
        timer.cancel();
        _autoSubmitTimer = null;
        unawaited(_finishSessionAndReturnToModules());
      }
    });
  }

  void _reviewChat() {
    _autoSubmitTimer?.cancel();
    _autoSubmitTimer = null;
    setState(() => _autoSubmitPaused = true);
    if (_scrollController.hasClients) {
      unawaited(_scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOut,
      ));
    }
  }

  Future<void> _finishSessionAndReturnToModules() async {
    if (_endingSession) return;
    _autoSubmitTimer?.cancel();
    _autoSubmitTimer = null;
    final sessionId = _sessionId;
    if (!_backendSession || sessionId == null || sessionId.isEmpty) {
      if (mounted) context.go('/courses');
      return;
    }

    setState(() {
      _endingSession = true;
      _sessionNotice = 'Submitting final transcript for evaluation...';
    });
    try {
      await context.read<ArenaRepository>().endSession(sessionId: sessionId);
      if (mounted) context.go('/courses');
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _endingSession = false;
        _sessionNotice = 'Session could not be submitted. Please retry.';
      });
      _showAudioError('Could not submit the completed session: $error');
    }
  }

  Future<void> _speakResponse(String text) async {
    if (text.isEmpty) return;
    try {
      await _speech.speak(text);
    } catch (_) {
      // Text remains available when the device has no speech engine configured.
    }
  }

  Future<void> _startSession() async {
    final enrolledTopics = context
        .read<CurriculumController>()
        .modules
        .expand((module) => module.topics)
        .toList();
    final matchedRemedialTopic = widget.startImmediately
        ? _matchRemedialTopic(enrolledTopics, widget.remedialTopicName)
        : null;
    final isRemedialFallback =
        widget.startImmediately && matchedRemedialTopic == null;
    final topic = widget.startImmediately
        ? matchedRemedialTopic ?? _createRemedialFallbackTopic()
        : _selectedTopic;
    if (topic == null) {
      return;
    }
    final selectedTopic = topic;
    if (!isRemedialFallback &&
        !enrolledTopics.any((item) => item.id == selectedTopic.id)) {
      setState(() {
        _selectedTopic = null;
        _loadingInitialRemedialSession = false;
        _sessionNotice = 'Choose a topic from your enrolled modules.';
      });
      return;
    }
    setState(() {
      _selectedTopic = selectedTopic;
      _isRemedialFallback = isRemedialFallback;
      _starting = true;
      _loadingInitialRemedialSession = false;
      _turnCount = 0;
      _isCompleted = false;
      _sessionNotice = null;
    });
    final user = context.read<AuthController>().user ?? const {};
    final studentId = (user['id'] ?? user['userId'] ?? user['sub']).toString();
    final isUuid = RegExp(r'^[0-9a-fA-F-]{36}$').hasMatch(studentId);
    final isMockTopic = selectedTopic.id.startsWith('sample-');
    try {
      if (isUuid && !isMockTopic && !isRemedialFallback) {
        final response = await context.read<ArenaRepository>().startSession(
              studentId: studentId,
              topicId: selectedTopic.id,
            );
        _sessionId = (response['id'] ?? response['sessionId'] ?? response['Id'])
            ?.toString();
        _backendSession = _sessionId != null && _sessionId!.isNotEmpty;
        _sessionNotice = _backendSession
            ? 'Session connected to the ACM backend.'
            : 'Practice session started.';
      } else {
        _sessionNotice = isRemedialFallback
            ? 'Guided remedial practice started.'
            : 'Practice session started.';
      }
    } catch (_) {
      _sessionNotice =
          'Practice session started; backend session is unavailable.';
    }
    if (!mounted) return;
    setState(() {
      _sessionStarted = true;
      _starting = false;
      _messages.add(_DialogueMessage(
        text: widget.startImmediately
            ? _remedialOpeningPrompt(selectedTopic)
            : 'Let us explore ${selectedTopic.title}. ${selectedTopic.description.isNotEmpty ? selectedTopic.description : 'What do you already understand about this topic?'}',
        fromGuide: true,
      ));
    });
    _scrollToBottom();
    // Initially speak the first greeting if possible
    await _speakResponse(_messages.last.text);
  }

  CourseTopic? _matchRemedialTopic(
    Iterable<CourseTopic> topics,
    String? remedialTopicName,
  ) {
    final requestedName = remedialTopicName?.trim().toLowerCase() ?? '';
    if (requestedName.isEmpty) return null;

    final normalizedTopics = topics
        .map((topic) => (topic: topic, title: topic.title.trim().toLowerCase()))
        .where((entry) => entry.title.isNotEmpty)
        .toList();
    for (final entry in normalizedTopics) {
      if (entry.title == requestedName) return entry.topic;
    }
    for (final entry in normalizedTopics) {
      if (entry.title.contains(requestedName) ||
          requestedName.contains(entry.title)) {
        return entry.topic;
      }
    }
    return null;
  }

  CourseTopic _createRemedialFallbackTopic() {
    final topicName = widget.remedialTopicName?.trim();
    return CourseTopic(
      id: widget.remedialPlanId?.trim().isNotEmpty == true
          ? widget.remedialPlanId!.trim()
          : 'remedial_topic',
      title: topicName?.isNotEmpty == true ? topicName! : 'Remedial practice',
      description: widget.remedialActionItems.join('\n'),
    );
  }

  String _remedialOpeningPrompt(CourseTopic topic) {
    final firstTask = widget.remedialActionItems.isEmpty
        ? 'What do you already understand about this topic?'
        : 'Start with this task: ${widget.remedialActionItems.first}';
    return 'Let us continue your remedial practice on ${topic.title}. $firstTask';
  }

  @override
  Widget build(BuildContext context) {
    final curriculum = context.watch<CurriculumController>();
    final topics =
        curriculum.modules.expand((module) => module.topics).toList();
    final selectedTopicIsEnrolled =
        topics.any((item) => item.id == _selectedTopic?.id);
    final topic = selectedTopicIsEnrolled ? _selectedTopic : null;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Socratic Arena'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Beautiful Header Matching Dashboard
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1D4ED8), Color(0xFF312E81)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: .12)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .16),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.psychology_alt_rounded,
                          color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Socratic Arena',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text('Practice by reasoning aloud',
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: .86),
                                  fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Body Content
            Expanded(
              child: _sessionStarted
                  ? _buildSessionDialogue()
                  : widget.startImmediately
                      ? _loadingInitialRemedialSession || _starting
                          ? _buildRemedialLaunchProgress()
                          : _buildRemedialLaunchError()
                      : _buildTopicSelection(curriculum, topics, topic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRemedialLaunchProgress() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 14),
          Text(
              'Opening remedial practice for ${widget.remedialTopicName ?? widget.initialTopic?.title ?? 'your active plan'}...'),
        ],
      ),
    );
  }

  Widget _buildRemedialLaunchError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.info_outline_rounded, size: 36),
            const SizedBox(height: 12),
            Text(
              _sessionNotice ??
                  'This plan topic is not available in your enrolled modules.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.go('/courses'),
              icon: const Icon(Icons.menu_book_rounded),
              label: const Text('View Modules'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionDialogue() {
    return Column(
      children: [
        if (widget.remedialPlanId != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'REMEDIAL PLAN',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.primaryBlue,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.remedialTopicName ??
                        widget.initialTopic?.title ??
                        'Practice',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  if (widget.remedialActionItems.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    for (final task in widget.remedialActionItems)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text('• $task'),
                      ),
                  ],
                ],
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: Text('Dialogue',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
              ),
              if (_sessionNotice != null)
                Flexible(
                  child: Text(
                    _sessionNotice!,
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: AppTheme.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                ),
            ],
          ),
        ),

        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final message = _messages[index];
              return Align(
                alignment: message.fromGuide
                    ? Alignment.centerLeft
                    : Alignment.centerRight,
                child: Container(
                  constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75),
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: message.fromGuide
                        ? AppTheme.surface
                        : AppTheme.primaryBlue.withValues(alpha: .15),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(message.fromGuide ? 4 : 16),
                      bottomRight: Radius.circular(message.fromGuide ? 16 : 4),
                    ),
                    border: Border.all(
                        color: message.fromGuide
                            ? AppTheme.border
                            : AppTheme.primaryBlue.withValues(alpha: .3)),
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      color: message.fromGuide
                          ? AppTheme.textPrimary
                          : AppTheme.primaryBlue.withValues(alpha: 0.9),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        if (_sending)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: LinearProgressIndicator(),
          ),

        // Input Area
        Material(
          color: Theme.of(context).scaffoldBackgroundColor,
          elevation: 10,
          shadowColor: Colors.black.withValues(alpha: 0.05),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DecibelVisualizer(
                    isRecording: _isRecording,
                    isAgentSpeaking: _isAgentSpeaking,
                    amplitude: _amplitude,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          enabled: !_sending && !_isRecording && !_isCompleted,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendTypedMessage(),
                          maxLines: null,
                          decoration: InputDecoration(
                            hintText: 'Type your answer...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide:
                                  const BorderSide(color: AppTheme.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide:
                                  const BorderSide(color: AppTheme.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide:
                                  const BorderSide(color: AppTheme.primaryBlue),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      MicButton(
                        isRecording: _isRecording,
                        enabled: !_sending && !_isCompleted,
                        onTap: _toggleRecording,
                      ),
                      const SizedBox(width: 8),
                      Container(
                        height: 48,
                        width: 48,
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryBlue,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          tooltip: 'Send answer',
                          onPressed: _sending || _isRecording || _isCompleted
                              ? null
                              : _sendTypedMessage,
                          icon: _sending
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.send_rounded,
                                  color: Colors.white, size: 20),
                        ),
                      ),
                    ],
                  ),
                  if (_isCompleted) ...[
                    const SizedBox(height: 12),
                    if (_backendSession && _sessionId != null) ...[
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _endingSession
                              ? 'Submitting session...'
                              : _autoSubmitPaused
                                  ? 'Auto-submit paused. Review your chat before submitting.'
                                  : 'Auto-submitting results in ${_autoSubmitSeconds}s...',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: FilledButton.icon(
                              onPressed: _endingSession
                                  ? null
                                  : _finishSessionAndReturnToModules,
                              icon: _endingSession
                                  ? const SizedBox.square(
                                      dimension: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(Icons.send_rounded),
                              label: Text(
                                _endingSession ? 'Submitting...' : 'Submit Now',
                              ),
                            ),
                          ),
                          if (!_autoSubmitPaused && !_endingSession) ...[
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _reviewChat,
                                icon: const Icon(Icons.chat_outlined),
                                label: const Text('Review Chat'),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ] else
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: () => context.go('/courses'),
                          icon: const Icon(Icons.menu_book_rounded),
                          label: const Text('Back to Modules'),
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopicSelection(CurriculumController curriculum,
      List<CourseTopic> topics, CourseTopic? topic) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Start Socratic Session',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('Choose a topic to master',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppTheme.textMuted)),
                const SizedBox(height: 20),
                DropdownButtonFormField<CourseTopic>(
                  initialValue: topics.any((item) => item.id == topic?.id)
                      ? topics.firstWhere((item) => item.id == topic?.id)
                      : null,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: 'Learning topic',
                    prefixIcon: const Icon(Icons.menu_book_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: [
                    ...topics.map((item) => DropdownMenuItem(
                          value: item,
                          child: Text(item.title,
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                        )),
                  ],
                  onChanged: _sessionStarted
                      ? null
                      : (value) => setState(() => _selectedTopic = value),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed:
                        topic == null || curriculum.isLoading || _starting
                            ? null
                            : _startSession,
                    icon: _starting
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.play_arrow_rounded),
                    label: const Text('Begin session'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('Available topics',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        if (curriculum.isLoading && topics.isEmpty)
          const Center(
              child: Padding(
            padding: EdgeInsets.all(24),
            child: CircularProgressIndicator(),
          ))
        else if (topics.isEmpty)
          const Card(
            child: ListTile(
              leading: Icon(Icons.info_outline_rounded),
              title: Text('No learning topics are available.'),
            ),
          )
        else
          ...topics.take(6).map((item) => Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.lightbulb_outline_rounded,
                        color: AppTheme.amber),
                  ),
                  title: Text(item.title,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: item.description.isEmpty
                      ? null
                      : Text(item.description,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: IconButton(
                    tooltip: 'Select topic',
                    onPressed: () => setState(() => _selectedTopic = item),
                    icon: const Icon(Icons.arrow_forward_rounded,
                        color: AppTheme.primaryBlue),
                  ),
                ),
              )),
      ],
    );
  }
}

class _DialogueMessage {
  const _DialogueMessage({required this.text, required this.fromGuide});

  final String text;
  final bool fromGuide;
}
