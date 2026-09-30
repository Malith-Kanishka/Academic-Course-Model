import 'package:flutter/foundation.dart';

abstract final class ApiConstants {
  static String get baseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  static String get aiBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }

  static const login = '/Auth/login';
  static const pendingApprovals = '/Approval/pending';
  static const approvalDecision = '/Approval/decision';

  static const users = '/Auth';
  static const registerUser = '/Auth/register';
  static String userById(String id) => '/Auth/$id';
  static String activateUser(String id) => '/Auth/$id/activate';
  static String deactivateUser(String id) => '/Auth/$id/deactivate';
}
