import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class ActionRoutingButton extends StatelessWidget {
  const ActionRoutingButton({required this.plan, super.key});
  final Map<String, dynamic> plan;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Routing to material...')));
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
      ),
      child: const Text('Read Required Material'),
    );
  }
}
