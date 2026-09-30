import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

Color roleColor(String role) {
  switch (role) {
    case 'DepartmentHead':
      return AppTheme.amber;
    case 'Lecturer':
      return AppTheme.indigo;
    case 'Teacher':
      return AppTheme.primaryBlue;
    case 'Student':
      return AppTheme.emerald;
    default:
      return AppTheme.textMuted;
  }
}

String roleLabel(String role) {
  switch (role) {
    case 'DepartmentHead':
      return 'Dept. Head';
    default:
      return role;
  }
}

class RoleBadge extends StatelessWidget {
  const RoleBadge({required this.role, super.key});

  final String role;

  @override
  Widget build(BuildContext context) {
    final color = roleColor(role);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .14),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        roleLabel(role),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class ActiveStatusBadge extends StatelessWidget {
  const ActiveStatusBadge({required this.isActive, super.key});

  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppTheme.emerald : AppTheme.danger;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .14),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isActive ? Icons.check_circle_rounded : Icons.pause_circle_filled_rounded,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            isActive ? 'Active' : 'Inactive',
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
