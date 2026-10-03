import 'package:path_provider/path_provider.dart';

Future<String> getAudioTempPath() async {
  final dir = await getTemporaryDirectory();
  return '${dir.path}/student_audio.m4a';
}
