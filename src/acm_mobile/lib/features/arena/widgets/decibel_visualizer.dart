import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import 'dart:math' as math;

class DecibelVisualizer extends StatelessWidget {
  const DecibelVisualizer({
    required this.isRecording,
    this.amplitude = 0.0,
    super.key,
  });

  final bool isRecording;
  final double amplitude;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 100),
      height: 40,
      width: double.infinity,
      alignment: Alignment.center,
      child: isRecording
          ? Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(15, (index) {
                // Simplified visualizer using random height based on amplitude
                final randomHeight = 10 + (math.Random().nextDouble() * 30 * math.max(0.2, amplitude));
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 100),
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  width: 4,
                  height: randomHeight.clamp(4.0, 40.0),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue,
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              }),
            )
          : const Text(
              'Hold microphone to speak',
              style: TextStyle(color: AppTheme.textMuted),
            ),
    );
  }
}
