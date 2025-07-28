import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle, Loader } from 'lucide-react';

const PDFViewModal = ({ 
  isOpen, 
  onClose, 
  planId, 
  reportType, 
  planTitle,
  abTestingService 
}) => {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load PDF when modal opens
  useEffect(() => {
    if (isOpen && planId && reportType) {
      loadPDF();
    }
    
    // Cleanup when modal closes
    return () => {
      if (pdfData?.cleanup) {
        pdfData.cleanup();
      }
    };
  }, [isOpen, planId, reportType]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await abTestingService.viewPlanPDF(planId, reportType);
      setPdfData(result);
    } catch (err) {
      setError(`Failed to load PDF: ${err.message}`);
      console.error('Error loading PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfData) return;
    
    try {
      await abTestingService.downloadPlanPDF(
        planId, 
        reportType, 
        pdfData.filename
      );
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfData?.pdfUrl) {
      window.open(pdfData.pdfUrl, '_blank');
    }
  };

  const handleClose = () => {
    // Cleanup PDF URL
    if (pdfData?.cleanup) {
      pdfData.cleanup();
    }
    setPdfData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {planTitle || 'Financial Plan PDF'}
                </h3>
                <p className="text-sm text-gray-500">
                  {reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
                  {pdfData?.metadata?.version && ` - Version ${pdfData.metadata.version}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {pdfData && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                  
                  <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    New Tab
                  </button>
                </>
              )}
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Unable to Load PDF
                  </h4>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={loadPDF}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {pdfData && !loading && !error && (
              <div className="w-full h-full">
                <iframe
                  src={pdfData.pdfUrl}
                  className="w-full h-full border-0"
                  title={`${planTitle} - ${reportType} Report`}
                />
              </div>
            )}
          </div>
          
          {/* Footer */}
          {pdfData?.metadata && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Generated: {new Date(pdfData.metadata.generatedAt).toLocaleDateString()}</span>
                  <span>Plan Version: {pdfData.metadata.planVersion || 1}</span>
                  <span>Report Version: {pdfData.metadata.version || 1}</span>
                </div>
                <div>
                  File: {pdfData.filename}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewModal;