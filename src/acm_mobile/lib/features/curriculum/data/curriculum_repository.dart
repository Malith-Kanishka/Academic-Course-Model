import '../../../core/network/api_client.dart';
import '../models/course_module.dart';

class CurriculumRepository {
  CurriculumRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<CourseModule>> getModules() async {
    final response = await _client.dio.get<dynamic>('/Syllabus/modules');
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map>()
        .map((item) => CourseModule.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<Map<String, dynamic>> startSession({
    required String studentId,
    required String topicId,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/sessions/start',
      data: {'studentId': studentId, 'topicId': topicId},
    );
    return response.data ?? <String, dynamic>{};
  }
}
