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

  Future<Map<String, dynamic>> sendTurn({
    required String sessionId,
    required String studentText,
  }) async {
    final response = await _backend.dio.post<Map<String, dynamic>>(
      '/sessions/turn',
      data: {'sessionId': sessionId, 'studentText': studentText},
    );
    final result = response.data ?? <String, dynamic>{};
    final text =
        (result['aiText'] ?? result['AiText'] ?? result['message'])?.toString();
    if (text == null || text.isEmpty) {
      throw const FormatException('The AI service returned an empty response.');
    }
    return result;
  }

  Future<void> endSession({required String sessionId}) async {
    await _backend.dio.post<dynamic>('/sessions/$sessionId/end');
  }
}
