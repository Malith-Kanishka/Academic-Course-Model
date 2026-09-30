import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/state/auth_controller.dart';
import '../state/user_management_controller.dart';
import '../widgets/role_badge.dart';
import '../widgets/user_form_sheet.dart';
import '../widgets/user_list_tile.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final _searchController = TextEditingController();
  String? _busyUserId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserManagementController>().loadUsers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openAddSheet(UserManagementController controller) async {
    final created = await showUserFormSheet(context, controller: controller);
    if (created == true && mounted) {
      final shortId = controller.lastCreatedUser?['shortId']?.toString();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            shortId != null && shortId.isNotEmpty
                ? 'Member created successfully — ID $shortId'
                : 'Member created successfully.',
          ),
        ),
      );
    }
  }

  Future<void> _openEditSheet(
    UserManagementController controller,
    Map<String, dynamic> user,
  ) async {
    final updated = await showUserFormSheet(
      context,
      controller: controller,
      existingUser: user,
    );
    if (updated == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Member updated successfully.')),
      );
    }
  }

  Future<void> _toggleActive(
    UserManagementController controller,
    Map<String, dynamic> user,
  ) async {
    final isActive = user['isActive'] == true;
    if (isActive) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Deactivate member?'),
          content: Text(
            '${user['fullName'] ?? user['email']} will no longer be able to sign in until reactivated.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppTheme.danger),
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Deactivate'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    final id = user['id'].toString();
    setState(() => _busyUserId = id);
    await controller.toggleActive(user);
    if (!mounted) return;
    setState(() => _busyUserId = null);
    if (controller.actionError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(controller.actionError!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<UserManagementController>();
    final currentUserId = context.watch<AuthController>().user?['id']?.toString();
    final users = controller.users;
    final total = users.length;
    final active = users.where((u) => u['isActive'] == true).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('User management'),
        actions: [
          IconButton(
            tooltip: 'Refresh directory',
            onPressed: controller.isLoading ? null : controller.loadUsers,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddSheet(controller),
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: const Text('Add member'),
      ),
      body: RefreshIndicator(
        onRefresh: controller.loadUsers,
        color: AppTheme.primaryBlue,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
          children: [
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    label: 'Total members',
                    value: '$total',
                    color: AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _StatTile(
                    label: 'Active accounts',
                    value: '$active',
                    color: AppTheme.emerald,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _searchController,
              onChanged: controller.searchChanged,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search_rounded),
                hintText: 'Search by email (min. 2 characters)',
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () {
                          _searchController.clear();
                          controller.searchChanged('');
                        },
                      ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: kManagedRoles.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  if (index == 0) {
                    final selected = controller.roleFilter == null;
                    return ChoiceChip(
                      label: const Text('All roles'),
                      selected: selected,
                      showCheckmark: false,
                      onSelected: (_) => controller.setRoleFilter(null),
                      selectedColor: AppTheme.primaryBlue.withValues(alpha: .18),
                      backgroundColor: AppTheme.surface,
                      side: BorderSide(
                          color: selected ? AppTheme.primaryBlue : AppTheme.border),
                      labelStyle: TextStyle(
                        color: selected ? AppTheme.primaryBlue : AppTheme.textMuted,
                        fontWeight: FontWeight.w700,
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(13)),
                    );
                  }
                  final role = kManagedRoles[index - 1];
                  final selected = controller.roleFilter == role;
                  final color = roleColor(role);
                  return ChoiceChip(
                    label: Text(roleLabel(role)),
                    selected: selected,
                    showCheckmark: false,
                    onSelected: (_) =>
                        controller.setRoleFilter(selected ? null : role),
                    selectedColor: color.withValues(alpha: .18),
                    backgroundColor: AppTheme.surface,
                    side: BorderSide(color: selected ? color : AppTheme.border),
                    labelStyle: TextStyle(
                      color: selected ? color : AppTheme.textMuted,
                      fontWeight: FontWeight.w700,
                    ),
                    shape:
                        RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Wrap(
                spacing: 8,
                children: [
                  FilterChip(
                    label: const Text('Active only'),
                    selected: controller.activeFilter == true,
                    onSelected: (selected) =>
                        controller.setActiveFilter(selected ? true : null),
                  ),
                  FilterChip(
                    label: const Text('Inactive only'),
                    selected: controller.activeFilter == false,
                    onSelected: (selected) =>
                        controller.setActiveFilter(selected ? false : null),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (controller.isLoading && users.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 60),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (controller.errorMessage != null && users.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 60),
                child: Column(
                  children: [
                    Icon(Icons.cloud_off_rounded,
                        size: 48, color: Theme.of(context).colorScheme.error),
                    const SizedBox(height: 16),
                    Text(controller.errorMessage!, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: controller.loadUsers,
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              )
            else if (users.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 60),
                child: Column(
                  children: [
                    const Icon(Icons.people_outline_rounded,
                        size: 54, color: AppTheme.textMuted),
                    const SizedBox(height: 16),
                    Text('No members match this filter',
                        style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              )
            else
              ...users.map(
                (user) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: UserListTile(
                    user: user,
                    isSelf: currentUserId != null &&
                        currentUserId == user['id']?.toString(),
                    isBusy: _busyUserId == user['id']?.toString(),
                    onEdit: () => _openEditSheet(controller, user),
                    onToggleActive: () => _toggleActive(controller, user),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w800,
                    )),
            const SizedBox(height: 2),
            Text(label,
                style: Theme.of(context)
                    .textTheme
                    .labelSmall
                    ?.copyWith(color: AppTheme.textMuted)),
          ],
        ),
      );
}
