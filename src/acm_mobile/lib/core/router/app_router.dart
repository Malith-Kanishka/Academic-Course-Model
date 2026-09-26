import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/arena/screens/arena_screen.dart';
import '../../features/arena/data/arena_repository.dart';
import '../../features/auth/screens/profile_screen.dart';
import '../../features/auth/state/auth_controller.dart';
import '../../features/curriculum/data/curriculum_repository.dart';
import '../../features/curriculum/models/course_module.dart';
import '../../features/curriculum/screens/courses_screen.dart';
import '../../features/curriculum/state/curriculum_controller.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/evaluations/data/evaluation_repository.dart';
import '../../features/evaluations/screens/evaluations_screen.dart';
import '../../features/evaluations/state/evaluation_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/curriculum/screens/topic_detail_screen.dart';

abstract final class AppRouter {
  static GoRouter create(AuthController authController) => GoRouter(
        initialLocation: '/login',
        refreshListenable: authController,
        redirect: (context, state) {
          if (!authController.isInitialized) return '/login';
          final isLoggedIn = authController.isAuthenticated;
          final path = state.uri.path;
          if (!isLoggedIn && path != '/login') return '/login';
          if (isLoggedIn && path == '/login') return '/dashboard';
          return null;
        },
        routes: [
          GoRoute(
            path: '/login',
            builder: (context, state) => const LoginScreen(),
          ),
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) =>
                ChangeNotifierProvider(
              create: (_) => CurriculumController(CurriculumRepository()),
              child: DashboardShell(navigationShell: navigationShell),
            ),
            branches: [
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/dashboard',
                  builder: (context, state) => const DashboardScreen(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/courses',
                  builder: (context, state) => const CoursesScreen(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/profile',
                  builder: (context, state) => const ProfileScreen(),
                ),
              ]),
            ],
          ),
          GoRoute(
            path: '/arena',
            builder: (context, state) {
              final topic = state.extra is CourseTopic
                  ? state.extra as CourseTopic
                  : null;
              return MultiProvider(
                providers: [
                  Provider(create: (_) => ArenaRepository()),
                  ChangeNotifierProvider(
                    create: (_) => CurriculumController(CurriculumRepository()),
                  ),
                ],
                child: ArenaScreen(initialTopic: topic),
              );
            },
          ),
          GoRoute(
            path: '/evaluations',
            builder: (context, state) => ChangeNotifierProvider(
              create: (_) => EvaluationController(EvaluationRepository()),
              child: const EvaluationsScreen(),
            ),
          ),
          GoRoute(
            path: '/topic',
            builder: (context, state) {
              final topic = state.extra is CourseTopic
                  ? state.extra as CourseTopic
                  : const CourseTopic(id: '', title: 'Error', description: '');
              return TopicDetailScreen(topic: topic);
            },
          ),
        ],
      );
}

class DashboardShell extends StatelessWidget {
  const DashboardShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    const titles = ['The Grid', 'Courses', 'Profile'];
    return Scaffold(
      appBar: AppBar(
        title: Text(titles[navigationShell.currentIndex]),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => context.read<AuthController>().logout(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
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
