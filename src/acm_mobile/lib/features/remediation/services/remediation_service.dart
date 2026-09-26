import '../../../core/network/api_client.dart';

class RemediationService {
  RemediationService({ApiClient? client}) : _client = client ?? ApiClient();
  final ApiClient _client;

  Future<List<Map<String, dynamic>>> getStudentPlans(String studentId) async {
    try {
      final response = await _client.dio.get<List<dynamic>>(
        '/Approval/student-plans',
        queryParameters: {'studentId': studentId},
      );
      return response.data?.cast<Map<String, dynamic>>() ?? [];
    } catch (e) {
      return [];
    }
  }

  Future<void> acknowledgePlan(String planId) async {
    await _client.dio.post('/Approval/acknowledge', data: {'planId': planId});
  }
}
