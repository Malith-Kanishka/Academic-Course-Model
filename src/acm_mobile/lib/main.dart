import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/state/auth_controller.dart';
import 'features/evaluations/data/evaluation_repository.dart';
import 'features/evaluations/screens/evaluations_screen.dart';
import 'features/evaluations/state/evaluation_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authController = AuthController(AuthRepository());

  try {
    await authController.initialize();
  } catch (_) {
    authController.markInitializationComplete();
  }

  runApp(
    ChangeNotifierProvider.value(
      value: authController,
      child: const TheGridApp(),
    ),
  );
}

class TheGridApp extends StatefulWidget {
  const TheGridApp({super.key});

  @override
  State<TheGridApp> createState() => _TheGridAppState();
}

class _TheGridAppState extends State<TheGridApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final authController = context.read<AuthController>();
    _router = GoRouter(
      initialLocation: '/login',
      refreshListenable: authController,
      redirect: (context, state) {
        if (!authController.isInitialized) return '/login';
        final loggedIn = authController.isAuthenticated;
        final path = state.uri.path;
        if (!loggedIn && path != '/login') return '/login';
        if (loggedIn && path == '/login') return '/dashboard';
        return null;
      },
      routes: [
        GoRoute(
            path: '/login', builder: (context, state) => const LoginScreen()),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardShell(),
        ),
        GoRoute(
          path: '/evaluations',
          builder: (context, state) => ChangeNotifierProvider(
            create: (_) => EvaluationController(EvaluationRepository()),
            child: const EvaluationsScreen(),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'The Grid',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: _router,
    );
  }
}

class DashboardShell extends StatelessWidget {
  const DashboardShell({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;
    final firstName = user?['firstName']?.toString() ?? 'Academic explorer';
    final lastName = user?['lastName']?.toString() ?? '';
    final fullName = '$firstName $lastName'.trim();
    final role = user?['role']?.toString() ?? 'Authenticated account';
    final initials = [firstName, lastName]
        .where((name) => name.isNotEmpty)
        .map((name) => name[0].toUpperCase())
        .take(2)
        .join();

    return Scaffold(
      appBar: AppBar(
        title: const Text('The Grid'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => context.read<AuthController>().logout(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1D4ED8), Color(0xFF312E81)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 27,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                  foregroundColor: Colors.white,
                  child: Text(initials.isEmpty ? 'G' : initials,
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome back',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.76),
                                  )),
                      const SizedBox(height: 3),
                      Text(fullName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  )),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.13),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(_displayRole(role),
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text('At a glance', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          const Row(
            children: [
              Expanded(
                child: _MetricTile(
                    icon: Icons.fact_check_outlined,
                    label: 'Review queue',
                    value: 'Ready',
                    color: AppTheme.amber),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _MetricTile(
                    icon: Icons.layers_outlined,
                    label: 'Learning areas',
                    value: '02',
                    color: AppTheme.primaryBlue),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _MetricTile(
                    icon: Icons.verified_user_outlined,
                    label: 'Access',
                    value: 'Active',
                    color: AppTheme.emerald),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Your workspace', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          const _DashboardTile(
            icon: Icons.school_rounded,
            title: 'Course workspace',
            subtitle: 'Topics, sessions, and learning progress in one place.',
            tag: 'LEARNING',
            color: AppTheme.primaryBlue,
          ),
          const SizedBox(height: 12),
          _DashboardTile(
            icon: Icons.fact_check_rounded,
            title: 'Evaluation approvals',
            subtitle: 'Review human-in-the-loop remedial plans when needed.',
            tag: 'HUMAN REVIEW',
            color: AppTheme.emerald,
            onTap: () => context.go('/evaluations'),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.grid_view_rounded), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.school_outlined), label: 'Courses'),
          NavigationDestination(
              icon: Icon(Icons.person_outline_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}

String _displayRole(String role) {
  final normalized = role.toLowerCase();
  if (normalized.contains('head') || normalized.contains('admin')) {
    return 'Department Head';
  }
  if (normalized.contains('lecturer')) return 'Lecturer';
  if (normalized.contains('student')) return 'Student';
  return role;
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
  Widget build(BuildContext context) {
    return Container(
      height: 104,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
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
}

class _DashboardTile extends StatelessWidget {
  const _DashboardTile(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.tag,
      required this.color,
      this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final String tag;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tag,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: color,
                              fontWeight: FontWeight.w800,
                            )),
                    const SizedBox(height: 4),
                    Text(title,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                )),
                    const SizedBox(height: 4),
                    Text(subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.textMuted,
                            )),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
