import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppTheme {
  static const slate = Color(0xFF0F172A);
  static const surface = Color(0xFF1E293B);
  static const border = Color(0xFF334155);
  static const primaryBlue = Color(0xFF3B82F6);
  static const indigo = Color(0xFF6366F1);
  static const emerald = Color(0xFF10B981);
  static const amber = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const textPrimary = Color(0xFFF8FAFC);
  static const textMuted = Color(0xFF94A3B8);

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme = isDark
        ? const ColorScheme.dark(
            primary: primaryBlue,
            secondary: indigo,
            surface: surface,
            error: danger,
            onSurface: textPrimary,
            onPrimary: Colors.white,
            outline: border,
            outlineVariant: border,
          )
        : ColorScheme.fromSeed(seedColor: primaryBlue, brightness: brightness);
    final textTheme = GoogleFonts.manropeTextTheme(
      (isDark ? ThemeData.dark() : ThemeData.light()).textTheme,
    );

    return (isDark
            ? ThemeData.dark(useMaterial3: true)
            : ThemeData.light(useMaterial3: true))
        .copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? slate : scheme.surface,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? slate : scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: isDark ? surface : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isDark ? const BorderSide(color: border) : BorderSide.none,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? surface : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryBlue, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52))
            .copyWith(
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
