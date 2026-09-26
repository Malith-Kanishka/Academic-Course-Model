import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class EvaluationRepository {
  EvaluationRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> getPendingApprovals() async {
    final response = await _client.dio.get<dynamic>(
      ApiConstants.pendingApprovals,
    );
    final payload = response.data is Map<String, dynamic>
        ? (response.data['value'] ?? const <dynamic>[])
        : response.data;
    return (payload ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  Future<Map<String, dynamic>> submitDecision(
    String planId,
    String decision,
    String? notes,
  ) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiConstants.approvalDecision,
      data: {'planId': planId, 'status': decision, 'notes': notes},
    );
    return response.data ?? <String, dynamic>{};
  }
}
