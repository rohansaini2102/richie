import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import { loeAPI } from '../../services/api';

const LOEStatusBadge = ({ meetingId, onStatusChange }) => {
  const [loeStatus, setLoeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkLOEStatus();
  }, [meetingId]);

  const checkLOEStatus = async () => {
    if (!meetingId) return;
    
    setIsLoading(true);
    try {
      const response = await loeAPI.getMeetingLOEStatus(meetingId);
      if (response.success && response.data.hasLOE) {
        setLoeStatus(response.data);
        onStatusChange?.(response.data);
      }
    } catch (error) {
      console.error('Error checking LOE status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
        <span>Checking...</span>
      </div>
    );
  }

  if (!loeStatus || !loeStatus.hasLOE) {
    return null;
  }

  const getStatusDisplay = () => {
    switch (loeStatus.status) {
      case 'draft':
        return {
          icon: FileText,
          text: 'LOE Draft',
          className: 'bg-gray-100 text-gray-700',
          iconClass: 'text-gray-500'
        };
      case 'sent':
        return {
          icon: Clock,
          text: 'LOE Sent',
          className: 'bg-blue-100 text-blue-700',
          iconClass: 'text-blue-500'
        };
      case 'viewed':
        return {
          icon: Eye,
          text: 'LOE Viewed',
          className: 'bg-yellow-100 text-yellow-700',
          iconClass: 'text-yellow-500'
        };
      case 'signed':
        return {
          icon: CheckCircle,
          text: 'LOE Signed',
          className: 'bg-green-100 text-green-700',
          iconClass: 'text-green-500'
        };
      case 'expired':
        return {
          icon: AlertCircle,
          text: 'LOE Expired',
          className: 'bg-red-100 text-red-700',
          iconClass: 'text-red-500'
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();
  if (!statusDisplay) return null;

  const Icon = statusDisplay.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
      <Icon className={`h-3 w-3 ${statusDisplay.iconClass}`} />
      <span>{statusDisplay.text}</span>
    </div>
  );
};

export default LOEStatusBadge;