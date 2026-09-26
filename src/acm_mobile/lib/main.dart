import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_controller.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/state/auth_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authController = AuthController(AuthRepository());

  try {
    await authController.initialize();
  } catch (_) {
    authController.markInitializationComplete();
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authController),
        ChangeNotifierProvider(create: (_) => ThemeModeController()),
      ],
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
    _router = AppRouter.create(authController);
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = context.watch<ThemeModeController>().mode;
    return MaterialApp.router(
      title: 'The Grid',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      routerConfig: _router,
    );
  }
}
