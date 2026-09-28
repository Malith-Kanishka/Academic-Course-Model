import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../state/evaluation_controller.dart';

class RemedialPlanScreen extends StatefulWidget {
  const RemedialPlanScreen(
      {super.key, required this.plan, required this.controller});

  final Map<String, dynamic> plan;
  final EvaluationController controller;

  @override
  State<RemedialPlanScreen> createState() => _RemedialPlanScreenState();
}

class _RemedialPlanScreenState extends State<RemedialPlanScreen> {
  final _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit(String decision) async {
    setState(() => _isSubmitting = true);
    final success = await widget.controller.submitDecision(
      widget.plan['id'].toString(),
      decision,
      _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    final messenger = ScaffoldMessenger.of(context);
    if (success) {
      Navigator.of(context).pop();
      messenger.showSnackBar(
        SnackBar(
          content: Text(decision == 'REJECTED'
              ? 'Remedial plan rejected.'
              : 'Remedial plan approved.'),
          backgroundColor: AppTheme.emerald,
        ),
      );
    } else if (widget.controller.errorMessage != null) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(widget.controller.errorMessage!),
          backgroundColor: AppTheme.danger,
        ),
      );
    }
  }

  Future<void> _confirmDecision(String decision) async {
    final approving = decision == 'APPROVED_ACTIVE';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
            approving ? 'Approve remedial plan?' : 'Reject remedial plan?'),
        content: Text(
          approving
              ? 'This plan will be marked active for the student.'
              : 'The plan will be returned with your optional feedback.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: approving ? AppTheme.emerald : AppTheme.danger,
            ),
            child: Text(approving ? 'Approve plan' : 'Reject plan'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) await _submit(decision);
  }

  @override
  Widget build(BuildContext context) {
    final report = _map(widget.plan['masteryReport']);
    final misconceptions = _list(report['flaggedMisconceptions']);
    final actionItems = _list(widget.plan['actionItems']);
    final score = _number(report['masteryScore']);
    final studentId = (widget.plan['studentId'] ?? 'Unknown').toString();
    final topic = (report['topicName'] ?? 'Untitled topic').toString();
    final highRisk = score < 65 || misconceptions.isNotEmpty;
    final riskLabel = highRisk
        ? 'HIGH RISK'
        : score < 80
            ? 'REVIEW'
            : 'LOW RISK';
    final riskColor = highRisk
        ? AppTheme.danger
        : score < 80
            ? AppTheme.amber
            : AppTheme.emerald;

    return Scaffold(
      appBar: AppBar(title: const Text('Remedial plan review')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
        children: [
          Card(
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF172554)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  _ScoreRing(score: score),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(topic,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 5),
                        Text('Student $studentId',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppTheme.textMuted)),
                        const SizedBox(height: 10),
                        _Badge(label: riskLabel, color: riskColor),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Card(
            clipBehavior: Clip.antiAlias,
            child: ExpansionTile(
              initiallyExpanded: true,
              leading: const Icon(Icons.compare_arrows_rounded,
                  color: AppTheme.primaryBlue),
              title: const Text('Evidence trace'),
              subtitle: Text('${misconceptions.length} flagged observations'),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              children: [
                LayoutBuilder(
                  builder: (context, constraints) {
                    final panels = [
                      _EvidencePanel(
                        title: 'Evaluation evidence',
                        icon: Icons.forum_outlined,
                        color: AppTheme.danger,
                        child: misconceptions.isEmpty
                            ? const Text(
                                'No specific misconception was flagged.')
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: misconceptions
                                    .map((item) => Padding(
                                          padding:
                                              const EdgeInsets.only(bottom: 8),
                                          child: Text('• ${item.toString()}'),
                                        ))
                                    .toList(),
                              ),
                      ),
                      const _EvidencePanel(
                        title: 'Review benchmark',
                        icon: Icons.rule_rounded,
                        color: AppTheme.primaryBlue,
                        child: Text(
                          'Plans below 65% mastery, or with flagged misconceptions, enter human review. Raw response and rubric text are not included in this review payload.',
                        ),
                      ),
                    ];
                    if (constraints.maxWidth >= 500) {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: panels[0]),
                          const SizedBox(width: 10),
                          Expanded(child: panels[1]),
                        ],
                      );
                    }
                    return Column(children: panels);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Card(
            clipBehavior: Clip.antiAlias,
            child: ExpansionTile(
              leading: const Icon(Icons.route_rounded, color: AppTheme.indigo),
              title: const Text('7-day study plan'),
              subtitle: Text('${actionItems.length} recommended steps'),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              children: actionItems.isEmpty
                  ? [
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text('No action items were provided.'),
                      ),
                    ]
                  : actionItems.indexed.map((entry) {
                      final index = entry.$1;
                      final item = entry.$2;
                      return _ActionStep(
                        day: index + 1,
                        description: item.toString(),
                      );
                    }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            clipBehavior: Clip.antiAlias,
            child: ExpansionTile(
              leading: const Icon(Icons.shield_outlined, color: AppTheme.amber),
              title: const Text('AI safety evaluation'),
              subtitle: const Text('Why human review was triggered'),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
              children: [
                Text(
                  highRisk
                      ? 'Human review was triggered because mastery is below the 65% benchmark or the evaluation flagged misconceptions. Please verify the evidence and recommended steps before deciding.'
                      : 'This plan is in the human review queue. Confirm the evaluation evidence and recommended steps are appropriate for the student.',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Reviewer feedback (optional)',
              hintText: 'Add context for the student or teaching team',
              alignLabelWithHint: true,
              prefixIcon: Icon(Icons.edit_note_rounded),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          decoration: BoxDecoration(
            color: AppTheme.slate,
            border: const Border(top: BorderSide(color: AppTheme.border)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 14,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed:
                      _isSubmitting ? null : () => _confirmDecision('REJECTED'),
                  icon: const Icon(Icons.close_rounded),
                  label: const Text('Reject'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.danger,
                    side: BorderSide(
                        color: AppTheme.danger.withValues(alpha: 0.6)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _isSubmitting
                      ? null
                      : () => _confirmDecision('APPROVED_ACTIVE'),
                  icon: _isSubmitting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.check_rounded),
                  label: const Text('Approve'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.emerald,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EvidencePanel extends StatelessWidget {
  const _EvidencePanel({
    required this.title,
    required this.icon,
    required this.color,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Color color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: AppTheme.slate,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 17, color: color),
            const SizedBox(width: 7),
            Expanded(
              child: Text(title,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: color,
                        fontWeight: FontWeight.w800,
                      )),
            ),
          ]),
          const SizedBox(height: 10),
          DefaultTextStyle.merge(
            style: Theme.of(context)
                .textTheme
                .bodySmall!
                .copyWith(color: AppTheme.textPrimary),
            child: child,
          ),
        ],
      ),
    );
  }
}

class _ActionStep extends StatelessWidget {
  const _ActionStep({required this.day, required this.description});

  final int day;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppTheme.indigo.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text('$day',
                style: const TextStyle(
                    color: AppTheme.indigo, fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(description),
            ),
          ),
          const SizedBox(width: 8),
          const _Badge(label: 'Self-paced', color: AppTheme.textMuted),
        ],
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
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        child: Text(label,
            style: TextStyle(
                color: color, fontSize: 10, fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _ScoreRing extends StatelessWidget {
  const _ScoreRing({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    final color = score < 65 ? AppTheme.danger : AppTheme.emerald;
    return SizedBox(
      width: 72,
      height: 72,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
              value: score.clamp(0, 100) / 100,
              strokeWidth: 7,
              color: color,
              backgroundColor: color.withValues(alpha: 0.12)),
          Text('$score%', style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

Map<String, dynamic> _map(dynamic value) =>
    value is Map<String, dynamic> ? value : <String, dynamic>{};
List<dynamic> _list(dynamic value) => value is List<dynamic> ? value : const [];
int _number(dynamic value) =>
    value is num ? value.round() : int.tryParse('$value') ?? 0;
