import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class StudentStatsRow extends StatelessWidget {
  const StudentStatsRow({
    required this.practiceStreakDays,
    required this.completedVoiceSessions,
    required this.averageMastery,
    super.key,
  });

  final int practiceStreakDays;
  final int completedVoiceSessions;
  final double? averageMastery;

  @override
  Widget build(BuildContext context) {
    final stats = [
      _StudentStat(
        icon: Icons.local_fire_department_rounded,
        label: 'Practice streak',
        value:
            '$practiceStreakDays ${practiceStreakDays == 1 ? 'Day' : 'Days'}',
        color: AppTheme.amber,
      ),
      _StudentStat(
        icon: Icons.mic_rounded,
        label: 'Voice sessions',
        value: '$completedVoiceSessions Completed',
        color: AppTheme.primaryBlue,
      ),
      _StudentStat(
        icon: Icons.track_changes_rounded,
        label: 'Avg. mastery',
        value: averageMastery == null ? '—' : '${averageMastery!.round()}%',
        color: AppTheme.emerald,
      ),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (var index = 0; index < stats.length; index++) ...[
            if (index > 0) const SizedBox(width: 10),
            _StatCard(stat: stats[index]),
          ],
        ],
      ),
    );
  }
}

class _StudentStat {
  const _StudentStat({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.stat});

  final _StudentStat stat;

  @override
  Widget build(BuildContext context) => Container(
        width: 158,
        height: 112,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF161B2E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: .08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(stat.icon, color: stat.color, size: 20),
            const Spacer(),
            Text(
              stat.value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 2),
            Text(
              stat.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppTheme.textMuted,
                  ),
            ),
          ],
        ),
      );
}
