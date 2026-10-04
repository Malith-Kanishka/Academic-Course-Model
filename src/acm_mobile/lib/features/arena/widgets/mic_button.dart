import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class MicButton extends StatelessWidget {
  const MicButton({
    required this.isRecording,
    this.enabled = true,
    required this.onTapDown,
    required this.onTapUp,
    super.key,
  });

  final bool isRecording;
  final bool enabled;
  final VoidCallback onTapDown;
  final VoidCallback onTapUp;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: enabled ? (_) => onTapDown() : null,
      onTapUp: enabled ? (_) => onTapUp() : null,
      onTapCancel: enabled ? onTapUp : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: isRecording ? 80 : 70,
        height: isRecording ? 80 : 70,
        decoration: BoxDecoration(
          color: !enabled
              ? AppTheme.textMuted.withValues(alpha: 0.4)
              : isRecording
                  ? AppTheme.danger
                  : AppTheme.primaryBlue,
          shape: BoxShape.circle,
          boxShadow: isRecording
              ? [
                  BoxShadow(
                    color: AppTheme.danger.withValues(alpha: 0.5),
                    blurRadius: 20,
                    spreadRadius: 5,
                  )
                ]
              : null,
        ),
        child: Icon(
          Icons.mic_rounded,
          color: enabled ? Colors.white : Colors.white70,
          size: 32,
        ),
      ),
    );
  }
}
