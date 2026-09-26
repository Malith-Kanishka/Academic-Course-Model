import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../models/course_module.dart';
import '../state/curriculum_controller.dart';

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
                            _ModuleCard(module: modules[index]),
                      ),
                    ),
        ),
      ],
    );
  }
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({required this.module});

  final CourseModule module;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: ExpansionTile(
          tilePadding: const EdgeInsets.fromLTRB(16, 8, 14, 8),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          leading: Container(
            width: 52,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: .15),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Text(module.code,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: AppTheme.primaryBlue,
                    fontSize: 10,
                    fontWeight: FontWeight.w800)),
          ),
          title: Text(module.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Row(
              children: [
                Text('${module.topics.length} topics'),
                const SizedBox(width: 10),
                const Icon(Icons.circle, size: 7, color: AppTheme.emerald),
                const SizedBox(width: 5),
                const Text('Active'),
              ],
            ),
          ),
          children: [
            if (module.description.isNotEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(module.description,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppTheme.textMuted)),
                ),
              ),
            if (module.topics.isEmpty)
              const ListTile(
                dense: true,
                leading: Icon(Icons.topic_outlined),
                title: Text('No topics published yet'),
              )
            else
              ...module.topics.map((topic) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.article_outlined,
                        color: AppTheme.primaryBlue),
                    title: Text(topic.title),
                    subtitle: topic.description.isEmpty
                        ? null
                        : Text(topic.description,
                            maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing: const Icon(Icons.arrow_forward_rounded, size: 18),
                    onTap: () => context.go('/arena', extra: topic),
                  )),
          ],
        ),
      );
}
