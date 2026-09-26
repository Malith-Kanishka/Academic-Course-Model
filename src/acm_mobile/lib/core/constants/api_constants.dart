import 'package:flutter/foundation.dart';

abstract final class ApiConstants {
  static String get baseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  static const login = '/Auth/login';
  static const pendingApprovals = '/Approval/pending';
  static const approvalDecision = '/Approval/decision';
}
