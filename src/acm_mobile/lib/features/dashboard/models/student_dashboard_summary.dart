class StudentDashboardSummary {
  const StudentDashboardSummary({
    required this.practiceStreakDays,
    required this.completedVoiceSessions,
    required this.averageMastery,
    required this.activeRemedialPlans,
  });

  final int practiceStreakDays;
  final int completedVoiceSessions;
  final double? averageMastery;
  final List<ActiveRemedialPlanSummary> activeRemedialPlans;

  factory StudentDashboardSummary.fromJson(Map<String, dynamic> json) {
    final rawPlans = json['activeRemedialPlans'] ?? json['ActiveRemedialPlans'];
    return StudentDashboardSummary(
      practiceStreakDays: (json['practiceStreakDays'] ??
          json['PracticeStreakDays'] ??
          0) as int,
      completedVoiceSessions: (json['completedVoiceSessions'] ??
          json['CompletedVoiceSessions'] ??
          0) as int,
      averageMastery: (json['averageMastery'] ?? json['AverageMastery']) is num
          ? ((json['averageMastery'] ?? json['AverageMastery']) as num)
              .toDouble()
          : null,
      activeRemedialPlans: rawPlans is List
          ? rawPlans
              .whereType<Map>()
              .map((plan) => ActiveRemedialPlanSummary.fromJson(
                  Map<String, dynamic>.from(plan)))
              .toList()
          : const [],
    );
  }
}

class ActiveRemedialPlanSummary {
  const ActiveRemedialPlanSummary({
    required this.id,
    required this.topicName,
    required this.dayOfPlan,
    required this.approvedAt,
    required this.actionItems,
    this.masteryScore,
    this.professorNotes,
  });

  final String id;
  final String topicName;
  final int dayOfPlan;
  final DateTime approvedAt;
  final List<String> actionItems;
  final int? masteryScore;
  final String? professorNotes;

  factory ActiveRemedialPlanSummary.fromJson(Map<String, dynamic> json) {
    final rawApprovedAt = json['approvedAt'] ?? json['ApprovedAt'];
    final rawActionItems = json['actionItems'] ?? json['ActionItems'];
    return ActiveRemedialPlanSummary(
      id: (json['id'] ?? json['Id'] ?? '').toString(),
      topicName: (json['topicName'] ?? json['TopicName'] ?? 'Socratic practice')
          .toString(),
      dayOfPlan: (json['dayOfPlan'] ?? json['DayOfPlan'] ?? 1) as int,
      approvedAt: rawApprovedAt is String
          ? DateTime.tryParse(rawApprovedAt)?.toLocal() ?? DateTime.now()
          : DateTime.now(),
      actionItems: rawActionItems is List
          ? rawActionItems.map((item) => item.toString()).toList()
          : const [],
      masteryScore: (json['masteryScore'] ?? json['MasteryScore']) is num
          ? ((json['masteryScore'] ?? json['MasteryScore']) as num).round()
          : int.tryParse(
              (json['masteryScore'] ?? json['MasteryScore'] ?? '').toString(),
            ),
      professorNotes:
          (json['professorNotes'] ?? json['ProfessorNotes'])?.toString(),
    );
  }

  bool includesDate(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final start = DateTime(approvedAt.year, approvedAt.month, approvedAt.day);
    final day = dateOnly.difference(start).inDays + 1;
    return day >= 1 && day <= 7;
  }

  int dayFor(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final start = DateTime(approvedAt.year, approvedAt.month, approvedAt.day);
    return (dateOnly.difference(start).inDays + 1).clamp(1, 7);
  }
}
