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
      themeMode: ThemeMode.system,
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
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        children: [
          Text('Good to see you,',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(
            user?['firstName']?.toString() ?? 'Academic explorer',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 26,
                    child: Icon(Icons.auto_awesome_rounded),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Workspace ready',
                            style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 4),
                        Text(user?['role']?.toString() ??
                            'Authenticated account'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Your command center',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          const _DashboardTile(
            icon: Icons.school_rounded,
            title: 'Course workspace',
            subtitle: 'Topics, sessions, and learning progress in one place.',
            color: AppTheme.primaryBlue,
          ),
          const SizedBox(height: 12),
          _DashboardTile(
            icon: Icons.fact_check_rounded,
            title: 'Evaluation approvals',
            subtitle: 'Review human-in-the-loop remedial plans when needed.',
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

class _DashboardTile extends StatelessWidget {
  const _DashboardTile(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.color,
      this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.14),
          foregroundColor: color,
          child: Icon(icon),
        ),
        title: Text(title),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(subtitle),
        ),
        trailing: const Icon(Icons.arrow_forward_rounded),
      ),
    );
  }
}
