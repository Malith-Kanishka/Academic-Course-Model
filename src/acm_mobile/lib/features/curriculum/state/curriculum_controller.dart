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
      modules = response;
    } catch (_) {
      modules = const [];
      errorMessage =
          'Unable to load enrolled modules. Check your connection and try again.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
