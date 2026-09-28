import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_mode_controller.dart';
import '../state/auth_controller.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user ?? const <String, dynamic>{};
    final firstName = user['firstName']?.toString() ?? '';
    final lastName = user['lastName']?.toString() ?? '';
    final fullName =
        [firstName, lastName].where((part) => part.isNotEmpty).join(' ');
    final name = fullName.isNotEmpty
        ? fullName
        : user['name']?.toString() ?? 'Academic explorer';
    final email = user['email']?.toString() ?? 'Email not available';
    final role = user['role']?.toString() ?? 'Authenticated account';
    final userId = (user['id'] ?? user['userId'] ?? user['sub'])?.toString() ??
        'Unavailable';
    final initials = name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();
    final themeMode = context.watch<ThemeModeController>();

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppTheme.primaryBlue.withValues(alpha: .18),
                  foregroundColor: AppTheme.primaryBlue,
                  child: Text(initials.isEmpty ? 'A' : initials,
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 3),
                      Text(email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: AppTheme.textMuted)),
                      const SizedBox(height: 9),
                      _RoleBadge(role: role),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('System information',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        _InfoCard(
          icon: Icons.verified_user_outlined,
          label: 'Active session',
          value: auth.isAuthenticated ? 'Signed in' : 'No active session',
          color: AppTheme.emerald,
        ),
        const SizedBox(height: 9),
        _InfoCard(
          icon: Icons.admin_panel_settings_outlined,
          label: 'Role privileges',
          value: _privileges(role),
          color: AppTheme.amber,
        ),
        const SizedBox(height: 9),
        _InfoCard(
          icon: Icons.dns_outlined,
          label: 'Connected backend',
          value: ApiConstants.baseUrl,
          color: AppTheme.primaryBlue,
        ),
        const SizedBox(height: 24),
        Text('Preferences & security',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.key_rounded),
                title: const Text('Security & tokens'),
                subtitle: Text('User ID: $userId'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => _showSecurity(context, auth.accessToken),
              ),
              const Divider(height: 1, indent: 16, endIndent: 16),
              SwitchListTile(
                secondary: const Icon(Icons.dark_mode_outlined),
                title: const Text('Dark mode'),
                value: themeMode.isDark,
                onChanged: (_) => themeMode.toggle(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        OutlinedButton.icon(
          onPressed: () async {
            await context.read<AuthController>().logout();
            if (context.mounted) context.go('/login');
          },
          icon: const Icon(Icons.logout_rounded),
          label: const Text('Log out'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.danger,
            side: const BorderSide(color: AppTheme.danger),
          ),
        ),
      ],
    );
  }

  static String _privileges(String role) {
    final normalized = role.toLowerCase();
    if (normalized.contains('head') || normalized.contains('admin')) {
      return 'Curriculum management and evaluation approvals';
    }
    if (normalized.contains('lecturer')) {
      return 'Teaching and curriculum access';
    }
    if (normalized.contains('student')) {
      return 'Learning sessions and progress';
    }
    return 'Standard authenticated access';
  }

  static void _showSecurity(BuildContext context, String? token) {
    var expiresAt = 'Not available';
    if (token != null) {
      try {
        final claims = jsonDecode(utf8.decode(base64Url.decode(
          base64Url.normalize(token.split('.')[1]),
        ))) as Map<String, dynamic>;
        final expiry = claims['exp'];
        if (expiry is num) {
          expiresAt = DateTime.fromMillisecondsSinceEpoch(
            expiry.toInt() * 1000,
            isUtc: true,
          ).toLocal().toString();
        }
      } catch (_) {
        expiresAt = 'Token claims unavailable';
      }
    }
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Security & tokens'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Access token is stored securely on this device.'),
            const SizedBox(height: 14),
            Text('Status: ${token == null ? 'Unavailable' : 'Present'}'),
            const SizedBox(height: 6),
            Text('Expires: $expiresAt'),
            const SizedBox(height: 10),
            Text('Token value is hidden for your security.',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppTheme.textMuted)),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close')),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  const _RoleBadge({required this.role});

  final String role;

  @override
  Widget build(BuildContext context) {
    final normalized = role.toLowerCase();
    final color = normalized.contains('head') || normalized.contains('admin')
        ? AppTheme.amber
        : normalized.contains('lecturer')
            ? AppTheme.indigo
            : normalized.contains('student')
                ? AppTheme.emerald
                : AppTheme.primaryBlue;
    final label = normalized.contains('head') || normalized.contains('admin')
        ? 'Department Head'
        : normalized.contains('lecturer')
            ? 'Lecturer'
            : normalized.contains('student')
                ? 'Student'
                : role;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .14),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
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
  Widget build(BuildContext context) => Card(
        child: ListTile(
          leading: Icon(icon, color: color),
          title: Text(label, style: Theme.of(context).textTheme.labelMedium),
          subtitle: Text(value,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppTheme.textMuted)),
        ),
      );
}
