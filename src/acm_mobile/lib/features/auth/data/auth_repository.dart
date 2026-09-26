import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/constants/api_constants.dart';

class AuthRepository {
  AuthRepository({ApiClient? client, SecureStorage? storage})
      : _client = client ?? ApiClient(storage: storage),
        _storage = storage ?? SecureStorage();

  final ApiClient _client;
  final SecureStorage _storage;

  Future<String?> readAccessToken() => _storage.readAccessToken();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    final data = response.data ?? <String, dynamic>{};
    final token = data['accessToken']?.toString();
    if (token == null || token.isEmpty) {
      throw StateError(data['message']?.toString() ??
          'The server did not return an access token.');
    }
    await _storage.writeAccessToken(token);
    return data;
  }

  Future<void> logout() => _storage.clear();
}
