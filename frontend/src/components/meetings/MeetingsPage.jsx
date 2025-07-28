import React, { useState } from 'react';
import { Video, UserPlus, List } from 'lucide-react';
import ClientOnboardingWithMeeting from './ClientOnboardingWithMeeting';
import MeetingsList from './MeetingsList';

const MeetingsPage = () => {
  const [activeTab, setActiveTab] = useState('onboard'); // 'onboard' or 'list'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOnboardingSuccess = (data) => {
    console.log('Onboarding with meeting created:', data);
    // Trigger refresh of the meetings list
    setRefreshTrigger(prev => prev + 1);
    // Stay on onboarding tab to show success message
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Client Onboarding</h1>
          </div>
          <p className="text-gray-600">
            Onboard new clients with comprehensive financial profiling and scheduled consultation meetings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('onboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'onboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Onboard New Client
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
                  Onboarding History
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'onboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Client Onboarding Form - Takes 2/3 width on large screens */}
              <div className="lg:col-span-2">
                <ClientOnboardingWithMeeting onSuccess={handleOnboardingSuccess} />
              </div>
              
              {/* Process Info/Benefits - Takes 1/3 width on large screens */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">🎯 Onboarding Process</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Client receives single email</li>
                    <li>• 5-stage financial profile</li>
                    <li>• Scheduled consultation meeting</li>
                    <li>• Real-time transcription</li>
                    <li>• Secure data handling</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">✨ Benefits</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Streamlined client acquisition</li>
                    <li>• Complete financial assessment</li>
                    <li>• Prepared consultation meetings</li>
                    <li>• Better client engagement</li>
                    <li>• Professional first impression</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 mb-2">📋 What Clients Complete</h3>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Personal & KYC information</li>
                    <li>• Income & expense analysis</li>
                    <li>• Financial goals planning</li>
                    <li>• Assets & liabilities</li>
                    <li>• Investment risk profile</li>
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