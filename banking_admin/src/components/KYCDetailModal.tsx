import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Download, Eye, User as UserIcon, CreditCard, Calendar, MapPin, GraduationCap } from 'lucide-react';
import type { User } from '../types';
import { apiService } from '../services/api';

interface KYCDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycRequest: User | null;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
}

const KYCDetailModal: React.FC<KYCDetailModalProps> = ({
  isOpen,
  onClose,
  kycRequest,
  onApprove,
  onReject,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [docUrls, setDocUrls] = useState<{ studentCardUrl?: string | null; selfieUrl?: string | null } | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{ type: 'image' | 'video'; url: string; title: string } | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  
  // Image zoom and pan states
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!isOpen || !kycRequest) return;
    
    let mounted = true;
    (async () => {
      try {
        console.log('🔍 Fetching KYC documents for user:', kycRequest.id);
        const data = await apiService.getKycDocuments(kycRequest.id);
        console.log('🔍 KYC documents response:', data);
        if (mounted) {
          setDocUrls({
            studentCardUrl: data.studentCardImage || data.studentCardUrl,
            selfieUrl: data.selfieVideo || data.selfieUrl
          });
          
          // Parse extracted data if available
          if (data.extractedData) {
            try {
              const parsed = typeof data.extractedData === 'string' 
                ? JSON.parse(data.extractedData) 
                : data.extractedData;
              console.log('🔍 Parsed extracted data:', parsed);
              setExtractedData(parsed);
            } catch (e) {
              console.error('🔍 Error parsing extracted data:', e);
              setExtractedData(null);
            }
          }
        }
      } catch (e) {
        console.error('🔍 Error fetching KYC documents:', e);
        if (mounted) setDocUrls(null);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, kycRequest?.id]);

  // Image zoom and pan functions
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Calculate fit-to-screen zoom
  const calculateFitZoom = () => {
    if (selectedDocument?.type === 'image') {
      // For portrait images, fit to screen height
      return Math.min(1, window.innerHeight / (window.innerHeight * 0.8));
    }
    return 1;
  };

  // Reset zoom when document changes
  React.useEffect(() => {
    if (selectedDocument) {
      const fitZoom = calculateFitZoom();
      setZoom(fitZoom);
      setPanX(0);
      setPanY(0);
    }
  }, [selectedDocument]);

  // Keyboard support for modal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedDocument) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedDocument(null);
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoomIn();
      } else if (event.key === '-') {
        event.preventDefault();
        handleZoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        handleResetZoom();
      }
    };

    if (selectedDocument) {
      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [selectedDocument]);

  if (!isOpen || !kycRequest) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(kycRequest.id, reviewNotes);
      onClose();
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to approve KYC:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(kycRequest.id, reviewNotes);
      onClose();
      setReviewNotes('');
      setShowRejectForm(false);
    } catch (error) {
      console.error('Failed to reject KYC:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-[9998] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết hồ sơ KYC
              </h2>
              <p className="text-sm text-gray-500">
                {kycRequest.firstName} {kycRequest.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
              Thông tin sinh viên
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                  <p className="text-sm text-gray-900">
                    {kycRequest.firstName} {kycRequest.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{kycRequest.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="text-sm text-gray-900">{kycRequest.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">MSSV</label>
                  <p className="text-sm text-gray-900">
                    {extractedData?.studentId || kycRequest.studentId || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trường</label>
                  <p className="text-sm text-gray-900">
                    {extractedData?.university || kycRequest.university || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Khóa</label>
                  <p className="text-sm text-gray-900">
                    {extractedData?.academicYear || kycRequest.academicYear || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                  <p className="text-sm text-gray-900">
                    {extractedData?.dateOfBirth || kycRequest.dateOfBirth || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Tài liệu đã nộp
            </h3>
            
            {/* Documents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Student Card */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Thẻ sinh viên</h4>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedDocument({ type: 'image', url: docUrls?.studentCardUrl, title: 'Thẻ sinh viên' })}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </button>
                  <button className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Tải xuống
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {docUrls?.studentCardUrl ? (
                  <div className="flex justify-center">
                    <img 
                      src={docUrls.studentCardUrl} 
                      alt="student-card" 
                      className="max-w-full max-h-80 object-contain rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                      style={{ aspectRatio: '3/4' }} // Portrait aspect ratio
                      onClick={() => setSelectedDocument({ type: 'image', url: docUrls.studentCardUrl, title: 'Thẻ sinh viên' })}
                      onError={(e) => {
                        console.error('🔍 Error loading student card image:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => console.log('🔍 Student card image loaded successfully')}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Ảnh thẻ sinh viên</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selfie Video */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Video selfie</h4>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedDocument({ type: 'video', url: docUrls?.selfieUrl, title: 'Video selfie' })}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </button>
                  <button className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Tải xuống
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {docUrls?.selfieUrl ? (
                  <div className="flex justify-center">
                    {docUrls.selfieUrl.startsWith('data:video') || docUrls.selfieUrl.endsWith('.mp4') || docUrls.selfieUrl.includes('/videos/') ? (
                      <video 
                        src={docUrls.selfieUrl} 
                        controls 
                        className="max-w-full max-h-80 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                        style={{ aspectRatio: '9/16' }} // Portrait video aspect ratio
                        onClick={() => setSelectedDocument({ type: 'video', url: docUrls.selfieUrl, title: 'Video selfie' })}
                        onError={(e) => {
                          console.error('🔍 Error loading selfie video:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => console.log('🔍 Selfie video loaded successfully')}
                      />
                    ) : (
                      <img 
                        src={docUrls.selfieUrl} 
                        alt="selfie" 
                        className="max-w-full max-h-80 object-contain rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                        style={{ aspectRatio: '3/4' }} // Portrait aspect ratio
                        onClick={() => setSelectedDocument({ type: 'image', url: docUrls.selfieUrl, title: 'Video selfie' })}
                        onError={(e) => {
                          console.error('🔍 Error loading selfie image:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => console.log('🔍 Selfie image loaded successfully')}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Video selfie</span>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Review Notes */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Ghi chú đánh giá
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Nhập ghi chú đánh giá (tùy chọn)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            
            {kycRequest.kycStatus === 'PENDING' && (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-1 inline" />
                  Từ chối
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1 inline" />
                  {isProcessing ? 'Đang xử lý...' : 'Duyệt'}
                </button>
              </>
            )}
          </div>

          {/* Reject Confirmation */}
          {showRejectForm && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Xác nhận từ chối
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Bạn có chắc chắn muốn từ chối hồ sơ KYC này? Hành động này không thể hoàn tác.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Style Document Viewer Modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-lg flex items-center justify-center z-[9999]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedDocument(null);
          }}
        >
          {/* Top Toolbar */}
          <div 
            className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-white text-lg font-medium">
                  {selectedDocument.title}
                </h2>
                <div className="text-white text-sm opacity-75">
                  {selectedDocument.type === 'image' ? 'Ảnh' : 'Video'}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Zoom Controls */}
                {selectedDocument.type === 'image' && (
                  <>
                    <button
                      onClick={handleZoomOut}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                      title="Thu nhỏ (-)"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="text-white text-sm px-2">
                      {Math.round(zoom * 100)}%
                    </span>
                    
                    <button
                      onClick={handleZoomIn}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                      title="Phóng to (+)"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={handleResetZoom}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                      title="Fit to Screen (0)"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </>
                )}
                
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedDocument(null);
                  }}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Đóng (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={selectedDocument.type === 'image' ? handleWheel : undefined}
            onMouseDown={selectedDocument.type === 'image' ? handleMouseDown : undefined}
            onMouseMove={selectedDocument.type === 'image' ? handleMouseMove : undefined}
            onMouseUp={selectedDocument.type === 'image' ? handleMouseUp : undefined}
            onMouseLeave={selectedDocument.type === 'image' ? handleMouseUp : undefined}
            style={{ 
              cursor: selectedDocument.type === 'image' && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              backgroundColor: 'transparent'
            }}
          >
                  {selectedDocument.type === 'image' ? (
                    <img 
                      src={selectedDocument.url} 
                      alt={selectedDocument.title}
                      className="select-none"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        maxWidth: '100vw',
                        maxHeight: '100vh',
                        width: 'auto',
                        height: 'auto'
                      }}
                      draggable={false}
                      onLoad={() => console.log('🔍 Modal image loaded successfully')}
                      onError={(e) => {
                        console.error('🔍 Error loading modal image:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <>
                      <video 
                        src={selectedDocument.url} 
                        autoPlay
                        loop
                        muted
                        className="max-w-full max-h-full"
                        style={{ 
                          aspectRatio: 'auto',
                          objectFit: 'contain',
                          backgroundColor: 'transparent',
                          height: '100%',
                          width: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onLoad={() => console.log('🔍 Modal video loaded successfully')}
                        onError={(e) => {
                          console.error('🔍 Error loading modal video:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <style jsx>{`
                        video::-webkit-media-controls {
                          display: none !important;
                        }
                        video::-webkit-media-controls-panel {
                          display: none !important;
                        }
                        video::-webkit-media-controls-play-button {
                          display: none !important;
                        }
                        video::-webkit-media-controls-timeline {
                          display: none !important;
                        }
                        video::-webkit-media-controls-current-time-display {
                          display: none !important;
                        }
                        video::-webkit-media-controls-time-remaining-display {
                          display: none !important;
                        }
                        video::-webkit-media-controls-mute-button {
                          display: none !important;
                        }
                        video::-webkit-media-controls-volume-slider {
                          display: none !important;
                        }
                        video::-webkit-media-controls-fullscreen-button {
                          display: none !important;
                        }
                      `}</style>
                    </>
                  )}
          </div>

          {/* Bottom Info Bar */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <div className="text-white text-sm opacity-75">
                {selectedDocument.type === 'image' ? 'JPEG' : 'MP4'} • 
                {selectedDocument.type === 'image' ? 'Ảnh tài liệu' : 'Video xác minh'}
              </div>
              
              <div className="text-white text-sm opacity-75">
                {selectedDocument.type === 'image' && (
                  <>
                    Scroll để zoom • Drag để di chuyển • ESC để đóng
                  </>
                )}
                {selectedDocument.type === 'video' && (
                  <>
                    Video tự động phát • ESC để đóng
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCDetailModal;
