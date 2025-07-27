import React, { useState } from 'react';
import { Video, Plus, List } from 'lucide-react';
import MeetingScheduler from './MeetingScheduler';
import MeetingsList from './MeetingsList';

const MeetingsPage = () => {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' or 'list'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMeetingCreated = (meeting) => {
    console.log('Meeting created:', meeting);
    // Trigger refresh of the meetings list
    setRefreshTrigger(prev => prev + 1);
    // Switch to list view to show the new meeting
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          </div>
          <p className="text-gray-600">
            Schedule and manage video meetings with your clients using Daily.co integration.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Meeting
                </div>
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Meeting History
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Meeting Scheduler - Takes 2/3 width on large screens */}
              <div className="lg:col-span-2">
                <MeetingScheduler onMeetingCreated={handleMeetingCreated} />
              </div>
              
              {/* Quick Info/Tips - Takes 1/3 width on large screens */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Meeting Features</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• HD video calling</li>
                    <li>• Screen sharing</li>
                    <li>• Real-time transcription</li>
                    <li>• Cloud recording</li>
                    <li>• Secure meeting links</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">💡 Tips</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Instant meetings start immediately</li>
                    <li>• Scheduled meetings can be planned in advance</li>
                    <li>• Each client gets their own secure link</li>
                    <li>• Copy links to share with clients</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <MeetingsList refreshTrigger={refreshTrigger} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingsPage;