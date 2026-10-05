import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/student_dashboard_summary.dart';

class ActiveRemedialPlansSection extends StatelessWidget {
  const ActiveRemedialPlansSection({
    required this.plans,
    required this.onContinue,
    required this.onViewAll,
    super.key,
  });

  final List<ActiveRemedialPlanSummary> plans;
  final ValueChanged<ActiveRemedialPlanSummary> onContinue;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Active Remedial Plans',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              TextButton(
                onPressed: onViewAll,
                child: Text('View All (${plans.length})'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 175,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: plans.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) => _CompactPlanCard(
                plan: plans[index],
                onResume: () => onContinue(plans[index]),
              ),
            ),
          ),
        ],
      );
}

class _CompactPlanCard extends StatelessWidget {
  const _CompactPlanCard({required this.plan, required this.onResume});

  final ActiveRemedialPlanSummary plan;
  final VoidCallback onResume;

  @override
  Widget build(BuildContext context) {
    final progress = (plan.dayOfPlan / 7).clamp(0.0, 1.0);
    return SizedBox(
      width: 244,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onResume,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  plan.topicName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 5),
                Text(
                  'Day ${plan.dayOfPlan} of 7',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                ),
                const SizedBox(height: 9),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 5,
                    backgroundColor: AppTheme.border,
                    valueColor: const AlwaysStoppedAnimation(AppTheme.emerald),
                  ),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.tonalIcon(
                    onPressed: onResume,
                    icon: const Icon(Icons.play_arrow_rounded, size: 18),
                    label: const Text('Resume'),
                    style: FilledButton.styleFrom(
                      foregroundColor: AppTheme.emerald,
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
