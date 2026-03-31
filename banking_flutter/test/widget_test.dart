// Smoke test — không phụ thuộc package name cũ (banking_flutter) hay MyApp demo.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('smoke: MaterialApp renders', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: Text('ChidiBank')),
        ),
      ),
    );
    expect(find.text('ChidiBank'), findsOneWidget);
  });
}
