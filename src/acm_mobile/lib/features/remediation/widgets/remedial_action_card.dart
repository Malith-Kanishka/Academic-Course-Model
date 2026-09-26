import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import 'student_mastery_gauge.dart';
import 'action_routing_button.dart';

class RemedialActionCard extends StatelessWidget {
  const RemedialActionCard({required this.plan, super.key});
  final Map<String, dynamic> plan;

  @override
  Widget build(BuildContext context) {
    final report = plan['masteryReport'] ?? {};
    final score = (report['masteryScore'] ?? report['MasteryScore'] ?? 0) as num;
    final topic = report['topicName'] ?? report['TopicName'] ?? 'Unknown Topic';
    final aiAdvice = plan['remedialPlan'] ?? plan['RemedialPlan'] ?? 'Please review the core materials.';
    final profFeedback = plan['professorFeedback'] ?? plan['ProfessorFeedback'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StudentMasteryGauge(score: score.toInt()),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Topic: $topic', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 4),
                      Text('Mastery below benchmark', style: TextStyle(color: AppTheme.danger, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (profFeedback.isNotEmpty) ...[
              const Text('Professor Feedback', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryBlue)),
              const SizedBox(height: 4),
              Text(profFeedback, style: const TextStyle(fontStyle: FontStyle.italic)),
              const SizedBox(height: 12),
            ],
            const Text('Study Plan', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(aiAdvice.toString()),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ActionRoutingButton(plan: plan),
            ),
          ],
        ),
      ),
    );
  }
}
