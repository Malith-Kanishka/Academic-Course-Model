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

  factory CourseTopic.fromJson(Map<String, dynamic> json) => CourseTopic(
        id: (json['id'] ?? json['Id'] ?? '').toString(),
        title: (json['title'] ?? json['Title'] ?? 'Untitled topic').toString(),
        description:
            (json['contentDescription'] ?? json['ContentDescription'] ?? '')
                .toString(),
      );
}
