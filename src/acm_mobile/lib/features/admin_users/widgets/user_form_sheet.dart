import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../state/user_management_controller.dart';
import 'role_badge.dart';

final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final _passwordPattern =
    RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$');

Future<bool?> showUserFormSheet(
  BuildContext context, {
  required UserManagementController controller,
  Map<String, dynamic>? existingUser,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _UserFormSheet(
      controller: controller,
      existingUser: existingUser,
    ),
  );
}

class _UserFormSheet extends StatefulWidget {
  const _UserFormSheet({required this.controller, this.existingUser});

  final UserManagementController controller;
  final Map<String, dynamic>? existingUser;

  @override
  State<_UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends State<_UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _passwordController;
  late String _role;
  bool _obscurePassword = true;

  bool get _isEdit => widget.existingUser != null;

  @override
  void initState() {
    super.initState();
    final user = widget.existingUser;
    _emailController = TextEditingController(text: user?['email']?.toString() ?? '');
    _firstNameController =
        TextEditingController(text: user?['firstName']?.toString() ?? '');
    _lastNameController =
        TextEditingController(text: user?['lastName']?.toString() ?? '');
    _passwordController = TextEditingController();
    _role = user?['role']?.toString() ?? kManagedRoles[1];
  }

  @override
  void dispose() {
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final bool success;
    if (_isEdit) {
      success = await widget.controller.updateUser(
        widget.existingUser!['id'].toString(),
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        role: _role,
      );
    } else {
      success = await widget.controller.createUser(
        email: _emailController.text.trim(),
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        password: _passwordController.text,
        role: _role,
      );
    }

    if (!mounted) return;
    if (success) {
      Navigator.of(context).pop(true);
    } else {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: DraggableScrollableSheet(
            initialChildSize: 0.72,
            minChildSize: 0.4,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Container(
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Form(
                key: _formKey,
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 18),
                        decoration: BoxDecoration(
                          color: AppTheme.border,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    Text(
                      _isEdit ? 'Edit member' : 'Add new member',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isEdit
                          ? 'Update this member\'s details and access role.'
                          : 'Create a directory account with a temporary password.',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 20),
                    if (controller.actionError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.danger.withValues(alpha: .1),
                          borderRadius: BorderRadius.circular(12),
                          border:
                              Border.all(color: AppTheme.danger.withValues(alpha: .3)),
                        ),
                        child: Text(
                          controller.actionError!,
                          style: const TextStyle(color: AppTheme.danger),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _firstNameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'First name'),
                      validator: (value) {
                        final trimmed = value?.trim() ?? '';
                        if (trimmed.isEmpty) return 'First name is required';
                        if (trimmed.length > 100) return 'First name is too long';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _lastNameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Last name'),
                      validator: (value) {
                        final trimmed = value?.trim() ?? '';
                        if (trimmed.isEmpty) return 'Last name is required';
                        if (trimmed.length > 100) return 'Last name is too long';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _emailController,
                      enabled: !_isEdit,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Institutional email',
                        helperText: _isEdit ? 'Email cannot be changed' : null,
                      ),
                      validator: (value) {
                        if (_isEdit) return null;
                        final trimmed = value?.trim() ?? '';
                        if (trimmed.isEmpty) return 'Email is required';
                        if (!_emailPattern.hasMatch(trimmed)) {
                          return 'Enter a valid email address';
                        }
                        return null;
                      },
                    ),
                    if (!_isEdit) ...[
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Temporary password',
                          helperText:
                              'Min 8 characters, with upper, lower, digit & special character.',
                          helperMaxLines: 2,
                          suffixIcon: IconButton(
                            icon: Icon(_obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined),
                            onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                        validator: (value) {
                          final v = value ?? '';
                          if (v.isEmpty) return 'Password is required';
                          if (!_passwordPattern.hasMatch(v)) {
                            return 'Needs upper, lower, digit & special character';
                          }
                          return null;
                        },
                      ),
                    ],
                    const SizedBox(height: 14),
                    Text('Access role',
                        style: Theme.of(context).textTheme.labelLarge),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: kManagedRoles.map((role) {
                        final selected = _role == role;
                        final color = roleColor(role);
                        return ChoiceChip(
                          label: Text(roleLabel(role)),
                          selected: selected,
                          showCheckmark: false,
                          onSelected: (_) => setState(() => _role = role),
                          selectedColor: color.withValues(alpha: .18),
                          backgroundColor: AppTheme.surface,
                          side: BorderSide(
                              color: selected ? color : AppTheme.border),
                          labelStyle: TextStyle(
                            color: selected ? color : AppTheme.textMuted,
                            fontWeight: FontWeight.w700,
                          ),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(13)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: controller.isMutating ? null : _submit,
                      child: controller.isMutating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : Text(_isEdit ? 'Save changes' : 'Create user'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
