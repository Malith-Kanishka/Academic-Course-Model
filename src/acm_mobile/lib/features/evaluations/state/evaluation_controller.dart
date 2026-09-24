import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../data/evaluation_repository.dart';

class EvaluationController extends ChangeNotifier {
  EvaluationController(this.repository);

  final EvaluationRepository repository;
  bool isLoading = false;
  List<Map<String, dynamic>> pendingPlans = [];
  String? errorMessage;

  Future<void> loadPendingApprovals() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      pendingPlans = await repository.getPendingApprovals();
    } on DioException catch (error) {
      errorMessage = error.response?.data is Map
          ? error.response?.data['message']?.toString()
          : 'Unable to load pending approvals.';
    } catch (_) {
      errorMessage = 'Unable to load pending approvals.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitDecision(
    String planId,
    String decision,
    String? notes,
  ) async {
    try {
      await repository.submitDecision(planId, decision, notes);
      pendingPlans.removeWhere((plan) => plan['id']?.toString() == planId);
      errorMessage = null;
      notifyListeners();
      return true;
    } on DioException catch (error) {
      errorMessage = error.response?.data is Map
          ? error.response?.data['message']?.toString()
          : 'Unable to submit the professor decision.';
    } catch (_) {
      errorMessage = 'Unable to submit the professor decision.';
    }
    notifyListeners();
    return false;
  }
}
