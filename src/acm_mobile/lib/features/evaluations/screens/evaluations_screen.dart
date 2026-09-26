import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/evaluation_controller.dart';
import 'remedial_plan_screen.dart';

class EvaluationsScreen extends StatefulWidget {
  const EvaluationsScreen({super.key});

  @override
  State<EvaluationsScreen> createState() => _EvaluationsScreenState();
}

class _EvaluationsScreenState extends State<EvaluationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EvaluationController>().loadPendingApprovals();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<EvaluationController>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Evaluation approvals'),
        actions: [
          IconButton(
            tooltip: 'Refresh approvals',
            onPressed:
                controller.isLoading ? null : controller.loadPendingApprovals,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: controller.loadPendingApprovals,
        child: _ApprovalBody(controller: controller),
      ),
    );
  }
}

class _ApprovalBody extends StatelessWidget {
  const _ApprovalBody({required this.controller});

  final EvaluationController controller;

  @override
  Widget build(BuildContext context) {
    if (controller.isLoading && controller.pendingPlans.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (controller.errorMessage != null && controller.pendingPlans.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 100),
          Icon(Icons.cloud_off_rounded,
              size: 48, color: Theme.of(context).colorScheme.error),
          const SizedBox(height: 16),
          Center(child: Text(controller.errorMessage!)),
          const SizedBox(height: 16),
          Center(
            child: FilledButton(
              onPressed: controller.loadPendingApprovals,
              child: const Text('Try again'),
            ),
          ),
        ],
      );
    }
    if (controller.pendingPlans.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: const [
          SizedBox(height: 100),
          Icon(Icons.inbox_rounded, size: 52),
          SizedBox(height: 16),
          Center(child: Text('No remedial plans need approval.')),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: controller.pendingPlans.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final plan = controller.pendingPlans[index];
        return _ApprovalCard(
          plan: plan,
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => RemedialPlanScreen(
                  plan: plan,
                  controller: controller,
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  const _ApprovalCard({required this.plan, required this.onTap});

  final Map<String, dynamic> plan;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final report = _map(plan['masteryReport']);
    final score = _number(report['masteryScore']);
    final risk = score < 65 || _list(report['flaggedMisconceptions']).isNotEmpty
        ? 'High risk'
        : 'Review';
    final riskColor = risk == 'High risk'
        ? Theme.of(context).colorScheme.error
        : Colors.orange.shade700;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      report['topicName']?.toString() ?? 'Untitled topic',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  _Badge(label: risk, color: riskColor),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.person_outline_rounded, size: 18),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text('Student ${plan['studentId'] ?? 'Unknown'}'),
                  ),
                  _Badge(
                    label: '$score% mastery',
                    color: score < 65 ? riskColor : Colors.green.shade700,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${_list(plan['actionItems']).length} action item(s) · Tap to inspect evidence',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(label,
            style: TextStyle(
                color: color, fontSize: 12, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

Map<String, dynamic> _map(dynamic value) =>
    value is Map<String, dynamic> ? value : <String, dynamic>{};

List<dynamic> _list(dynamic value) => value is List<dynamic> ? value : const [];

int _number(dynamic value) =>
    value is num ? value.round() : int.tryParse('$value') ?? 0;
