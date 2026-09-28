import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class StudentMasteryGauge extends StatelessWidget {
  const StudentMasteryGauge({required this.score, super.key});
  final int score;

  @override
  Widget build(BuildContext context) {
    final color = score < 65 ? AppTheme.danger : AppTheme.emerald;
    return SizedBox(
      width: 60,
      height: 60,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CircularProgressIndicator(
            value: score / 100,
            backgroundColor: AppTheme.border,
            color: color,
            strokeWidth: 6,
          ),
          Center(
            child: Text(
              '$score%',
              style: TextStyle(color: color, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
