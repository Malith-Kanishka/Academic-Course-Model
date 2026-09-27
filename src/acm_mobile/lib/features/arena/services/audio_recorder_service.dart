import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class AudioSessionService {
  AudioSessionService({ApiClient? client}) : _client = client ?? ApiClient();
  final ApiClient _client;

  Future<Map<String, dynamic>> sendAudioTurn({
    required String sessionId,
    required String audioPath,
  }) async {
    final formData = FormData.fromMap({
      'sessionId': sessionId,
      'audio': await MultipartFile.fromFile(audioPath, filename: 'audio.m4a'),
    });

    final response = await _client.dio.post<Map<String, dynamic>>(
      '/sessions/audio',
      data: formData,
    );
    
    return response.data ?? <String, dynamic>{};
  }
}
