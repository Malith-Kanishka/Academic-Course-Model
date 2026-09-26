import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class ModuleProgressIndicator extends StatelessWidget {
  const ModuleProgressIndicator({
    required this.totalTopics,
    required this.completedTopics,
    super.key,
  });

  final int totalTopics;
  final int completedTopics;

  @override
  Widget build(BuildContext context) {
    final progress = totalTopics == 0 ? 0.0 : completedTopics / totalTopics;
    
    return Row(
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            value: progress,
            backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.2),
            color: AppTheme.emerald,
            strokeWidth: 3,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$completedTopics/$totalTopics',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppTheme.emerald,
              ),
        ),
      ],
    );
  }
}
