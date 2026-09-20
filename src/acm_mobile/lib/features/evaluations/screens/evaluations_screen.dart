import 'package:flutter/material.dart';

class EvaluationsScreen extends StatefulWidget {
  const EvaluationsScreen({Key? key}) : super(key: key);

  @override
  State<EvaluationsScreen> createState() => _EvaluationsScreenState();
}

class _EvaluationsScreenState extends State<EvaluationsScreen> {
  // Mock session data for initial mobile preview / offline testing
  final Map<String, dynamic> evaluationData = {
    "topicName": "ASP.NET Middleware & Dependency Injection",
    "masteryScore": 54,
    "approvalStatus": "PAUSED_FOR_PROFESSOR_APPROVAL",
    "actionItems": [
      "Review concept: Transient vs Scoped vs Singleton lifetimes",
      "Re-attempt practice quiz on Middleware pipeline execution order"
    ]
  };

  @override
  Widget build(BuildContext context) {
    final bool isApproved = evaluationData["approvalStatus"] == "APPROVED_ACTIVE";
    final int score = evaluationData["masteryScore"];

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Mastery Evaluation'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Score Header Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          evaluationData["topicName"],
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Score: $score%',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: score >= 65 ? Colors.green : Colors.orange,
                          ),
                        ),
                      ],
                    ),
                    Chip(
                      label: Text(
                        isApproved ? 'Approved' : 'Pending Sign-Off',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                      backgroundColor: isApproved ? Colors.green : Colors.orange,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isApproved ? Colors.green.shade50 : Colors.amber.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isApproved ? Colors.green.shade200 : Colors.amber.shade300,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isApproved ? Icons.check_circle : Icons.hourglass_top,
                    color: isApproved ? Colors.green : Colors.amber.shade900,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      isApproved
                          ? "Your remedial plan has been reviewed and authorized by your professor."
                          : "Evaluation paused for professor review due to score < 65%.",
                      style: TextStyle(
                        fontSize: 13,
                        color: isApproved ? Colors.green.shade900 : Colors.amber.shade900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action Items Section
            const Text(
              'Remedial Action Items',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: (evaluationData["actionItems"] as List).length,
              itemBuilder: (context, index) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.indigo.shade100,
                      child: Text('${index + 1}', style: const TextStyle(color: Colors.indigo)),
                    ),
                    title: Text(evaluationData["actionItems"][index]),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}