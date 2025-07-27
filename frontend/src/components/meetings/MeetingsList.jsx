import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Copy, 
  Check, 
  Play, 
  Square, 
  ExternalLink,
  Filter,
  RefreshCw,
  FileText,
  Eye
} from 'lucide-react';
import { meetingAPI } from '../../services/api';
import TranscriptViewer from './TranscriptViewer';
import MeetingRoom from './MeetingRoom';

const MeetingsList = ({ refreshTrigger }) => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'scheduled', 'active', 'completed'
  const [copied, setCopied] = useState(null);
  const [selectedTranscriptMeeting, setSelectedTranscriptMeeting] = useState(null);
  const [joinedMeeting, setJoinedMeeting] = useState(null);

  useEffect(() => {
    loadMeetings();
  }, [refreshTrigger, filter]);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await meetingAPI.getAdvisorMeetings(params);
      setMeetings(response.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      setError('Failed to load meetings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (link, meetingId) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(meetingId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      await meetingAPI.updateMeetingStatus(meetingId, newStatus);
      // Refresh the meetings list
      loadMeetings();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
      setError('Failed to update meeting status.');
    }
  };

  const handleJoinMeeting = (meeting) => {
    setJoinedMeeting(meeting);
  };

  const handleLeaveMeeting = () => {
    setJoinedMeeting(null);
    // Refresh meetings to get updated status
    loadMeetings();
  };

  const handleViewTranscript = (meetingId) => {
    setSelectedTranscriptMeeting(meetingId);
  };

  const hasTranscript = (meeting) => {
    return meeting.transcript?.status === 'completed' || 
           (meeting.transcript?.realTimeMessages && meeting.transcript.realTimeMessages.length > 0);
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let datePrefix = '';
    if (isToday) datePrefix = 'Today, ';
    else if (isTomorrow) datePrefix = 'Tomorrow, ';
    
    return datePrefix + date.toLocaleString('en-US', {
      weekday: isToday || isTomorrow ? undefined : 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getMeetingTypeBadge = (meetingType) => {
    return meetingType === 'instant' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
        Instant
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
        Scheduled
      </span>
    );
  };

  // Render meeting room if user joined
  if (joinedMeeting) {
    return (
      <MeetingRoom
        meetingUrl={joinedMeeting.advisorMeetingLink}
        meetingId={joinedMeeting.id}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading meetings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Recent Meetings</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Meetings</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {/* Refresh */}
          <button
            onClick={loadMeetings}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh meetings"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No meetings found</p>
          <p className="text-sm text-gray-500">
            {filter === 'all' 
              ? 'Create your first meeting to get started.' 
              : `No ${filter} meetings found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Meeting Info */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {meeting.client?.firstName} {meeting.client?.lastName}
                      </span>
                    </div>
                    {getStatusBadge(meeting.status)}
                    {getMeetingTypeBadge(meeting.meetingType)}
                  </div>
                  
                  {/* Date/Time */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(meeting.scheduledAt)}</span>
                    </div>
                    {meeting.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{meeting.duration} min</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Meeting Links */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 w-16">Client:</span>
                      <input
                        type="text"
                        value={meeting.clientMeetingLink}
                        readOnly
                        className="flex-1 p-2 text-xs bg-gray-50 border border-gray-300 rounded text-gray-700"
                      />
                      <button
                        onClick={() => handleCopyLink(meeting.clientMeetingLink, meeting.id)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Copy client link"
                      >
                        {copied === meeting.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={meeting.clientMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Open client link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 w-16">Advisor:</span>
                      <input
                        type="text"
                        value={meeting.advisorMeetingLink}
                        readOnly
                        className="flex-1 p-2 text-xs bg-gray-50 border border-gray-300 rounded text-gray-700"
                      />
                      <button
                        onClick={() => handleCopyLink(meeting.advisorMeetingLink, meeting.id)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Copy advisor link"
                      >
                        {copied === meeting.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={meeting.advisorMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Join meeting"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  {/* Join Meeting Button */}
                  {(meeting.status === 'scheduled' || meeting.status === 'active') && (
                    <button
                      onClick={() => handleJoinMeeting(meeting)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      title="Join meeting"
                    >
                      <Video className="h-3 w-3" />
                      Join
                    </button>
                  )}
                  
                  {/* Status Control Buttons */}
                  {meeting.status === 'scheduled' && (
                    <button
                      onClick={() => handleUpdateStatus(meeting.id, 'active')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                      title="Start meeting"
                    >
                      <Play className="h-3 w-3" />
                      Start
                    </button>
                  )}
                  
                  {meeting.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(meeting.id, 'completed')}
                      className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                      title="End meeting"
                    >
                      <Square className="h-3 w-3" />
                      End
                    </button>
                  )}

                  {/* View Transcript Button */}
                  {hasTranscript(meeting) && (
                    <button
                      onClick={() => handleViewTranscript(meeting.id)}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                      title="View transcript"
                    >
                      <FileText className="h-3 w-3" />
                      Transcript
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Viewer Modal */}
      {selectedTranscriptMeeting && (
        <TranscriptViewer
          meetingId={selectedTranscriptMeeting}
          onClose={() => setSelectedTranscriptMeeting(null)}
        />
      )}
    </div>
  );
};

export default MeetingsList;