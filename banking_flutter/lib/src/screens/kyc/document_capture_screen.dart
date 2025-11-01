import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class DocumentCaptureScreen extends StatefulWidget {
  final String documentType;
  final Function(File) onImageCaptured;
  
  const DocumentCaptureScreen({
    super.key,
    required this.documentType,
    required this.onImageCaptured,
  });

  @override
  State<DocumentCaptureScreen> createState() => _DocumentCaptureScreenState();
}

class _DocumentCaptureScreenState extends State<DocumentCaptureScreen> {
  File? _capturedImage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _captureImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );
      
      if (image != null) {
        setState(() => _capturedImage = File(image.path));
        widget.onImageCaptured(_capturedImage!);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi chụp ảnh: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );
      
      if (image != null) {
        setState(() => _capturedImage = File(image.path));
        widget.onImageCaptured(_capturedImage!);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi chọn ảnh: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Instructions
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(
                widget.documentType == 'front' 
                    ? Icons.credit_card 
                    : Icons.credit_card,
                size: 48,
                color: widget.documentType == 'front' 
                    ? const Color(0xFF2563EB) 
                    : const Color(0xFF6C5CE7),
              ),
              const SizedBox(height: 16),
              Text(
                widget.documentType == 'front' 
                    ? 'Chụp mặt trước CCCD' 
                    : 'Chụp mặt sau CCCD',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.documentType == 'front'
                    ? 'Đặt CCCD trong khung và đảm bảo:\n• Ảnh rõ nét, không bị mờ\n• Đầy đủ thông tin trên CCCD\n• Ánh sáng đủ, không bị phản quang'
                    : 'Chụp mặt sau CCCD với:\n• Ảnh rõ nét, không bị mờ\n• Đầy đủ thông tin\n• Ánh sáng đủ',
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF7F8C8D),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Image Preview/Capture Area
        Expanded(
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: _capturedImage != null
                ? _buildImagePreview()
                : _buildCaptureArea(),
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Action Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickFromGallery,
                icon: const Icon(Icons.photo_library),
                label: const Text('Chọn từ thư viện'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(color: Color(0xFF2563EB)),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: _captureImage,
                icon: const Icon(Icons.camera_alt),
                label: Text(_capturedImage != null ? 'Chụp lại' : 'Chụp ảnh'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildImagePreview() {
    return Column(
      children: [
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF27AE60),
                width: 2,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(
                _capturedImage!,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
        
        // Image Quality Indicators
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildQualityIndicator(
                'Độ rõ nét',
                Icons.visibility,
                const Color(0xFF27AE60),
              ),
              _buildQualityIndicator(
                'Ánh sáng',
                Icons.lightbulb,
                const Color(0xFF27AE60),
              ),
              _buildQualityIndicator(
                'Góc chụp',
                Icons.crop_free,
                const Color(0xFF27AE60),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCaptureArea() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Document Frame
        Container(
          width: 280,
          height: 180,
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFF2563EB),
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Stack(
            children: [
              // Corner indicators
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2563EB),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(4),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2563EB),
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(4),
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2563EB),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(4),
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                right: 8,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2563EB),
                    borderRadius: BorderRadius.only(
                      bottomRight: Radius.circular(4),
                    ),
                  ),
                ),
              ),
              
              // Center icon
              const Center(
                child: Icon(
                  Icons.credit_card,
                  size: 48,
                  color: Color(0xFF2563EB),
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 24),
        
        Text(
          'Đặt CCCD trong khung trên',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Đảm bảo ảnh rõ nét và đầy đủ thông tin',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[500],
          ),
        ),
      ],
    );
  }

  Widget _buildQualityIndicator(String label, IconData icon, Color color) {
    return Column(
      children: [
        Icon(
          icon,
          color: color,
          size: 24,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
