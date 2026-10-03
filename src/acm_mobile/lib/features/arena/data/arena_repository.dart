import '../../../core/network/api_client.dart';

class ArenaRepository {
  ArenaRepository({ApiClient? backend}) : _backend = backend ?? ApiClient();

  final ApiClient _backend;

  Future<Map<String, dynamic>> startSession({
    required String studentId,
    required String topicId,
  }) async {
    final response = await _backend.dio.post<Map<String, dynamic>>(
      '/sessions/start',
      data: {'studentId': studentId, 'topicId': topicId},
    );
    return response.data ?? <String, dynamic>{};
  }

  Future<String> sendTurn({
    required String sessionId,
    required String studentText,
  }) async {
    final response = await _backend.dio.post<Map<String, dynamic>>(
      '/sessions/turn',
      data: {'sessionId': sessionId, 'studentText': studentText},
    );
    final text = response.data?['aiText']?.toString();
    if (text == null || text.isEmpty) {
      throw const FormatException('The AI service returned an empty response.');
    }
    return text;
  }
}
