import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/state/auth_controller.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user ?? const {};
    final firstName = user['firstName']?.toString() ??
        user['name']?.toString().split(' ').first ??
        'Academic explorer';
    final role = user['role']?.toString() ?? 'Authenticated account';
    final initials = firstName.isEmpty ? 'A' : firstName[0].toUpperCase();
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1D4ED8), Color(0xFF312E81)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: .12)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: Colors.white.withValues(alpha: .16),
                foregroundColor: Colors.white,
                child: Text(initials,
                    style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome back',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: .76))),
                    const SizedBox(height: 3),
                    Text(firstName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Text(_displayRole(role),
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: .86),
                            fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Text('At a glance', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 11),
        const Row(
          children: [
            Expanded(
              child: _MetricTile(
                icon: Icons.fact_check_outlined,
                label: 'Review queue',
                value: 'Ready',
                color: AppTheme.amber,
              ),
            ),
            SizedBox(width: 9),
            Expanded(
              child: _MetricTile(
                icon: Icons.layers_outlined,
                label: 'Learning areas',
                value: '02',
                color: AppTheme.primaryBlue,
              ),
            ),
            SizedBox(width: 9),
            Expanded(
              child: _MetricTile(
                icon: Icons.verified_user_outlined,
                label: 'Access',
                value: 'Active',
                color: AppTheme.emerald,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text('Your workspace', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 11),
        _WorkspaceTile(
          icon: Icons.school_rounded,
          title: 'Course workspace',
          subtitle: 'Topics, sessions, and learning progress in one place.',
          tag: 'LEARNING',
          color: AppTheme.primaryBlue,
          onTap: () => context.go('/courses'),
        ),
        const SizedBox(height: 11),
        _WorkspaceTile(
          icon: Icons.fact_check_rounded,
          title: 'Evaluation approvals',
          subtitle: 'Review human-in-the-loop remedial plans when needed.',
          tag: 'HUMAN REVIEW',
          color: AppTheme.emerald,
          onTap: () => context.go('/evaluations'),
        ),
      ],
    );
  }

  static String _displayRole(String role) {
    final normalized = role.toLowerCase();
    if (normalized.contains('head') || normalized.contains('admin')) {
      return 'Department Head';
    }
    if (normalized.contains('lecturer')) return 'Lecturer';
    if (normalized.contains('student')) return 'Student';
    return role;
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        height: 104,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 19, color: color),
            const Spacer(),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.w800,
                    )),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context)
                    .textTheme
                    .labelSmall
                    ?.copyWith(color: AppTheme.textMuted)),
          ],
        ),
      );
}

class _WorkspaceTile extends StatelessWidget {
  const _WorkspaceTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.tag,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String tag;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(17),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: .13),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tag,
                          style:
                              Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: color,
                                    fontWeight: FontWeight.w800,
                                  )),
                      const SizedBox(height: 3),
                      Text(title,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  )),
                      const SizedBox(height: 3),
                      Text(subtitle,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: AppTheme.textMuted)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded),
              ],
            ),
          ),
        ),
      );
}
