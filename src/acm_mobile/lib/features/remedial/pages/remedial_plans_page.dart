import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../dashboard/data/student_dashboard_repository.dart';
import '../../dashboard/models/student_dashboard_summary.dart';
import '../data/remedial_plan_service.dart';

enum _PlanFilter { active, completed }

class RemedialPlansPage extends StatefulWidget {
  const RemedialPlansPage({this.initialPlanId, super.key});

  final String? initialPlanId;

  @override
  State<RemedialPlansPage> createState() => _RemedialPlansPageState();
}

class _RemedialPlansPageState extends State<RemedialPlansPage> {
  final _repository = StudentDashboardRepository();
  final _remedialPlanService = RemedialPlanService();
  final _scrollController = ScrollController();
  final _selectedPlanKey = GlobalKey();
  final Map<String, Set<int>> _completedDays = {};
  final Set<String> _deletingPlanIds = {};
  _PlanFilter _filter = _PlanFilter.active;
  List<ActiveRemedialPlanSummary> _plans = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  @override
  void didUpdateWidget(covariant RemedialPlansPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialPlanId != widget.initialPlanId) {
      _scheduleSelectedPlanScroll();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadPlans() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final summary = await _repository.getSummary();
      if (!mounted) return;
      setState(() => _plans = summary.activeRemedialPlans);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Unable to load your remedial plans.');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _scheduleSelectedPlanScroll();
      }
    }
  }

  void _scheduleSelectedPlanScroll() {
    if (widget.initialPlanId == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final selectedContext = _selectedPlanKey.currentContext;
      if (!mounted || selectedContext == null) return;
      Scrollable.ensureVisible(
        selectedContext,
        alignment: 0.08,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    });
  }

  bool _isCompleted(ActiveRemedialPlanSummary plan) =>
      _completedDays[plan.id]?.length == plan.actionItems.length &&
      plan.actionItems.isNotEmpty;

  void _toggleDay(ActiveRemedialPlanSummary plan, int day, bool checked) {
    setState(() {
      final completed = _completedDays.putIfAbsent(plan.id, () => <int>{});
      if (checked) {
        completed.add(day);
      } else {
        completed.remove(day);
      }
    });
  }

  Future<void> _confirmDeletePlan(ActiveRemedialPlanSummary plan) async {
    if (_deletingPlanIds.contains(plan.id)) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete Completed Plan'),
        content: Text(
          "Are you sure you want to delete '${plan.topicName}'? This action cannot be undone.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _deletingPlanIds.add(plan.id));
    try {
      await _remedialPlanService.deleteRemedialPlan(plan.id);
      if (!mounted) return;
      setState(() {
        _plans = _plans.where((item) => item.id != plan.id).toList();
        _completedDays.remove(plan.id);
      });
      messenger.showSnackBar(
        const SnackBar(content: Text('Plan deleted successfully')),
      );
    } catch (_) {
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
            content: Text('Unable to delete this plan. Please try again.')),
      );
    } finally {
      if (mounted) setState(() => _deletingPlanIds.remove(plan.id));
    }
  }

  void _continuePractice(ActiveRemedialPlanSummary plan) {
    final todayIndex =
        (plan.dayOfPlan - 1).clamp(0, plan.actionItems.length - 1).toInt();
    context.go('/arena', extra: {
      'planId': plan.id,
      'topicName': plan.topicName,
      'actionItems': [plan.actionItems[todayIndex]],
      'startImmediately': true,
    });
  }

  @override
  Widget build(BuildContext context) {
    final activePlans = _plans.where((plan) => !_isCompleted(plan)).toList();
    final completedPlans = _plans.where(_isCompleted).toList();
    final visiblePlans =
        _filter == _PlanFilter.active ? activePlans : completedPlans;

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
      children: [
        Text(
          'My Remedial Plans',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Track your progress and continue your Socratic practice.',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: AppTheme.textMuted),
        ),
        const SizedBox(height: 18),
        SegmentedButton<_PlanFilter>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(
              value: _PlanFilter.active,
              label: Text('Active Plans (${activePlans.length})'),
              icon: const Icon(Icons.bolt_rounded),
            ),
            ButtonSegment(
              value: _PlanFilter.completed,
              label: Text('Completed (${completedPlans.length})'),
              icon: const Icon(Icons.check_circle_outline_rounded),
            ),
          ],
          selected: {_filter},
          onSelectionChanged: (selection) =>
              setState(() => _filter = selection.first),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 36),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_error != null)
          _PlansMessage(
            icon: Icons.cloud_off_rounded,
            message: _error!,
            action:
                TextButton(onPressed: _loadPlans, child: const Text('Retry')),
          )
        else if (visiblePlans.isEmpty)
          _PlansMessage(
            icon: _filter == _PlanFilter.active
                ? Icons.assignment_outlined
                : Icons.task_alt_rounded,
            message: _filter == _PlanFilter.active
                ? 'No active remedial plans.'
                : 'No plans completed yet.',
          )
        else
          ...visiblePlans.indexed.map((entry) {
            final plan = entry.$2;
            final isSelectedPlan = widget.initialPlanId == plan.id;
            return Padding(
              key: isSelectedPlan
                  ? _selectedPlanKey
                  : ValueKey('remedial-plan-${plan.id}'),
              padding: const EdgeInsets.only(bottom: 14),
              child: _PlanCard(
                plan: plan,
                badge: 'Topic ${entry.$1 + 1}',
                checkedDays: _completedDays[plan.id] ?? const <int>{},
                isCompleted: _isCompleted(plan),
                initiallyExpanded: isSelectedPlan,
                onToggleDay: (day, checked) => _toggleDay(plan, day, checked),
                onContinue: () => _continuePractice(plan),
                onDelete:
                    _isCompleted(plan) ? () => _confirmDeletePlan(plan) : null,
                isDeleting: _deletingPlanIds.contains(plan.id),
              ),
            );
          }),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.badge,
    required this.checkedDays,
    required this.isCompleted,
    required this.initiallyExpanded,
    required this.onToggleDay,
    required this.onContinue,
    required this.onDelete,
    required this.isDeleting,
  });

  final ActiveRemedialPlanSummary plan;
  final String badge;
  final Set<int> checkedDays;
  final bool isCompleted;
  final bool initiallyExpanded;
  final void Function(int day, bool checked) onToggleDay;
  final VoidCallback onContinue;
  final VoidCallback? onDelete;
  final bool isDeleting;

  @override
  Widget build(BuildContext context) {
    final day = plan.dayOfPlan.clamp(1, 7);
    final checkedProgress = checkedDays.length / plan.actionItems.length;
    final progress = isCompleted
        ? 1.0
        : math.max(day / 7, checkedProgress).clamp(0.0, 1.0).toDouble();
    final percent = (progress * 100).round();

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    plan.topicName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                ),
                const SizedBox(width: 10),
                _TopicBadge(label: badge),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              isCompleted
                  ? '7-day plan completed'
                  : 'Day $day of 7 · $percent% completed',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: isCompleted ? AppTheme.emerald : AppTheme.textMuted,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 9),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 7,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation(
                  isCompleted ? AppTheme.emerald : AppTheme.primaryBlue,
                ),
              ),
            ),
            const SizedBox(height: 7),
            ExpansionTile(
              key: PageStorageKey(
                'remedial-plan-${plan.id}-$initiallyExpanded',
              ),
              initiallyExpanded: initiallyExpanded,
              tilePadding: EdgeInsets.zero,
              childrenPadding: EdgeInsets.zero,
              title: const Text('7-day schedule'),
              subtitle: Text('${checkedDays.length} of 7 tasks checked'),
              children: [
                for (var index = 0; index < plan.actionItems.length; index++)
                  CheckboxListTile(
                    value: checkedDays.contains(index),
                    onChanged: (checked) =>
                        onToggleDay(index, checked ?? false),
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    controlAffinity: ListTileControlAffinity.leading,
                    title: Text(
                      'Day ${index + 1}: ${plan.actionItems[index]}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            if (isCompleted)
              Align(
                alignment: Alignment.centerRight,
                child: IconButton(
                  tooltip: 'Delete Plan',
                  onPressed: isDeleting ? null : onDelete,
                  icon: isDeleting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(
                          Icons.delete_outline_rounded,
                          color: Colors.redAccent,
                        ),
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onContinue,
                  icon: const Icon(Icons.graphic_eq_rounded),
                  label: const Text('Continue Socratic Practice'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TopicBadge extends StatelessWidget {
  const _TopicBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(
          color: AppTheme.primaryBlue.withValues(alpha: .12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppTheme.primaryBlue,
                fontWeight: FontWeight.w800,
              ),
        ),
      );
}

class _PlansMessage extends StatelessWidget {
  const _PlansMessage({required this.icon, required this.message, this.action});

  final IconData icon;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 34),
        child: Column(
          children: [
            Icon(icon, size: 34, color: AppTheme.textMuted),
            const SizedBox(height: 10),
            Text(message, style: TextStyle(color: AppTheme.textMuted)),
            if (action != null) action!,
          ],
        ),
      );
}
