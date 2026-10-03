import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/student_dashboard_summary.dart';

enum _CalendarRange { week, month }

class StudyCalendarAgenda extends StatefulWidget {
  const StudyCalendarAgenda({
    required this.plans,
    required this.onLaunchPlan,
    super.key,
  });

  final List<ActiveRemedialPlanSummary> plans;
  final ValueChanged<ActiveRemedialPlanSummary> onLaunchPlan;

  @override
  State<StudyCalendarAgenda> createState() => _StudyCalendarAgendaState();
}

class _StudyCalendarAgendaState extends State<StudyCalendarAgenda> {
  late DateTime _selectedDate = DateUtils.dateOnly(DateTime.now());
  _CalendarRange _range = _CalendarRange.week;

  List<DateTime> get _visibleDates {
    if (_range == _CalendarRange.month) {
      final first = DateTime(_selectedDate.year, _selectedDate.month);
      final days = DateUtils.getDaysInMonth(first.year, first.month);
      return List.generate(days, (index) => first.add(Duration(days: index)));
    }

    final first =
        _selectedDate.subtract(Duration(days: _selectedDate.weekday - 1));
    return List.generate(
        7, (index) => DateUtils.dateOnly(first.add(Duration(days: index))));
  }

  void _moveRange(int direction) {
    setState(() {
      if (_range == _CalendarRange.month) {
        _selectedDate =
            DateTime(_selectedDate.year, _selectedDate.month + direction, 1);
      } else {
        _selectedDate = _selectedDate.add(Duration(days: direction * 7));
      }
    });
  }

  String _agendaDateLabel(MaterialLocalizations localizations) {
    final today = DateUtils.dateOnly(DateTime.now());
    final difference =
        DateUtils.dateOnly(_selectedDate).difference(today).inDays;
    if (difference == 0) return 'Today';
    if (difference == 1) return 'Tomorrow';
    if (difference == -1) return 'Yesterday';
    return localizations.formatMediumDate(_selectedDate);
  }

  @override
  Widget build(BuildContext context) {
    final localizations = MaterialLocalizations.of(context);
    final activePlans =
        widget.plans.where((plan) => plan.includesDate(_selectedDate)).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0E1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: .08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.calendar_month_rounded,
                  color: AppTheme.primaryBlue, size: 20),
              const SizedBox(width: 9),
              Expanded(
                child: Text('Study calendar',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w800,
                        )),
              ),
              SegmentedButton<_CalendarRange>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(
                      value: _CalendarRange.week, label: Text('Week')),
                  ButtonSegment(
                      value: _CalendarRange.month, label: Text('Month')),
                ],
                selected: {_range},
                onSelectionChanged: (selection) => setState(() {
                  _range = selection.first;
                }),
                style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  textStyle:
                      const WidgetStatePropertyAll(TextStyle(fontSize: 11)),
                  padding: const WidgetStatePropertyAll(
                    EdgeInsets.symmetric(horizontal: 9, vertical: 8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              IconButton(
                tooltip:
                    'Previous ${_range == _CalendarRange.week ? 'week' : 'month'}',
                visualDensity: VisualDensity.compact,
                onPressed: () => _moveRange(-1),
                icon: const Icon(Icons.chevron_left_rounded),
              ),
              Expanded(
                child: Text(
                  _range == _CalendarRange.month
                      ? localizations.formatMonthYear(_selectedDate)
                      : localizations.formatMediumDate(_visibleDates.first),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
              IconButton(
                tooltip:
                    'Next ${_range == _CalendarRange.week ? 'week' : 'month'}',
                visualDensity: VisualDensity.compact,
                onPressed: () => _moveRange(1),
                icon: const Icon(Icons.chevron_right_rounded),
              ),
            ],
          ),
          SizedBox(
            height: 66,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _visibleDates.length,
              separatorBuilder: (_, __) => const SizedBox(width: 7),
              itemBuilder: (context, index) {
                final date = _visibleDates[index];
                final selected = DateUtils.isSameDay(date, _selectedDate);
                final hasPlan =
                    widget.plans.any((plan) => plan.includesDate(date));
                return _CalendarDateButton(
                  date: date,
                  selected: selected,
                  hasPlan: hasPlan,
                  onTap: () => setState(() => _selectedDate = date),
                );
              },
            ),
          ),
          const SizedBox(height: 17),
          Text(
            '${_agendaDateLabel(localizations)} · Assigned practice tasks',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 9),
          if (activePlans.isEmpty)
            const _EmptyAgenda()
          else
            ...activePlans.map((plan) => _PlanAgendaItem(
                  plan: plan,
                  day: plan.dayFor(_selectedDate),
                  onLaunch: () => widget.onLaunchPlan(plan),
                )),
        ],
      ),
    );
  }
}

class _CalendarDateButton extends StatelessWidget {
  const _CalendarDateButton({
    required this.date,
    required this.selected,
    required this.hasPlan,
    required this.onTap,
  });

  final DateTime date;
  final bool selected;
  final bool hasPlan;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppTheme.primaryBlue : const Color(0xFF161B2E);
    return SizedBox(
      width: 47,
      child: Material(
        color: color,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                const [
                  'Mon',
                  'Tue',
                  'Wed',
                  'Thu',
                  'Fri',
                  'Sat',
                  'Sun'
                ][date.weekday - 1],
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: selected ? Colors.white : AppTheme.textMuted,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                '${date.day}',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: selected ? Colors.white : AppTheme.textPrimary,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 2),
              SizedBox(
                height: 4,
                child: hasPlan
                    ? const DecoratedBox(
                        decoration: BoxDecoration(
                          color: AppTheme.emerald,
                          shape: BoxShape.circle,
                        ),
                        child: SizedBox(width: 4, height: 4),
                      )
                    : const SizedBox(height: 4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanAgendaItem extends StatelessWidget {
  const _PlanAgendaItem({
    required this.plan,
    required this.day,
    required this.onLaunch,
  });

  final ActiveRemedialPlanSummary plan;
  final int day;
  final VoidCallback onLaunch;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF161B2E),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.graphic_eq_rounded,
                    size: 18, color: AppTheme.emerald),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Socratic Arena · ${plan.topicName}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
                Text('Day $day of 7',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.emerald,
                          fontWeight: FontWeight.w700,
                        )),
              ],
            ),
            if (plan.actionItems.isNotEmpty) ...[
              const SizedBox(height: 9),
              for (final task in plan.actionItems)
                Padding(
                  padding: const EdgeInsets.only(bottom: 5),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Icon(Icons.circle,
                            size: 6, color: AppTheme.textMuted),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(task,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppTheme.textMuted,
                                    )),
                      ),
                    ],
                  ),
                ),
            ],
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onLaunch,
                icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                label: const Text('Practice'),
              ),
            ),
          ],
        ),
      );
}

class _EmptyAgenda extends StatelessWidget {
  const _EmptyAgenda();

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 17),
        decoration: BoxDecoration(
          color: const Color(0xFF161B2E),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          'No approved practice tasks are scheduled for this date.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textMuted,
              ),
        ),
      );
}
