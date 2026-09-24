import 'package:flutter/material.dart';

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
    if (success) Navigator.of(context).pop();
    if (!success && widget.controller.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.controller.errorMessage!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final report = _map(widget.plan['masteryReport']);
    final misconceptions = _list(report['flaggedMisconceptions']);
    final actionItems = _list(widget.plan['actionItems']);
    final score = _number(report['masteryScore']);

    return Scaffold(
      appBar: AppBar(title: const Text('Remedial plan review')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Text(report['topicName']?.toString() ?? 'Untitled topic',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('Student ${widget.plan['studentId'] ?? 'Unknown'}'),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  _ScoreRing(score: score),
                  const SizedBox(width: 18),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Mastery evidence',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 6),
                        Text(misconceptions.isEmpty
                            ? 'No flagged misconceptions.'
                            : '${misconceptions.length} flagged misconception(s) require review.'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('Evidence trace', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: misconceptions.isEmpty
                  ? const Text(
                      'The evaluator found no specific misconception to display.')
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: misconceptions
                          .map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Icon(Icons.flag_outlined,
                                          size: 18,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .error),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(item.toString())),
                                    ]),
                              ))
                          .toList(),
                    ),
            ),
          ),
          const SizedBox(height: 20),
          Text('Recommended action items',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          ...actionItems.map((item) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.check_circle_outline_rounded),
                title: Text(item.toString()),
              )),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Professor feedback',
              hintText: 'Add context for the student or teaching team',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isSubmitting ? null : () => _submit('REJECTED'),
                  icon: const Icon(Icons.close_rounded),
                  label: const Text('Reject'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed:
                      _isSubmitting ? null : () => _submit('APPROVED_ACTIVE'),
                  icon: _isSubmitting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.check_rounded),
                  label: const Text('Approve'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ScoreRing extends StatelessWidget {
  const _ScoreRing({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    final color = score < 65
        ? Theme.of(context).colorScheme.error
        : Colors.green.shade700;
    return SizedBox(
      width: 72,
      height: 72,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
              value: score / 100,
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
