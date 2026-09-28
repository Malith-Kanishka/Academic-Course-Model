import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../state/evaluation_controller.dart';
import 'remedial_plan_screen.dart';

class EvaluationsScreen extends StatefulWidget {
  const EvaluationsScreen({super.key});

  @override
  State<EvaluationsScreen> createState() => _EvaluationsScreenState();
}

class _EvaluationsScreenState extends State<EvaluationsScreen> {
  static const _filters = ['All', 'High risk', 'Pending', 'Approved'];
  String _selectedFilter = 'All';

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
    final plans = controller.pendingPlans.where((plan) {
      final report = _map(plan['masteryReport']);
      final score = _number(report['masteryScore']);
      final isHighRisk =
          score < 65 || _list(report['flaggedMisconceptions']).isNotEmpty;
      final status = (plan['status'] ?? plan['Status'] ?? '').toString();
      switch (_selectedFilter) {
        case 'High risk':
          return isHighRisk;
        case 'Approved':
          return status.toUpperCase().contains('APPROV');
        case 'Pending':
          return status.isEmpty || status.toUpperCase().contains('PENDING');
        default:
          return true;
      }
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Evaluation approvals'),
        titleSpacing: 20,
        actions: [
          IconButton(
            tooltip: 'Refresh approvals',
            onPressed:
                controller.isLoading ? null : controller.loadPendingApprovals,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 14),
            child: Text(
              'Review learning plans and approve the next step.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: AppTheme.textMuted),
            ),
          ),
          SizedBox(
            height: 46,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final filter = _filters[index];
                final selected = _selectedFilter == filter;
                return ChoiceChip(
                  label: Text(filter),
                  selected: selected,
                  showCheckmark: false,
                  onSelected: (_) => setState(() => _selectedFilter = filter),
                  selectedColor: AppTheme.primaryBlue.withValues(alpha: 0.18),
                  backgroundColor: AppTheme.surface,
                  side: BorderSide(
                    color: selected ? AppTheme.primaryBlue : AppTheme.border,
                  ),
                  labelStyle: TextStyle(
                    color: selected ? AppTheme.primaryBlue : AppTheme.textMuted,
                    fontWeight: FontWeight.w700,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(13),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.loadPendingApprovals,
              color: AppTheme.primaryBlue,
              child: _ApprovalBody(
                controller: controller,
                filter: _selectedFilter,
                plans: plans,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ApprovalBody extends StatelessWidget {
  const _ApprovalBody({
    required this.controller,
    required this.filter,
    required this.plans,
  });

  final EvaluationController controller;
  final String filter;
  final List<Map<String, dynamic>> plans;

  @override
  Widget build(BuildContext context) {
    if (controller.isLoading && controller.pendingPlans.isEmpty) {
      return const _SkeletonLoading();
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
    if (plans.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 92),
          const Icon(Icons.inbox_outlined, size: 54, color: AppTheme.textMuted),
          const SizedBox(height: 16),
          Center(
            child: Text(
              filter == 'Approved'
                  ? 'No approved plans in this review queue.'
                  : filter == 'High risk'
                      ? 'No high-risk plans in this queue.'
                      : 'No pending approvals requiring review',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'Pull down to check for updates.',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppTheme.textMuted),
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: plans.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final plan = plans[index];
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
    final risk = _riskLabel(score, _list(report['flaggedMisconceptions']));
    final riskColor = _riskColor(risk);
    final studentId =
        (plan['studentId'] ?? plan['StudentId'] ?? 'Unknown').toString();
    final topic =
        (report['topicName'] ?? report['TopicName'] ?? 'Untitled topic')
            .toString();
    final createdAt = (plan['createdAt'] ?? plan['CreatedAt'])?.toString();
    final progress = (score.clamp(0, 100)) / 100;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(17),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryBlue, AppTheme.indigo],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      studentId == 'Unknown' ? '?' : studentId[0].toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('STUDENT $studentId',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: AppTheme.textMuted,
                                  fontWeight: FontWeight.w800,
                                )),
                        const SizedBox(height: 3),
                        Text(topic,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                  ),
                  _Badge(label: risk, color: riskColor),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Text('Mastery score',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppTheme.textMuted)),
                  const Spacer(),
                  Text('$score%',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color:
                                score < 65 ? AppTheme.danger : AppTheme.emerald,
                            fontWeight: FontWeight.w800,
                          )),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 7,
                  backgroundColor: AppTheme.border,
                  color: score < 65 ? AppTheme.danger : AppTheme.emerald,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text('65% benchmark',
                      style: Theme.of(context)
                          .textTheme
                          .labelSmall
                          ?.copyWith(color: AppTheme.textMuted)),
                  const Spacer(),
                  Text(
                    createdAt == null || createdAt.isEmpty
                        ? 'Awaiting review'
                        : _formatDate(createdAt),
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: AppTheme.textMuted),
                  ),
                ],
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
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.24)),
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

String _riskLabel(int score, List<dynamic> flags) {
  if (score < 65 || flags.isNotEmpty) return 'High';
  if (score < 80) return 'Medium';
  return 'Low';
}

Color _riskColor(String risk) {
  switch (risk) {
    case 'High':
      return AppTheme.danger;
    case 'Medium':
      return AppTheme.amber;
    default:
      return AppTheme.emerald;
  }
}

String _formatDate(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final date = parsed.toLocal();
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

class _SkeletonLoading extends StatefulWidget {
  const _SkeletonLoading();

  @override
  State<_SkeletonLoading> createState() => _SkeletonLoadingState();
}

class _SkeletonLoadingState extends State<_SkeletonLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animationController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300),
  )..repeat();

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) => ShaderMask(
        blendMode: BlendMode.srcATop,
        shaderCallback: (bounds) => LinearGradient(
          begin: Alignment(-1.5 + 3 * _animationController.value, -0.4),
          end: Alignment(-0.5 + 3 * _animationController.value, 0.4),
          colors: const [AppTheme.surface, AppTheme.border, AppTheme.surface],
        ).createShader(bounds),
        child: child,
      ),
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) => Container(
          height: 154,
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                _placeholder(42, 42),
                const SizedBox(width: 12),
                Expanded(child: _placeholder(double.infinity, 38)),
                const SizedBox(width: 12),
                _placeholder(64, 25),
              ]),
              const Spacer(),
              _placeholder(double.infinity, 7),
              const SizedBox(height: 12),
              _placeholder(120, 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder(double width, double height) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppTheme.border,
          borderRadius: BorderRadius.circular(8),
        ),
      );
}
