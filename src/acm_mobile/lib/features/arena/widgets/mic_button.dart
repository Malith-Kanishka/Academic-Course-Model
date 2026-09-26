import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class MicButton extends StatelessWidget {
  const MicButton({
    required this.isRecording,
    required this.onTapDown,
    required this.onTapUp,
    super.key,
  });

  final bool isRecording;
  final VoidCallback onTapDown;
  final VoidCallback onTapUp;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => onTapDown(),
      onTapUp: (_) => onTapUp(),
      onTapCancel: () => onTapUp(),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: isRecording ? 80 : 70,
        height: isRecording ? 80 : 70,
        decoration: BoxDecoration(
          color: isRecording ? AppTheme.rose : AppTheme.primaryBlue,
          shape: BoxShape.circle,
          boxShadow: isRecording
              ? [
                  BoxShadow(
                    color: AppTheme.rose.withValues(alpha: 0.5),
                    blurRadius: 20,
                    spreadRadius: 5,
                  )
                ]
              : null,
        ),
        child: const Icon(
          Icons.mic_rounded,
          color: Colors.white,
          size: 32,
        ),
      ),
    );
  }
}
