import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../state/auth_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login(String email, String password) async {
    final auth = context.read<AuthController>();
    await auth.login(email, password);
    if (mounted && auth.isAuthenticated) context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _BrandMark(),
                  const SizedBox(height: 32),
                  Text('Welcome back', style: theme.textTheme.headlineMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to your academic command center.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(22),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                  labelText: 'Email',
                                  prefixIcon: Icon(Icons.mail_outline_rounded)),
                              validator: (value) =>
                                  value == null || !value.contains('@')
                                      ? 'Enter a valid email.'
                                      : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: true,
                              decoration: const InputDecoration(
                                  labelText: 'Password',
                                  prefixIcon: Icon(Icons.lock_outline_rounded)),
                              validator: (value) =>
                                  value == null || value.isEmpty
                                      ? 'Enter your password.'
                                      : null,
                            ),
                            if (auth.errorMessage != null) ...[
                              const SizedBox(height: 16),
                              Text(auth.errorMessage!,
                                  style: TextStyle(
                                      color: theme.colorScheme.error)),
                            ],
                            const SizedBox(height: 20),
                            FilledButton.icon(
                              onPressed: auth.isLoading
                                  ? null
                                  : () {
                                      if (_formKey.currentState!.validate()) {
                                        _login(_emailController.text.trim(),
                                            _passwordController.text);
                                      }
                                    },
                              icon: auth.isLoading
                                  ? const SizedBox.square(
                                      dimension: 18,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2))
                                  : const Icon(Icons.login_rounded),
                              label: Text(
                                  auth.isLoading ? 'Signing in...' : 'Sign in'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(children: [
                    const Expanded(child: Divider()),
                    Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text('DEV ACCESS',
                            style: theme.textTheme.labelSmall)),
                    const Expanded(child: Divider())
                  ]),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _QuickLoginButton(
                          label: 'Lecturer',
                          email: 'lecturer@acm.edu',
                          password: 'Lecturer@123',
                          icon: Icons.cast_for_education_rounded,
                          onPressed: _login),
                      _QuickLoginButton(
                          label: 'Student',
                          email: 'student@acm.edu',
                          password: 'Student@123',
                          icon: Icons.school_rounded,
                          onPressed: _login),
                      _QuickLoginButton(
                          label: 'Dept Head',
                          email: 'depthead@acm.edu',
                          password: 'Admin@123',
                          icon: Icons.account_balance_rounded,
                          onPressed: _login),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primaryBlue, AppTheme.indigo],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryBlue.withValues(alpha: 0.28),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(Icons.grid_4x4_rounded, color: Colors.white),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'The Grid',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 3),
              Text(
                'Academic Course Model - Human-in-the-Loop Engine',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.textMuted,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickLoginButton extends StatelessWidget {
  const _QuickLoginButton(
      {required this.label,
      required this.email,
      required this.password,
      required this.icon,
      required this.onPressed});

  final String label;
  final String email;
  final String password;
  final IconData icon;
  final Future<void> Function(String email, String password) onPressed;

  @override
  Widget build(BuildContext context) {
    return _QuickLoginChip(
      label: label,
      email: email,
      password: password,
      icon: icon,
      onPressed: onPressed,
    );
  }
}

class _QuickLoginChip extends StatefulWidget {
  const _QuickLoginChip({
    required this.label,
    required this.email,
    required this.password,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final String email;
  final String password;
  final IconData icon;
  final Future<void> Function(String email, String password) onPressed;

  @override
  State<_QuickLoginChip> createState() => _QuickLoginChipState();
}

class _QuickLoginChipState extends State<_QuickLoginChip> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _pressed ? 0.96 : 1,
      duration: const Duration(milliseconds: 120),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapCancel: () => setState(() => _pressed = false),
        onTapUp: (_) => setState(() => _pressed = false),
        child: OutlinedButton.icon(
          onPressed: () => widget.onPressed(widget.email, widget.password),
          icon: Icon(widget.icon, size: 17),
          label: Text(widget.label),
          style: OutlinedButton.styleFrom(
            backgroundColor: AppTheme.surface,
            side: const BorderSide(color: AppTheme.border),
          ),
        ),
      ),
    );
  }
}
