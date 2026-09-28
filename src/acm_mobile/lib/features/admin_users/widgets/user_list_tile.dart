import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import 'role_badge.dart';

class UserListTile extends StatelessWidget {
  const UserListTile({
    required this.user,
    required this.onEdit,
    required this.onToggleActive,
    this.isSelf = false,
    this.isBusy = false,
    super.key,
  });

  final Map<String, dynamic> user;
  final VoidCallback onEdit;
  final VoidCallback onToggleActive;
  final bool isSelf;
  final bool isBusy;

  @override
  Widget build(BuildContext context) {
    final fullName = (user['fullName'] ?? '').toString();
    final email = (user['email'] ?? '').toString();
    final role = (user['role'] ?? '').toString();
    final shortId = (user['shortId'] ?? '').toString();
    final isActive = user['isActive'] == true;
    final initials = fullName.isEmpty
        ? (email.isNotEmpty ? email[0].toUpperCase() : '?')
        : fullName
            .split(RegExp(r'\s+'))
            .where((part) => part.isNotEmpty)
            .take(2)
            .map((part) => part[0].toUpperCase())
            .join();

    return Card(
      child: InkWell(
        onTap: onEdit,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: roleColor(role).withValues(alpha: .16),
                foregroundColor: roleColor(role),
                child: Text(initials,
                    style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            fullName.isEmpty ? 'Unnamed user' : fullName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        if (shortId.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.border.withValues(alpha: .4),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              shortId,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                fontFeatures: [FontFeature.tabularFigures()],
                                color: AppTheme.textMuted,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        RoleBadge(role: role),
                        ActiveStatusBadge(isActive: isActive),
                        if (isSelf)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.textMuted.withValues(alpha: .14),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text('You',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textMuted)),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  IconButton(
                    tooltip: 'Edit member',
                    onPressed: isBusy ? null : onEdit,
                    icon: const Icon(Icons.edit_outlined),
                  ),
                  isBusy
                      ? const Padding(
                          padding: EdgeInsets.all(10),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : IconButton(
                          tooltip: isSelf
                              ? 'You cannot deactivate your own account'
                              : (isActive ? 'Deactivate' : 'Activate'),
                          onPressed: isSelf ? null : onToggleActive,
                          icon: Icon(
                            isActive
                                ? Icons.block_rounded
                                : Icons.check_circle_outline_rounded,
                            color: isSelf
                                ? AppTheme.textMuted
                                : (isActive
                                    ? AppTheme.danger
                                    : AppTheme.emerald),
                          ),
                        ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
