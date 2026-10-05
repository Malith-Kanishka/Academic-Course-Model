import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/admin_users/data/user_management_repository.dart';
import '../../features/admin_users/screens/user_management_screen.dart';
import '../../features/admin_users/state/user_management_controller.dart';
import '../../features/arena/screens/arena_screen.dart';
import '../../features/arena/data/arena_repository.dart';
import '../../features/auth/screens/profile_screen.dart';
import '../../features/auth/state/auth_controller.dart';
import '../../features/curriculum/data/curriculum_repository.dart';
import '../../features/curriculum/models/course_module.dart';
import '../../features/curriculum/screens/courses_screen.dart';
import '../../features/curriculum/state/curriculum_controller.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/dashboard/models/student_dashboard_summary.dart';
import '../../features/remediation/screens/feedback_dashboard_screen.dart';
import '../../features/remediation/state/remediation_controller.dart';
import '../../features/remediation/services/remediation_service.dart';
import '../../features/remedial/pages/remedial_plans_page.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/curriculum/screens/topic_detail_screen.dart';
import '../../features/evaluations/screens/remedial_plan_screen.dart';
import '../../features/evaluations/state/evaluation_controller.dart';

abstract final class AppRouter {
  static GoRouter create(AuthController authController) => GoRouter(
        initialLocation: '/login',
        refreshListenable: authController,
        redirect: (context, state) {
          if (!authController.isInitialized) return '/login';
          final isLoggedIn = authController.isAuthenticated;
          final path = state.uri.path;
          final role =
              (authController.user?['role'] ?? '').toString().toLowerCase();
          final isDepartmentHead =
              role.contains('head') || role.contains('admin') || role == '0';
          final isStudent = role.contains('student') || role == '3';
          final canReviewApprovals = isDepartmentHead ||
              role.contains('lecturer') ||
              role.contains('professor') ||
              role == '1';
          final extra = state.extra;
          final isStudentPlanDetails = path == '/remedial-plan' &&
              extra is Map &&
              extra['activePlan'] is ActiveRemedialPlanSummary;
          if (!isLoggedIn && path != '/login') return '/login';
          if (isLoggedIn && path == '/login') return '/dashboard';
          if (path == '/admin/users' && !isDepartmentHead) return '/dashboard';
          if (path == '/remedial-plans' && !isStudent) return '/dashboard';
          if ((path == '/evaluations' ||
                  (path == '/remedial-plan' && !isStudentPlanDetails)) &&
              !canReviewApprovals) {
            return '/dashboard';
          }
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
                  path: '/remedial-plans',
                  builder: (context, state) {
                    final extra = state.extra;
                    final args = extra is Map
                        ? Map<String, dynamic>.from(extra)
                        : const <String, dynamic>{};
                    return RemedialPlansPage(
                      initialPlanId: args['planId']?.toString(),
                    );
                  },
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
              final extra = state.extra;
              final args = extra is Map
                  ? Map<String, dynamic>.from(extra)
                  : const <String, dynamic>{};
              final topic = extra is CourseTopic
                  ? extra
                  : args['topic'] is CourseTopic
                      ? args['topic'] as CourseTopic
                      : null;
              final rawActionItems = args['actionItems'];
              return MultiProvider(
                providers: [
                  Provider(create: (_) => ArenaRepository()),
                  ChangeNotifierProvider(
                    create: (_) => CurriculumController(CurriculumRepository()),
                  ),
                ],
                child: ArenaScreen(
                  initialTopic: topic,
                  remedialPlanId: args['planId']?.toString(),
                  remedialTopicName: args['topicName']?.toString(),
                  remedialActionItems: rawActionItems is List
                      ? rawActionItems.map((item) => item.toString()).toList()
                      : const [],
                  startImmediately: args['startImmediately'] == true,
                ),
              );
            },
          ),
          GoRoute(
            path: '/evaluations',
            builder: (context, state) => ChangeNotifierProvider(
              create: (_) => RemediationController(RemediationService()),
              child: const FeedbackDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/users',
            builder: (context, state) => ChangeNotifierProvider(
              create: (_) =>
                  UserManagementController(UserManagementRepository()),
              child: const UserManagementScreen(),
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
          GoRoute(
            path: '/remedial-plan',
            builder: (context, state) {
              final args = state.extra is Map
                  ? Map<String, dynamic>.from(state.extra as Map)
                  : const <String, dynamic>{};
              final rawPlan = args['plan'];
              final plan =
                  rawPlan is Map ? Map<String, dynamic>.from(rawPlan) : null;
              final rawActivePlan = args['activePlan'];
              final activePlan = rawActivePlan is ActiveRemedialPlanSummary
                  ? rawActivePlan
                  : null;
              final rawController = args['controller'];
              final controller =
                  rawController is EvaluationController ? rawController : null;
              return RemedialPlanScreen(
                plan: plan,
                controller: controller,
                activePlan: activePlan,
              );
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
    const titles = ['Home', 'Plans', 'Courses', 'Profile'];
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
              icon: Icon(Icons.dashboard_rounded), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.assignment_turned_in_rounded), label: 'Plans'),
          NavigationDestination(
              icon: Icon(Icons.school_rounded), label: 'Courses'),
          NavigationDestination(
              icon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}
