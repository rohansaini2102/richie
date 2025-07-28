import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Eye,
  Calendar,
  Mail,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { loeAPI, meetingAPI } from '../../services/api';
import LOEStatusBadge from '../meetings/LOEStatusBadge';
import LOEViewModal from '../loe/LOEViewModal';
import toast from 'react-hot-toast';

const ClientLOESection = ({ clientId, clientName }) => {
  const [loes, setLoes] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLOE, setSelectedLOE] = useState(null);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 [ClientLOESection] Loading data for client:', clientId);
      
      // Load LOEs and meetings in parallel
      const [loeResponse, meetingResponse] = await Promise.all([
        loeAPI.getLOEsByClient(clientId),
        meetingAPI.getMeetingsByClient(clientId)
      ]);

      console.log('📊 [ClientLOESection] LOE Response:', {
        success: loeResponse?.success,
        loesCount: loeResponse?.data?.loes?.length || 0,
        loes: loeResponse?.data?.loes
      });

      console.log('📊 [ClientLOESection] Meeting Response:', {
        success: meetingResponse?.success,
        meetingsCount: meetingResponse?.meetings?.length || 0,
        meetings: meetingResponse?.meetings
      });

      if (loeResponse.success) {
        setLoes(loeResponse.data.loes || []);
      }

      if (meetingResponse.success) {
        setMeetings(meetingResponse.meetings || []);
      }
    } catch (error) {
      console.error('❌ [ClientLOESection] Error loading LOE data:', error);
      toast.error('Failed to load LOE information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('LOE data refreshed');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewLOE = (loe) => {
    setSelectedLOE(loe);
    setViewModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'viewed':
        return <Eye className="h-5 w-5 text-blue-600" />;
      case 'sent':
        return <Send className="h-5 w-5 text-orange-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  // Calculate statistics
  const stats = {
    total: loes.length,
    signed: loes.filter(loe => loe.status === 'signed').length,
    pending: loes.filter(loe => ['sent', 'viewed'].includes(loe.status)).length,
    expired: loes.filter(loe => loe.status === 'expired').length
  };

  const meetingsWithLOE = meetings.map(meeting => {
    const relatedLOE = loes.find(loe => {
      // Handle both string and object meetingId
      const loeMeetingId = typeof loe.meetingId === 'object' ? loe.meetingId._id : loe.meetingId;
      const matches = loeMeetingId === meeting.id;
      
      console.log('🔗 [ClientLOESection] Meeting-LOE Match:', {
        meetingId: meeting.id,
        loeMeetingId,
        loeId: loe._id,
        matches
      });
      
      return matches;
    });
    return { ...meeting, loe: relatedLOE };
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LOE Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Letters of Engagement
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total LOEs</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.signed}</div>
            <div className="text-sm text-green-700">Signed</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-orange-700">Pending</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-red-700">Expired</div>
          </div>
        </div>

        {/* LOE List */}
        {loes.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">LOE History</h3>
            {loes.map((loe) => (
              <div
                key={loe._id}
                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(loe.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          LOE #{loe._id.slice(-6)}
                        </span>
                        <LOEStatusBadge status={loe.status} />
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Sent on {formatDate(loe.sentAt || loe.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {loe.status === 'signed' ? (
                        <div className="text-sm">
                          <div className="text-green-600 font-medium">
                            Signed on {formatDate(loe.signedAt)}
                          </div>
                        </div>
                      ) : loe.status === 'viewed' ? (
                        <div className="text-sm text-blue-600">
                          Viewed on {formatDate(loe.viewedAt)}
                        </div>
                      ) : loe.status === 'expired' ? (
                        <div className="text-sm text-red-600">
                          Expired on {formatDate(loe.expiresAt)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Expires on {formatDate(loe.expiresAt)}
                        </div>
                      )}
                    </div>
                    {loe.status === 'signed' && (
                      <button
                        onClick={() => handleViewLOE(loe)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No Letters of Engagement sent yet</p>
          </div>
        )}
      </div>

      {/* Meetings Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Meeting History
        </h3>

        {meetingsWithLOE.length > 0 ? (
          <div className="space-y-3">
            {meetingsWithLOE.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {meeting.meetingType === 'instant' ? 'Instant' : 'Scheduled'} Meeting
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDate(meeting.scheduledAt || meeting.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meeting.loe ? (
                      <LOEStatusBadge status={meeting.loe.status} />
                    ) : (
                      <span className="text-sm text-gray-500">
                        No LOE sent
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                      meeting.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      meeting.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
                {meeting.loe && meeting.loe.status === 'signed' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      LOE signed on {formatDate(meeting.loe.signedAt)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No meetings scheduled yet</p>
          </div>
        )}

        {/* Note about sending LOEs */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sending Letters of Engagement</p>
              <p>LOEs can only be sent from the meeting section during or after client onboarding meetings.</p>
              <a 
                href="/meetings" 
                className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Go to Meetings
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* LOE View Modal */}
      <LOEViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedLOE(null);
        }}
        loe={selectedLOE}
      />
    </div>
  );
};

export default ClientLOESection;