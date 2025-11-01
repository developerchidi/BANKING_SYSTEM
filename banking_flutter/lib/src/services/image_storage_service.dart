import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

class ImageStorageService {
  static const String _kycFolder = 'kyc_images';
  static const String _studentCardFolder = 'student_cards';
  static const String _selfieFolder = 'selfies';

  /// Get the KYC images directory
  static Future<Directory> _getKycDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final kycDir = Directory(path.join(appDir.path, _kycFolder));
    
    if (!await kycDir.exists()) {
      await kycDir.create(recursive: true);
    }
    
    return kycDir;
  }

  /// Get student card images directory
  static Future<Directory> _getStudentCardDirectory() async {
    final kycDir = await _getKycDirectory();
    final studentCardDir = Directory(path.join(kycDir.path, _studentCardFolder));
    
    if (!await studentCardDir.exists()) {
      await studentCardDir.create(recursive: true);
    }
    
    return studentCardDir;
  }

  /// Get selfie images directory
  static Future<Directory> _getSelfieDirectory() async {
    final kycDir = await _getKycDirectory();
    final selfieDir = Directory(path.join(kycDir.path, _selfieFolder));
    
    if (!await selfieDir.exists()) {
      await selfieDir.create(recursive: true);
    }
    
    return selfieDir;
  }

  /// Save student card image
  static Future<String> saveStudentCardImage({
    required String userId,
    required File imageFile,
    String? customFileName,
  }) async {
    final studentCardDir = await _getStudentCardDirectory();
    
    // Generate filename: userId_timestamp.jpg
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = customFileName ?? '${userId}_student_card_$timestamp.jpg';
    final savedFile = File(path.join(studentCardDir.path, fileName));
    
    // Copy image to permanent location
    await imageFile.copy(savedFile.path);
    
    return savedFile.path;
  }

  /// Save selfie image
  static Future<String> saveSelfieImage({
    required String userId,
    required File imageFile,
    String? customFileName,
  }) async {
    final selfieDir = await _getSelfieDirectory();
    
    // Generate filename: userId_timestamp.jpg
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = customFileName ?? '${userId}_selfie_$timestamp.jpg';
    final savedFile = File(path.join(selfieDir.path, fileName));
    
    // Copy image to permanent location
    await imageFile.copy(savedFile.path);
    
    return savedFile.path;
  }

  /// Save image from bytes
  static Future<String> saveImageFromBytes({
    required String userId,
    required Uint8List imageBytes,
    required String type, // 'student_card' or 'selfie'
    String? customFileName,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = customFileName ?? '${userId}_${type}_$timestamp.jpg';
    
    Directory targetDir;
    if (type == 'student_card') {
      targetDir = await _getStudentCardDirectory();
    } else {
      targetDir = await _getSelfieDirectory();
    }
    
    final savedFile = File(path.join(targetDir.path, fileName));
    await savedFile.writeAsBytes(imageBytes);
    
    return savedFile.path;
  }

  /// Get student card image
  static Future<File?> getStudentCardImage(String userId) async {
    final studentCardDir = await _getStudentCardDirectory();
    final files = await studentCardDir.list().toList();
    
    // Find the most recent student card image for this user
    File? latestFile;
    DateTime? latestTime;
    
    for (var file in files) {
      if (file is File && file.path.contains(userId)) {
        final stat = await file.stat();
        if (latestTime == null || stat.modified.isAfter(latestTime)) {
          latestTime = stat.modified;
          latestFile = file;
        }
      }
    }
    
    return latestFile;
  }

  /// Get selfie image
  static Future<File?> getSelfieImage(String userId) async {
    final selfieDir = await _getSelfieDirectory();
    final files = await selfieDir.list().toList();
    
    // Find the most recent selfie image for this user
    File? latestFile;
    DateTime? latestTime;
    
    for (var file in files) {
      if (file is File && file.path.contains(userId)) {
        final stat = await file.stat();
        if (latestTime == null || stat.modified.isAfter(latestTime)) {
          latestTime = stat.modified;
          latestFile = file;
        }
      }
    }
    
    return latestFile;
  }

  /// Delete all KYC images for a user
  static Future<void> deleteUserKycImages(String userId) async {
    try {
      final studentCardDir = await _getStudentCardDirectory();
      final selfieDir = await _getSelfieDirectory();
      
      // Delete student card images
      final studentCardFiles = await studentCardDir.list().toList();
      for (var file in studentCardFiles) {
        if (file is File && file.path.contains(userId)) {
          await file.delete();
        }
      }
      
      // Delete selfie images
      final selfieFiles = await selfieDir.list().toList();
      for (var file in selfieFiles) {
        if (file is File && file.path.contains(userId)) {
          await file.delete();
        }
      }
    } catch (e) {
      print('Error deleting KYC images: $e');
    }
  }

  /// Get all KYC images for a user
  static Future<Map<String, String?>> getUserKycImages(String userId) async {
    final studentCardImage = await getStudentCardImage(userId);
    final selfieImage = await getSelfieImage(userId);
    
    return {
      'studentCard': studentCardImage?.path,
      'selfie': selfieImage?.path,
    };
  }

  /// Check if user has KYC images
  static Future<bool> hasKycImages(String userId) async {
    final images = await getUserKycImages(userId);
    return images['studentCard'] != null && images['selfie'] != null;
  }

  /// Get storage info
  static Future<Map<String, dynamic>> getStorageInfo() async {
    final kycDir = await _getKycDirectory();
    final studentCardDir = await _getStudentCardDirectory();
    final selfieDir = await _getSelfieDirectory();
    
    int totalFiles = 0;
    int totalSize = 0;
    
    // Count files and calculate size
    for (var dir in [studentCardDir, selfieDir]) {
      final files = await dir.list().toList();
      for (var file in files) {
        if (file is File) {
          totalFiles++;
          final stat = await file.stat();
          totalSize += stat.size;
        }
      }
    }
    
    return {
      'totalFiles': totalFiles,
      'totalSizeBytes': totalSize,
      'totalSizeMB': (totalSize / (1024 * 1024)).toStringAsFixed(2),
      'kycDirectory': kycDir.path,
    };
  }
}
