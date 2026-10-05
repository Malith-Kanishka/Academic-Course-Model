import '../../../core/network/api_client.dart';

class RemedialPlanService {
  RemedialPlanService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<void> deleteRemedialPlan(String planId) async {
    await _client.dio.delete<void>('/remedial-plans/$planId');
  }
}
