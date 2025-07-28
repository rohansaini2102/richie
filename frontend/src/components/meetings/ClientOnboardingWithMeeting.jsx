import React, { useState } from 'react';
import { Video, Calendar, User, Mail, Clock, Send, Copy, ExternalLink } from 'lucide-react';
import { clientAPI } from '../../services/api';

const ClientOnboardingWithMeeting = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdInvitation, setCreatedInvitation] = useState(null);
  const [copied, setCopied] = useState({ onboarding: false, meeting: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientFirstName || !formData.clientEmail || !formData.scheduledDate || !formData.scheduledTime) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.clientEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate date is in the future
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError('Meeting must be scheduled for a future date and time.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await clientAPI.sendClientOnboardingWithMeeting({
        clientFirstName: formData.clientFirstName,
        clientLastName: formData.clientLastName,
        clientEmail: formData.clientEmail,
        scheduledAt: scheduledDateTime.toISOString(),
        notes: formData.notes
      });

      if (response.success) {
        setCreatedInvitation(response.data);
        setSuccess('Client onboarding and meeting invitation sent successfully! The client will receive an email with both the onboarding form and meeting link.');
        
        // Reset form
        setFormData({
          clientFirstName: '',
          clientLastName: '',
          clientEmail: '',
          scheduledDate: '',
          scheduledTime: '',
          notes: ''
        });

        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(error.response?.data?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (linkType, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(prev => ({ ...prev, [linkType]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [linkType]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Client Onboarding with Meeting</h2>
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              i
            </div>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">How This Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Client receives one email with both onboarding form and meeting links</li>
              <li>• Client completes financial profile before the meeting</li>
              <li>• You meet with a prepared client for better consultation</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientFirstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="clientFirstName"
                name="clientFirstName"
                value={formData.clientFirstName}
                onChange={handleInputChange}
                placeholder="Enter client's first name"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="clientLastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="clientLastName"
                name="clientLastName"
                value={formData.clientLastName}
                onChange={handleInputChange}
                placeholder="Enter client's last name"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              id="clientEmail"
              name="clientEmail"
              value={formData.clientEmail}
              onChange={handleInputChange}
              placeholder="Enter client's email address"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                id="scheduledTime"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {formData.scheduledDate && formData.scheduledTime && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Scheduled for:</strong> {formatDateTime(formData.scheduledDate, formData.scheduledTime)}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any additional notes about this client or meeting..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Onboarding & Meeting Links
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Display with Links */}
      {createdInvitation && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-900 mb-3">Invitation Sent Successfully!</h3>
          
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Client Onboarding Form:</span>
                <button
                  onClick={() => handleCopyLink('onboarding', createdInvitation.invitation.onboardingUrl)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {copied.onboarding ? (
                    <>✓ Copied</>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 p-1 rounded flex-1 truncate">
                  {createdInvitation.invitation.onboardingUrl}
                </code>
                <a
                  href={createdInvitation.invitation.onboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Client Meeting Link:</span>
                <button
                  onClick={() => handleCopyLink('meeting', createdInvitation.meeting.clientMeetingUrl)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {copied.meeting ? (
                    <>✓ Copied</>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 p-1 rounded flex-1 truncate">
                  {createdInvitation.meeting.clientMeetingUrl}
                </code>
                <a
                  href={createdInvitation.meeting.advisorMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800"
                  title="Open your advisor meeting link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="text-xs text-gray-600">
              <p>✉️ Client will receive an email with both links and clear instructions</p>
              <p>📅 Meeting ID: {createdInvitation.meeting.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOnboardingWithMeeting;