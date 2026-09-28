import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class ArenaRepository {
  ArenaRepository({ApiClient? backend, Dio? aiClient})
      : _backend = backend ?? ApiClient(),
        _aiClient = aiClient ??
            Dio(BaseOptions(
              baseUrl: ApiConstants.aiBaseUrl,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 30),
              headers: {'Content-Type': 'application/json'},
            ));

  final ApiClient _backend;
  final Dio _aiClient;

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
    final response = await _aiClient.post<Map<String, dynamic>>(
      '/api/ai/process',
      data: {'session_id': sessionId, 'student_text': studentText},
    );
    final text = response.data?['ai_text']?.toString();
    if (text == null || text.isEmpty) {
      throw const FormatException('The AI service returned an empty response.');
    }
    return text;
  }
}
