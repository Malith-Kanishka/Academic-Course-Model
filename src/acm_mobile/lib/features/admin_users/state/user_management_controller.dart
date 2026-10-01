import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../data/user_management_repository.dart';

const List<String> kManagedRoles = [
  'DepartmentHead',
  'Lecturer',
  'Teacher',
  'Student',
];

class UserManagementController extends ChangeNotifier {
  UserManagementController(this.repository);

  final UserManagementRepository repository;

  bool isLoading = false;
  bool isMutating = false;
  String? errorMessage;
  String? actionError;
  List<Map<String, dynamic>> users = const [];

  String searchTerm = '';
  String? roleFilter;
  bool? activeFilter;

  Timer? _debounce;

  Future<void> loadUsers() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final trimmed = searchTerm.trim();
      users = await repository.getUsers(
        email: trimmed.length >= 2 ? trimmed : null,
        role: roleFilter,
        isActive: activeFilter,
      );
    } on DioException catch (error) {
      errorMessage = _extractMessage(error) ?? 'Unable to load users.';
    } catch (_) {
      errorMessage = 'Unable to load users.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void searchChanged(String value) {
    searchTerm = value;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), loadUsers);
  }

  void setRoleFilter(String? role) {
    if (roleFilter == role) return;
    roleFilter = role;
    loadUsers();
  }

  void setActiveFilter(bool? isActive) {
    if (activeFilter == isActive) return;
    activeFilter = isActive;
    loadUsers();
  }

  Map<String, dynamic>? lastCreatedUser;

  Future<bool> createUser({
    required String email,
    required String firstName,
    required String lastName,
    required String password,
    required String role,
  }) async {
    isMutating = true;
    actionError = null;
    notifyListeners();
    try {
      lastCreatedUser = await repository.createUser(
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password,
        role: role,
      );
      await loadUsers();
      return true;
    } on DioException catch (error) {
      actionError = _extractMessage(error) ?? 'Unable to create user.';
    } catch (_) {
      actionError = 'Unable to create user.';
    } finally {
      isMutating = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> updateUser(
    String id, {
    required String firstName,
    required String lastName,
    String? role,
  }) async {
    isMutating = true;
    actionError = null;
    notifyListeners();
    try {
      final updated = await repository.updateUser(
        id,
        firstName: firstName,
        lastName: lastName,
        role: role,
      );
      final index = users.indexWhere((u) => u['id']?.toString() == id);
      if (index != -1) {
        final next = List<Map<String, dynamic>>.from(users);
        next[index] = updated.isNotEmpty ? updated : next[index];
        users = next;
      }
      return true;
    } on DioException catch (error) {
      actionError = _extractMessage(error) ?? 'Unable to update user.';
    } catch (_) {
      actionError = 'Unable to update user.';
    } finally {
      isMutating = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> toggleActive(Map<String, dynamic> user) async {
    final id = user['id']?.toString();
    if (id == null) return false;
    final isActive = user['isActive'] == true;
    actionError = null;
    try {
      if (isActive) {
        await repository.deactivateUser(id);
      } else {
        await repository.activateUser(id);
      }
      final index = users.indexWhere((u) => u['id']?.toString() == id);
      if (index != -1) {
        final next = List<Map<String, dynamic>>.from(users);
        next[index] = {...next[index], 'isActive': !isActive};
        users = next;
      }
      notifyListeners();
      return true;
    } on DioException catch (error) {
      actionError = _extractMessage(error) ?? 'Unable to update account status.';
    } catch (_) {
      actionError = 'Unable to update account status.';
    }
    notifyListeners();
    return false;
  }

  String? _extractMessage(DioException error) {
    final data = error.response?.data;
    if (data is Map) {
      final message = data['message'];
      if (message is String) return message;
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
