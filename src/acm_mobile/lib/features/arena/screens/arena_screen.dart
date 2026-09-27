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
import '../services/audio_recorder_service.dart';
import '../widgets/mic_button.dart';
import '../widgets/decibel_visualizer.dart';
import 'dart:io';

class ArenaScreen extends StatefulWidget {
  const ArenaScreen({super.key, this.initialTopic});

  final CourseTopic? initialTopic;

  @override
  State<ArenaScreen> createState() => _ArenaScreenState();
}

class _ArenaScreenState extends State<ArenaScreen> {
  final _messageController = TextEditingController();
  final _messages = <_DialogueMessage>[];
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
  double _amplitude = 0.0;

  @override
  void initState() {
    super.initState();
    _selectedTopic = widget.initialTopic;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<CurriculumController>().loadModules();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) return;

    if (await _audioRecorder.hasPermission()) {
      final path = '${Directory.systemTemp.path}/student_audio.m4a';
      await _audioRecorder.start(
        const RecordConfig(encoder: AudioEncoder.aacLc),
        path: path,
      );
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
           _messages.add(_DialogueMessage(text: response['transcript'] ?? '(Audio transcript)', fromGuide: false));
           _messages.add(_DialogueMessage(text: response['aiText'] ?? '(AI response)', fromGuide: true));
           _sessionNotice = 'AI response received.';
        });
        if (response['audioUrl'] != null) {
           await _audioPlayer.play(UrlSource(response['audioUrl']));
        }
      } else {
        setState(() {
           _messages.add(const _DialogueMessage(text: '(Simulated audio transcript)', fromGuide: false));
           _messages.add(const _DialogueMessage(text: 'I heard you! This is a simulated response.', fromGuide: true));
           _sessionNotice = 'Practice dialogue';
        });
      }
    } catch (e) {
       if (mounted) setState(() => _sessionNotice = 'Audio upload failed');
    } finally {
       if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _startSession() async {
    final topic = _selectedTopic;
    if (topic == null) return;
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
  }

  Future<void> _sendReflection() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _messages.add(_DialogueMessage(text: text, fromGuide: false));
      _messageController.clear();
      _sending = true;
    });
    try {
      final answer = _backendSession
          ? await context.read<ArenaRepository>().sendTurn(
                sessionId: _sessionId!,
                studentText: text,
              )
          : 'What evidence supports that reasoning, and what might change your conclusion?';
      if (!mounted) return;
      setState(() {
        _messages.add(_DialogueMessage(text: answer, fromGuide: true));
        _sessionNotice =
            _backendSession ? 'AI response received.' : 'Practice dialogue';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.add(const _DialogueMessage(
          text:
              'The AI service could not be reached. Check the connection and try again.',
          fromGuide: true,
        ));
        _sessionNotice = 'AI service unavailable';
      });
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final curriculum = context.watch<CurriculumController>();
    final topics =
        curriculum.modules.expand((module) => module.topics).toList();
    final topic = _selectedTopic;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      children: [
        Row(
          children: [
            Expanded(
              child: Text('Socratic arena',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      )),
            ),
            const _StatPill(label: 'Completed', value: '0'),
            const SizedBox(width: 8),
            const _StatPill(label: 'Mastery', value: '0%'),
          ],
        ),
        const SizedBox(height: 8),
        Text(
            'Choose a learning topic, then work through it by reasoning aloud.',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppTheme.textMuted)),
        const SizedBox(height: 18),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBlue.withValues(alpha: .15),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: const Icon(Icons.psychology_alt_rounded,
                          color: AppTheme.primaryBlue),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Start Socratic Session',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800)),
                          Text(topic?.title ?? 'Select a topic to begin',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                DropdownButtonFormField<CourseTopic>(
                  initialValue: topics.any((item) => item.id == topic?.id)
                      ? topics.firstWhere((item) => item.id == topic?.id)
                      : topic,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Learning topic',
                    prefixIcon: Icon(Icons.menu_book_outlined),
                  ),
                  items: [
                    if (topic != null && !topics.any((t) => t.id == topic.id))
                      DropdownMenuItem(value: topic, child: Text(topic.title)),
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
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: _selectedTopic == null || _starting
                      ? null
                      : _sessionStarted
                          ? null
                          : _startSession,
                  icon: _starting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.play_arrow_rounded),
                  label: Text(_sessionStarted
                      ? 'Session in progress'
                      : 'Begin session'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 18),
        if (_sessionStarted) ...[
          Row(
            children: [
              Expanded(
                child: Text('Dialogue',
                    style: Theme.of(context).textTheme.titleMedium),
              ),
              if (_sessionNotice != null)
                Text(_sessionNotice!,
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: AppTheme.textMuted)),
            ],
          ),
          const SizedBox(height: 8),
          ..._messages.map((message) => Align(
                alignment: message.fromGuide
                    ? Alignment.centerLeft
                    : Alignment.centerRight,
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 310),
                  margin: const EdgeInsets.only(bottom: 9),
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(
                    color: message.fromGuide
                        ? AppTheme.surface
                        : AppTheme.primaryBlue.withValues(alpha: .2),
                    borderRadius: BorderRadius.circular(13),
                    border: Border.all(
                        color: message.fromGuide
                            ? AppTheme.border
                            : AppTheme.primaryBlue.withValues(alpha: .35)),
                  ),
                  child: Text(message.text),
                ),
              )),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                children: [
                  DecibelVisualizer(
                    isRecording: _isRecording,
                    amplitude: _amplitude,
                  ),
                  const SizedBox(height: 16),
                  MicButton(
                    isRecording: _isRecording,
                    onTapDown: _startRecording,
                    onTapUp: _stopRecordingAndSend,
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          Text('Available learning topics',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
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
                  child: ListTile(
                    leading: const Icon(Icons.lightbulb_outline_rounded,
                        color: AppTheme.amber),
                    title: Text(item.title),
                    subtitle: item.description.isEmpty
                        ? null
                        : Text(item.description,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: IconButton(
                      tooltip: 'Select topic',
                      onPressed: () => setState(() => _selectedTopic = item),
                      icon: const Icon(Icons.arrow_forward_rounded),
                    ),
                  ),
                )),
        ],
      ],
    );
  }
}

class _DialogueMessage {
  const _DialogueMessage({required this.text, required this.fromGuide});

  final String text;
  final bool fromGuide;
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    fontWeight: FontWeight.w800, color: AppTheme.primaryBlue)),
            Text(label,
                style: Theme.of(context)
                    .textTheme
                    .labelSmall
                    ?.copyWith(color: AppTheme.textMuted)),
          ],
        ),
      );
}
