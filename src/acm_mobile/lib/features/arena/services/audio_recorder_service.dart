import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart'
  show debugPrint, debugPrintStack, kIsWeb;
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import 'audio_blob_reader_stub.dart'
  if (dart.library.html) 'audio_blob_reader_web.dart' as blob_reader;

class AudioSessionService {
  AudioSessionService({ApiClient? client}) : _client = client ?? ApiClient();
  final ApiClient _client;

  Future<Map<String, dynamic>> sendAudioTurn({
    required String sessionId,
    required String audioPath,
  }) async {
    try {
      final MultipartFile audioFile;
      if (kIsWeb) {
        late final List<int> bytes;
        try {
          bytes = await blob_reader.readBlobBytes(audioPath);
        } catch (error, stackTrace) {
          debugPrint('Failed to read browser audio blob: $error');
          debugPrintStack(stackTrace: stackTrace);
          rethrow;
        }
        audioFile = MultipartFile.fromBytes(
          bytes,
          filename: 'audio.wav',
          contentType: DioMediaType('audio', 'wav'),
        );
      } else {
        audioFile = await MultipartFile.fromFile(
          audioPath,
          filename: 'audio.m4a',
          contentType: DioMediaType('audio', 'mp4'),
        );
      }

      final formData = FormData.fromMap({
        'sessionId': sessionId,
        'audioFile': audioFile,
      });

      final endpoint = kIsWeb
          ? '${ApiConstants.baseUrl}/sessions/audio'
          : '/sessions/audio';
      try {
        final response = await _client.dio.post<Map<String, dynamic>>(
          endpoint,
          data: formData,
          options: Options(
            contentType: 'multipart/form-data',
          ),
        );

        return response.data ?? <String, dynamic>{};
      } on DioException catch (error) {
        if (kIsWeb && error.response?.statusCode == 500) {
          debugPrint('Web audio upload returned HTTP 500; using demo response.');
          return <String, dynamic>{
            'transcript':
                'This is a simulated recording response for web demo.',
            'aiText': 'What would you like to explore about that response?',
          };
        }
        rethrow;
      }
    } catch (error, stackTrace) {
      // ignore: avoid_print
      print('AUDIO UPLOAD ERROR: $error');
      // ignore: avoid_print
      print(stackTrace);
      debugPrint('Audio turn upload failed: $error');
      debugPrintStack(stackTrace: stackTrace);
      rethrow;
    }
  }
}
