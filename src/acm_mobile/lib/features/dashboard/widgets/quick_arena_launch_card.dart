import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class QuickArenaLaunchCard extends StatelessWidget {
  const QuickArenaLaunchCard({
    required this.moduleTitle,
    required this.enabled,
    required this.onLaunch,
    super.key,
  });

  final String? moduleTitle;
  final bool enabled;
  final VoidCallback onLaunch;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF161B2E),
          borderRadius: BorderRadius.circular(16),
          border:
              Border.all(color: AppTheme.primaryBlue.withValues(alpha: .32)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue.withValues(alpha: .16),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(Icons.graphic_eq_rounded,
                  color: AppTheme.primaryBlue),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Launch Socratic Voice Practice',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    enabled
                        ? 'Continue with ${moduleTitle ?? 'your enrolled course'}'
                        : 'Enroll in a module to start practicing',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textMuted,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              tooltip: 'Start voice practice',
              onPressed: enabled ? onLaunch : null,
              icon: const Icon(Icons.arrow_forward_rounded),
            ),
          ],
        ),
      );
}
