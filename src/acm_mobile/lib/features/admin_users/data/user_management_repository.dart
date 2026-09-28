import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class UserManagementRepository {
  UserManagementRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> getUsers({
    String? email,
    String? role,
    bool? isActive,
  }) async {
    final response = await _client.dio.get<dynamic>(
      ApiConstants.users,
      queryParameters: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (role != null && role.isNotEmpty) 'role': role,
        if (isActive != null) 'isActive': isActive,
      },
    );
    final payload = response.data;
    if (payload is List) {
      return payload.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  Future<Map<String, dynamic>> createUser({
    required String email,
    required String firstName,
    required String lastName,
    required String password,
    required String role,
  }) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiConstants.registerUser,
      data: {
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'password': password,
        'role': role,
      },
    );
    return response.data ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> updateUser(
    String id, {
    required String firstName,
    required String lastName,
    String? role,
  }) async {
    final response = await _client.dio.put<Map<String, dynamic>>(
      ApiConstants.userById(id),
      data: {
        'firstName': firstName,
        'lastName': lastName,
        if (role != null) 'role': role,
      },
    );
    return response.data ?? <String, dynamic>{};
  }

  Future<void> activateUser(String id) async {
    await _client.dio.post(ApiConstants.activateUser(id));
  }

  Future<void> deactivateUser(String id) async {
    await _client.dio.post(ApiConstants.deactivateUser(id));
  }
}
