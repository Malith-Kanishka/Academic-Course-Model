import 'package:flutter/foundation.dart';
import '../services/remediation_service.dart';

class RemediationController extends ChangeNotifier {
  RemediationController(this._service);
  final RemediationService _service;

  List<Map<String, dynamic>> approvedPlans = [];
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadPlans(String studentId) async {
    isLoading = true;
    notifyListeners();
    try {
      final plans = await _service.getStudentPlans(studentId);
      approvedPlans = plans.where((p) => (p['status'] ?? p['Status']).toString().toLowerCase().contains('approv')).toList();
    } catch (e) {
      errorMessage = 'Failed to load feedback';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> acknowledge(String planId, String studentId) async {
    await _service.acknowledgePlan(planId);
    await loadPlans(studentId);
  }
}
