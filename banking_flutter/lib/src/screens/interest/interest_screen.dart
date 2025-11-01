import 'package:flutter/material.dart';
import '../../widgets/interest_card.dart';

class InterestScreen extends StatelessWidget {
  const InterestScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F23),
      appBar: AppBar(
        title: const Text(
          'Lãi suất tiết kiệm',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            onPressed: () {
              // Navigate to interest history
              Navigator.pushNamed(context, '/interest-history');
            },
            icon: const Icon(Icons.history),
            tooltip: 'Lịch sử lãi suất',
          ),
        ],
      ),
      body: const SingleChildScrollView(
        child: Column(
          children: [
            // Interest Card - hiển thị thông tin lãi suất hiện tại
            InterestCard(),
          ],
        ),
      ),
    );
  }
}
