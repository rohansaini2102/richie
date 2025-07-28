import React, { useState } from 'react';
import { X, FileText, Send, AlertCircle } from 'lucide-react';
import { loeAPI } from '../../services/api';

const LOESendModal = ({ isOpen, onClose, meeting, onSuccess }) => {
  const [customNotes, setCustomNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSendLOE = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loeAPI.sendLOE(meeting.id || meeting._id, customNotes);
      
      if (response.success) {
        // Show success message indicating if it was sent or resent
        const action = response.data?.wasResent ? 'resent' : 'sent';
        console.log(`✅ LOE ${action} successfully:`, response.data);
        
        onSuccess?.(response.data);
        onClose();
      } else {
        setError(response.message || 'Failed to send LOE');
      }
    } catch (error) {
      console.error('Error sending LOE:', error);
      
      // Enhanced error handling with debug information
      let errorMessage = 'Failed to send Letter of Engagement';
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        
        // Log debug information if available
        if (error.response.data.debug) {
          console.error('LOE Debug Info:', error.response.data.debug);
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Send Letter of Engagement</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            {/* Client Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Client:</strong> {meeting.client?.firstName} {meeting.client?.lastName}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Email:</strong> {meeting.client?.email}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Meeting Date:</strong> {new Date(meeting.scheduledAt).toLocaleDateString()}
              </p>
            </div>

            {/* LOE Preview */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Letter of Engagement includes:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Your firm information and contact details</li>
                <li>Services to be provided (Financial Planning, Investment Advisory, etc.)</li>
                <li>Fee structure (Planning fee: $5,000, Advisory fee: 1%)</li>
                <li>Client and advisor responsibilities</li>
                <li>Important disclosures and conflicts of interest</li>
                <li>Electronic signature field for client</li>
              </ul>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add any specific notes or customizations for this engagement..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customNotes.length}/1000 characters
              </p>
            </div>

            {/* Process Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                <li>Client receives email with secure link to review LOE</li>
                <li>Client reviews engagement terms online</li>
                <li>Client provides electronic signature</li>
                <li>Both parties receive signed copy via email</li>
                <li>LOE status updates in your dashboard</li>
              </ol>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSendLOE}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Letter of Engagement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LOESendModal;