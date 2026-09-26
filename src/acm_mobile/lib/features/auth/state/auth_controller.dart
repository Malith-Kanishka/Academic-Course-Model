import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';

import '../data/auth_repository.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._repository);

  final AuthRepository _repository;
  bool isLoading = false;
  String? errorMessage;
  Map<String, dynamic>? user;
  String? accessToken;
  bool isAuthenticated = false;
  bool isInitialized = false;

  Future<void> initialize() async {
    try {
      final token = await _repository.readAccessToken();
      accessToken = token;
      isAuthenticated = token != null && token.isNotEmpty;
      user ??= _userFromToken(token);
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
      accessToken = await _repository.readAccessToken();
      user ??= _userFromToken(accessToken);
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
    accessToken = null;
    isAuthenticated = false;
    notifyListeners();
  }

  Map<String, dynamic>? _userFromToken(String? token) {
    if (token == null) return null;
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      );
      if (payload is! Map<String, dynamic>) return null;
      return {
        'id': payload['sub'] ??
            payload['nameid'] ??
            payload[
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        'email': payload['email'] ??
            payload[
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        'firstName': payload['firstName'] ?? payload['given_name'],
        'lastName': payload['lastName'] ?? payload['family_name'],
        'role': payload['role'] ??
            payload[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        'name': payload['name'],
      };
    } catch (_) {
      return null;
    }
  }
}
