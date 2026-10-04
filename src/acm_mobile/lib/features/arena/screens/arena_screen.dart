import 'package:flutter/material.dart';
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
  const ArenaScreen({super.key, this.initialTopic});

  final CourseTopic? initialTopic;

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
  bool _sending = false;
  bool _backendSession = false;
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<CurriculumController>().loadModules();
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

  Future<void> _startRecording() async {
    if (_sending) return;
    await _audioPlayer.stop();
    await _speech.stop();
    if (mounted) setState(() => _isAgentSpeaking = false);
    
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) return;

    if (await _audioRecorder.hasPermission()) {
      if (kIsWeb) {
        await _audioRecorder.start(const RecordConfig(encoder: AudioEncoder.opus), path: '');
      } else {
        final String p = await getAudioTempPath();
        await _audioRecorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: p);
      }
      setState(() {
        _isRecording = true;
      });
      _startAmplitudeTimer();
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
    setState(() => _isRecording = false);
    final path = await _audioRecorder.stop();
    if (path != null) {
      _sendAudio(path);
    }
  }

  Future<void> _sendAudio(String path) async {
    setState(() {
      _sending = true;
      _sessionNotice = 'Analyzing speech...';
    });
    try {
      if (_backendSession) {
        final response = await _audioService.sendAudioTurn(
          sessionId: _sessionId!,
          audioPath: path,
        );
        setState(() {
          _messages.add(_DialogueMessage(text: response['transcript']?.toString() ?? '', fromGuide: false));
          _messages.add(_DialogueMessage(text: response['aiText']?.toString() ?? '', fromGuide: true));
          _sessionNotice = 'AI response received.';
        });
        _scrollToBottom();
        await _speakResponse(response['aiText']?.toString() ?? '');
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
          _sessionNotice = 'Practice dialogue';
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) setState(() => _sessionNotice = 'Audio upload failed');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _sendTypedMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sending) return;
    if (!_backendSession || _sessionId == null) {
      setState(() => _sessionNotice = 'Connect a backend session before sending.');
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
      final response = await context.read<ArenaRepository>().sendTurn(
            sessionId: _sessionId!,
            studentText: text,
          );
      if (!mounted) return;
      setState(() {
        _messages.add(_DialogueMessage(text: response, fromGuide: true));
        _sessionNotice = 'AI response received.';
      });
      _scrollToBottom();
      await _speakResponse(response);
    } catch (_) {
      if (mounted) setState(() => _sessionNotice = 'Message could not be sent.');
    } finally {
      if (mounted) setState(() => _sending = false);
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
    final topic = _selectedTopic;
    if (topic == null) return;
    final enrolledTopics = context
        .read<CurriculumController>()
        .modules
        .expand((module) => module.topics);
    if (!enrolledTopics.any((item) => item.id == topic.id)) {
      setState(() {
        _selectedTopic = null;
        _sessionNotice = 'Choose a topic from your enrolled modules.';
      });
      return;
    }
    setState(() {
      _starting = true;
      _sessionNotice = null;
    });
    final user = context.read<AuthController>().user ?? const {};
    final studentId = (user['id'] ?? user['userId'] ?? user['sub']).toString();
    final isUuid = RegExp(r'^[0-9a-fA-F-]{36}$').hasMatch(studentId);
    final isMockTopic = topic.id.startsWith('sample-');
    try {
      if (isUuid && !isMockTopic) {
        final response = await context.read<ArenaRepository>().startSession(
              studentId: studentId,
              topicId: topic.id,
            );
        _sessionId = (response['id'] ?? response['sessionId'] ?? response['Id'])
            ?.toString();
        _backendSession = _sessionId != null && _sessionId!.isNotEmpty;
        _sessionNotice = _backendSession
            ? 'Session connected to the ACM backend.'
            : 'Practice session started.';
      } else {
        _sessionNotice = 'Practice session started.';
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
        text:
            'Let us explore ${topic.title}. ${topic.description.isNotEmpty ? topic.description : 'What do you already understand about this topic?'}',
        fromGuide: true,
      ));
    });
    _scrollToBottom();
    // Initially speak the first greeting if possible
    await _speakResponse(_messages.last.text);
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
                  border: Border.all(color: Colors.white.withValues(alpha: .12)),
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
                      child: const Icon(Icons.psychology_alt_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Socratic Arena',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Colors.white, fontWeight: FontWeight.w800)),
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
                  : _buildTopicSelection(curriculum, topics, topic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionDialogue() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: Text('Dialogue',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800
                    )),
              ),
              if (_sessionNotice != null)
                Text(_sessionNotice!,
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: AppTheme.textMuted)),
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
                          enabled: !_sending && !_isRecording,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendTypedMessage(),
                          maxLines: null,
                          decoration: InputDecoration(
                            hintText: 'Type your answer...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: const BorderSide(color: AppTheme.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: const BorderSide(color: AppTheme.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: const BorderSide(color: AppTheme.primaryBlue),
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
                        onTapDown: _startRecording,
                        onTapUp: _stopRecordingAndSend,
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
                          onPressed: _sending || _isRecording ? null : _sendTypedMessage,
                          icon: _sending
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopicSelection(
      CurriculumController curriculum, List<CourseTopic> topics, CourseTopic? topic) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                    onPressed: topic == null || curriculum.isLoading || _starting
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
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800
            )),
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
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.lightbulb_outline_rounded,
                        color: AppTheme.amber),
                  ),
                  title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: item.description.isEmpty
                      ? null
                      : Text(item.description,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: IconButton(
                    tooltip: 'Select topic',
                    onPressed: () => setState(() => _selectedTopic = item),
                    icon: const Icon(Icons.arrow_forward_rounded, color: AppTheme.primaryBlue),
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
