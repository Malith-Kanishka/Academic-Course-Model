import '../../../core/network/api_client.dart';
import '../models/student_dashboard_summary.dart';

class StudentDashboardRepository {
  StudentDashboardRepository({ApiClient? client})
      : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<StudentDashboardSummary> getSummary() async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      '/student/dashboard-summary',
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException('The dashboard summary was empty.');
    }
    return StudentDashboardSummary.fromJson(data);
  }
}
