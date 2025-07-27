import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, Send, Copy, Check } from 'lucide-react';
import { meetingAPI, clientAPI } from '../../services/api';

const MeetingScheduler = ({ onMeetingCreated, selectedClientId = null }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(selectedClientId || '');
  const [meetingType, setMeetingType] = useState('scheduled'); // 'scheduled' or 'instant'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const response = await clientAPI.getClients({ limit: 100 });
      setClients(response.data?.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!selectedClient) {
      setError('Please select a client for the meeting.');
      return;
    }

    if (meetingType === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      setError('Please select both date and time for scheduled meetings.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (meetingType === 'instant') {
        response = await meetingAPI.createInstantMeeting(selectedClient);
      } else {
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        response = await meetingAPI.createMeeting({
          clientId: selectedClient,
          scheduledAt: scheduledAt.toISOString(),
          meetingType: 'scheduled'
        });
      }

      if (response.success) {
        setCreatedMeeting(response.meeting);
        if (onMeetingCreated) {
          onMeetingCreated(response.meeting);
        }
        
        // Reset form
        if (!selectedClientId) { // Only reset if not pre-selected
          setSelectedClient('');
        }
        setScheduledDate('');
        setScheduledTime('');
        setMeetingType('scheduled');
      } else {
        setError(response.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error.response?.data?.error || 'Failed to create meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMeetingLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
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

  const selectedClientData = clients.find(c => c._id === selectedClient);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Schedule Meeting</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Meeting Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Meeting Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="instant"
              checked={meetingType === 'instant'}
              onChange={(e) => setMeetingType(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Instant Meeting</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="scheduled"
              checked={meetingType === 'scheduled'}
              onChange={(e) => setMeetingType(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Scheduled Meeting</span>
          </label>
        </div>
      </div>

      {/* Client Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="h-4 w-4 inline mr-1" />
          Select Client
        </label>
        {loadingClients ? (
          <div className="p-3 text-gray-500 text-sm">Loading clients...</div>
        ) : (
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={selectedClientId} // Disable if client is pre-selected
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.firstName} {client.lastName} ({client.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Date/Time Selection for Scheduled Meetings */}
      {meetingType === 'scheduled' && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Meeting Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Meeting Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Selected Client Info */}
      {selectedClientData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Meeting with:</h4>
          <div className="text-sm text-blue-800">
            <p className="font-medium">{selectedClientData.firstName} {selectedClientData.lastName}</p>
            <p>{selectedClientData.email}</p>
          </div>
        </div>
      )}

      {/* Create Meeting Button */}
      <button
        onClick={handleCreateMeeting}
        disabled={isLoading || !selectedClient}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Creating Meeting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {meetingType === 'instant' ? 'Start Instant Meeting' : 'Schedule Meeting'}
          </>
        )}
      </button>

      {/* Created Meeting Info */}
      {createdMeeting && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-900">Meeting Created Successfully!</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Client: </span>
              <span className="text-gray-900">
                {createdMeeting.client?.firstName} {createdMeeting.client?.lastName}
              </span>
            </div>
            
            {createdMeeting.meetingType === 'scheduled' && (
              <div>
                <span className="font-medium text-gray-700">Scheduled for: </span>
                <span className="text-gray-900">{formatDateTime(createdMeeting.scheduledAt)}</span>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700">Meeting Room: </span>
              <span className="text-gray-900">{createdMeeting.roomName}</span>
            </div>
            
            <div className="pt-3 border-t border-green-200">
              <p className="font-medium text-gray-700 mb-2">Meeting Links:</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 w-20">Advisor:</span>
                  <input
                    type="text"
                    value={createdMeeting.advisorMeetingLink}
                    readOnly
                    className="flex-1 p-2 text-xs bg-white border border-gray-300 rounded text-gray-700"
                  />
                  <button
                    onClick={() => handleCopyMeetingLink(createdMeeting.advisorMeetingLink)}
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Copy advisor link"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 w-20">Client:</span>
                  <input
                    type="text"
                    value={createdMeeting.clientMeetingLink}
                    readOnly
                    className="flex-1 p-2 text-xs bg-white border border-gray-300 rounded text-gray-700"
                  />
                  <button
                    onClick={() => handleCopyMeetingLink(createdMeeting.clientMeetingLink)}
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Copy client link"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mt-3">
                💡 Send the client link to your client to join the meeting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;