class CourseModule {
  const CourseModule({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    required this.topics,
    this.completedTopics = 0,
    this.isFallback = false,
  });

  final String id;
  final String code;
  final String title;
  final String description;
  final List<CourseTopic> topics;
  final int completedTopics;
  final bool isFallback;

  factory CourseModule.fromJson(Map<String, dynamic> json) {
    final rawTopics = json['topics'] ?? json['Topics'];
    return CourseModule(
      id: (json['id'] ?? json['Id'] ?? '').toString(),
      code: (json['code'] ?? json['Code'] ?? 'COURSE').toString(),
      title: (json['title'] ?? json['Title'] ?? 'Untitled module').toString(),
      description:
          (json['description'] ?? json['Description'] ?? '').toString(),
      topics: rawTopics is List
          ? rawTopics
              .whereType<Map>()
              .map((topic) =>
                  CourseTopic.fromJson(Map<String, dynamic>.from(topic)))
              .toList()
          : const [],
      completedTopics: (json['done'] ?? json['Done'] ?? 0) as int,
    );
  }
}

class CourseTopic {
  const CourseTopic({
    required this.id,
    required this.title,
    required this.description,
  });

  final String id;
  final String title;
  final String description;

  factory CourseTopic.fromJson(Map<String, dynamic> json) {
    final rawTitle = (json['title'] ?? json['Title'] ?? 'Untitled topic')
        .toString();
    final rawDescription =
        (json['contentDescription'] ?? json['ContentDescription'] ?? '')
            .toString();
    return CourseTopic(
      id: (json['id'] ?? json['Id'] ?? '').toString(),
      title: _normalizeTopicLabel(rawTitle),
      description: _normalizeTopicDescription(rawDescription),
    );
  }
}

String _normalizeTopicLabel(String label) {
  final normalized = label.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  if (normalized == 'topic1' ||
      normalized == 'topic1topic1' ||
      normalized == 'topictopic') {
    return 'Introduction to Data Mining and Machine Learning';
  }
  if (normalized == 'topic2' || normalized == 'topic2topic2') {
    return 'Data Understanding';
  }
  return label;
}

String _normalizeTopicDescription(String description) {
  final normalized =
      description.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  if (normalized.contains('topictopic') ||
      normalized.contains('topic1topic1')) {
    return 'Overview of data mining principles, machine learning concepts, and predictive analytics techniques.';
  }
  if (normalized.contains('topic2topic2')) {
    return 'Exploration, collection, quality assessment, and initial insights into dataset structures.';
  }
  return description;
}
