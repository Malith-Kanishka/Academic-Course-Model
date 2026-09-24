// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:acm_mobile/main.dart';
import 'package:acm_mobile/features/auth/data/auth_repository.dart';
import 'package:acm_mobile/features/auth/state/auth_controller.dart';

void main() {
  testWidgets('renders the login screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthController(AuthRepository()),
        child: const TheGridApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Lecturer'), findsOneWidget);
    expect(find.text('Student'), findsOneWidget);
    expect(find.text('Dept Head'), findsOneWidget);
  });
}
