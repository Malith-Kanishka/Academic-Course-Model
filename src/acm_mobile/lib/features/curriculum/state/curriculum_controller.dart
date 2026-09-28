import 'package:flutter/foundation.dart';

import '../data/curriculum_repository.dart';
import '../models/course_module.dart';

class CurriculumController extends ChangeNotifier {
  CurriculumController(this._repository);

  final CurriculumRepository _repository;
  List<CourseModule> modules = const [];
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadModules() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final response = await _repository.getModules();
      modules = response.isEmpty ? _fallbackModules : response;
    } catch (_) {
      modules = _fallbackModules;
      errorMessage = 'Showing sample modules while the backend is unavailable.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  static const _fallbackModules = [
    CourseModule(
      id: 'sample-se3010',
      code: 'SE3010',
      title: 'Software Architecture',
      description:
          'Architecture styles, quality attributes, and design trade-offs.',
      isFallback: true,
      topics: [
        CourseTopic(
          id: 'sample-topic-architecture',
          title: 'Architectural styles',
          description:
              'Compare layered, event-driven, and service-based systems.',
        ),
        CourseTopic(
          id: 'sample-topic-quality',
          title: 'Quality attributes',
          description:
              'Reason about performance, security, and maintainability.',
        ),
      ],
    ),
    CourseModule(
      id: 'sample-it3020',
      code: 'IT3020',
      title: 'Data Management',
      description: 'Model, query, and govern modern data systems.',
      isFallback: true,
      topics: [
        CourseTopic(
          id: 'sample-topic-normalization',
          title: 'Relational normalization',
          description: 'Explore functional dependencies and schema design.',
        ),
      ],
    ),
  ];
}
