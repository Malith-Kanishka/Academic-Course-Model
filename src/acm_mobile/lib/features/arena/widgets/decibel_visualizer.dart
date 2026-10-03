import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import 'dart:math' as math;

class DecibelVisualizer extends StatefulWidget {
  const DecibelVisualizer({
    required this.isRecording,
    this.isAgentSpeaking = false,
    this.amplitude = 0.0,
    super.key,
  });

  final bool isRecording;
  final bool isAgentSpeaking;
  final double amplitude;

  @override
  State<DecibelVisualizer> createState() => _DecibelVisualizerState();
}

class _DecibelVisualizerState extends State<DecibelVisualizer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isActive = widget.isRecording || widget.isAgentSpeaking;
    
    return AnimatedContainer(
      duration: const Duration(milliseconds: 100),
      height: 40,
      width: double.infinity,
      alignment: Alignment.center,
      child: isActive
          ? AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(15, (index) {
                    double effectiveAmplitude = widget.isRecording
                        ? widget.amplitude
                        : (widget.isAgentSpeaking ? _controller.value : 0.0);
                    
                    final randomHeight = 10 +
                        (math.Random().nextDouble() *
                            30 *
                            math.max(0.2, effectiveAmplitude));
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 100),
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      width: 4,
                      height: randomHeight.clamp(4.0, 40.0),
                      decoration: BoxDecoration(
                        color: widget.isRecording
                            ? AppTheme.danger
                            : AppTheme.primaryBlue,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    );
                  }),
                );
              },
            )
          : const Text(
              'Hold microphone to speak',
              style: TextStyle(color: AppTheme.textMuted),
            ),
    );
  }
}
