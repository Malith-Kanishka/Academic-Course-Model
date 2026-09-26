import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../models/course_module.dart';
import '../state/curriculum_controller.dart';
import '../widgets/module_expansion_tile.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<CurriculumController>().loadModules();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CurriculumController>();
    final query = _query.toLowerCase().trim();
    final modules = controller.modules.where((module) {
      return query.isEmpty ||
          module.code.toLowerCase().contains(query) ||
          module.title.toLowerCase().contains(query) ||
          module.topics
              .any((topic) => topic.title.toLowerCase().contains(query));
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
          child: TextField(
            controller: _searchController,
            onChanged: (value) => setState(() => _query = value),
            decoration: InputDecoration(
              hintText: 'Search course code, module, or topic',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _query.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Clear search',
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                      icon: const Icon(Icons.close_rounded),
                    ),
            ),
          ),
        ),
        if (controller.errorMessage != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    size: 16, color: AppTheme.amber),
                const SizedBox(width: 7),
                Expanded(
                    child: Text(controller.errorMessage!,
                        style: Theme.of(context).textTheme.bodySmall)),
              ],
            ),
          ),
        Expanded(
          child: controller.isLoading && controller.modules.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : modules.isEmpty
                  ? const Center(child: Text('No matching courses found.'))
                  : RefreshIndicator(
                      onRefresh: controller.loadModules,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
                        itemCount: modules.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) =>
                            ModuleExpansionTile(module: modules[index]),
                      ),
                    ),
        ),
      ],
    );
  }
}
