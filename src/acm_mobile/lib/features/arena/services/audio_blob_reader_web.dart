// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:typed_data';

Future<List<int>> readBlobBytes(String url) async {
  final request = await html.HttpRequest.request(
    url,
    responseType: 'arraybuffer',
  );
  final response = request.response;
  if (response is! ByteBuffer) {
    throw StateError('The browser returned an invalid audio blob response.');
  }
  return response.asUint8List();
}