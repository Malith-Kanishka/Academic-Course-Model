import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/student_dashboard_summary.dart';

class ActiveRemedialProgressBanner extends StatelessWidget {
  const ActiveRemedialProgressBanner({
    required this.plan,
    required this.onContinue,
    super.key,
  });

  final ActiveRemedialPlanSummary plan;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final progress = plan.dayOfPlan / 7;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF17374A), Color(0xFF161B2E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.emerald.withValues(alpha: .35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome_rounded,
                  color: AppTheme.emerald, size: 20),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  'Active Remedial Plan — Day ${plan.dayOfPlan} of 7',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Topic: ${plan.topicName}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textMuted,
                ),
          ),
          const SizedBox(height: 13),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 7,
              backgroundColor: Colors.white.withValues(alpha: .1),
              valueColor: const AlwaysStoppedAnimation(AppTheme.emerald),
            ),
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: onContinue,
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text('Continue Remedial Practice'),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.emerald,
              foregroundColor: const Color(0xFF07131A),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ),
    );
  }
}
