import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../models/course_module.dart';
import 'progress_indicator.dart';

class ModuleExpansionTile extends StatelessWidget {
  const ModuleExpansionTile({required this.module, super.key});

  final CourseModule module;

  @override
  Widget build(BuildContext context) {
    return Card(
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
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              ModuleProgressIndicator(
                totalTopics: module.topics.length,
                completedTopics: module.completedTopics,
              ),
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
                  onTap: () => context.go('/topic', extra: topic),
                )),
        ],
      ),
    );
  }
}
