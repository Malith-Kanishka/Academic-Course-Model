import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../data/auth_repository.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._repository);

  final AuthRepository _repository;
  bool isLoading = false;
  String? errorMessage;
  Map<String, dynamic>? user;
  bool isAuthenticated = false;
  bool isInitialized = false;

  Future<void> initialize() async {
    try {
      final token = await _repository.readAccessToken();
      isAuthenticated = token != null && token.isNotEmpty;
    } catch (_) {
      isAuthenticated = false;
    } finally {
      markInitializationComplete();
    }
  }

  void markInitializationComplete() {
    isInitialized = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final response = await _repository.login(email, password);
      user = response['user'] is Map<String, dynamic>
          ? response['user'] as Map<String, dynamic>
          : null;
      isAuthenticated = true;
    } on DioException catch (error) {
      errorMessage = error.response?.data is Map
          ? (error.response?.data['message']?.toString() ?? 'Login failed.')
          : 'Unable to reach the ACM backend.';
    } catch (error) {
      errorMessage = error.toString().replaceFirst('Bad state: ', '');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    user = null;
    isAuthenticated = false;
    notifyListeners();
  }
}
