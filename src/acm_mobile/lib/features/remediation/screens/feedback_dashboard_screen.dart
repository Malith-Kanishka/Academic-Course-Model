import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/state/auth_controller.dart';
import '../state/remediation_controller.dart';
import '../widgets/remedial_action_card.dart';

class FeedbackDashboardScreen extends StatefulWidget {
  const FeedbackDashboardScreen({super.key});

  @override
  State<FeedbackDashboardScreen> createState() => _FeedbackDashboardScreenState();
}

class _FeedbackDashboardScreenState extends State<FeedbackDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthController>().user ?? const {};
      final studentId = (user['id'] ?? user['userId'] ?? user['sub']).toString();
      context.read<RemediationController>().loadPlans(studentId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<RemediationController>();
    return Scaffold(
      appBar: AppBar(title: const Text('Action Required')),
      body: controller.isLoading && controller.approvedPlans.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : controller.approvedPlans.isEmpty
              ? const Center(child: Text('No remedial actions required! You are all caught up.'))
              : RefreshIndicator(
                  onRefresh: () async {
                    final user = context.read<AuthController>().user ?? const {};
                    final studentId = (user['id'] ?? user['userId'] ?? user['sub']).toString();
                    await controller.loadPlans(studentId);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: controller.approvedPlans.length,
                    itemBuilder: (context, index) {
                      return RemedialActionCard(plan: controller.approvedPlans[index]);
                    },
                  ),
                ),
    );
  }
}
