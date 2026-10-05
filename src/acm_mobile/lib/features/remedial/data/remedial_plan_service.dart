import '../../../core/network/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RemedialPlanService {
  RemedialPlanService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static String _progressKey(String planId) => 'remedial_plan_progress_$planId';

  Future<Set<int>> getCompletedDayIndices(String planId) async {
    final preferences = await SharedPreferences.getInstance();
    final savedIndices = preferences.getStringList(_progressKey(planId)) ?? [];
    return savedIndices.map(int.tryParse).whereType<int>().toSet();
  }

  Future<void> saveCompletedDayIndices(
    String planId,
    Set<int> completedDayIndices,
  ) async {
    final preferences = await SharedPreferences.getInstance();
    final savedIndices = completedDayIndices.toList()..sort();
    await preferences.setStringList(
      _progressKey(planId),
      savedIndices.map((index) => index.toString()).toList(),
    );
  }

  Future<void> clearCompletedDayIndices(String planId) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_progressKey(planId));
  }

  Future<void> deleteRemedialPlan(String planId) async {
    await _client.dio.delete<void>('/remedial-plans/$planId');
  }
}
