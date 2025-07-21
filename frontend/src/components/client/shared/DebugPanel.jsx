// Debug panel for development and troubleshooting
import { useState } from 'react';
import { Eye, EyeOff, Bug, Clock, CheckCircle } from 'lucide-react';

const DebugPanel = ({ 
  formData, 
  errors, 
  currentStep, 
  casData, 
  casUploadStatus, 
  formStartTime,
  token,
  invitation 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  const getFieldStatus = (fieldName) => {
    const value = getNestedValue(formData, fieldName);
    return value ? '✅' : '❌';
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const criticalFields = [
    { name: 'firstName', label: 'First Name', path: 'firstName' },
    { name: 'lastName', label: 'Last Name', path: 'lastName' },
    { name: 'email', label: 'Email', path: 'email' },
    { name: 'incomeType', label: 'Income Type', path: 'incomeType' },
    { name: 'investmentExperience', label: 'Investment Experience', path: 'investmentExperience' },
    { name: 'riskTolerance', label: 'Risk Tolerance', path: 'riskTolerance' }
  ];

  const calculateFormCompleteness = () => {
    const totalFields = criticalFields.length;
    const completedFields = criticalFields.filter(field => 
      getNestedValue(formData, field.path)
    ).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Show Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 text-white rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-green-400" />
          <h3 className="font-bold text-white">Debug Panel</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <EyeOff className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'form', label: 'Form', icon: CheckCircle },
          { id: 'cas', label: 'CAS', icon: Eye },
          { id: 'debug', label: 'Debug', icon: Bug }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4 inline mr-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'form' && (
          <div className="space-y-3">
            <div>
              <div className="text-yellow-400 font-bold mb-2">Form Status</div>
              <div className="text-sm space-y-1">
                <div>Current Step: {currentStep}/5</div>
                <div>Completeness: {calculateFormCompleteness()}%</div>
                <div>Errors: {Object.keys(errors).length}</div>
                <div>Form Time: {formStartTime ? 
                  Math.round((new Date() - formStartTime) / 1000 / 60) : 0} minutes</div>
              </div>
            </div>

            <div>
              <div className="text-yellow-400 font-bold mb-2">Critical Fields</div>
              <div className="text-xs space-y-1">
                {criticalFields.map(field => (
                  <div key={field.name} className="flex justify-between">
                    <span>{field.label}:</span>
                    <span>{getFieldStatus(field.path)} {getFieldStatus(field.path) === '✅' ? 
                      `"${getNestedValue(formData, field.path)}"` : 'Empty'}</span>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(errors).length > 0 && (
              <div>
                <div className="text-red-400 font-bold mb-2">Validation Errors</div>
                <div className="text-xs space-y-1">
                  {Object.keys(errors).map(key => (
                    <div key={key} className="text-red-300">
                      {key}: {errors[key]?.message || 'Error'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cas' && (
          <div className="space-y-3">
            <div>
              <div className="text-yellow-400 font-bold mb-2">CAS Status</div>
              <div className="text-sm space-y-1">
                <div>Status: {casUploadStatus}</div>
                <div>Has CAS Data: {casData ? 'Yes' : 'No'}</div>
                {casData && (
                  <>
                    <div>Total Value: ₹{(casData.summary?.total_value || 0).toLocaleString('en-IN')}</div>
                    <div>Demat Accounts: {casData.demat_accounts?.length || 0}</div>
                    <div>MF Folios: {casData.mutual_funds?.length || 0}</div>
                  </>
                )}
              </div>
            </div>

            {casData && (
              <div>
                <div className="text-yellow-400 font-bold mb-2">Portfolio Summary</div>
                <div className="text-xs space-y-1">
                  <div>Investor: {casData.investor?.name || 'N/A'}</div>
                  <div>PAN: {casData.investor?.pan || 'N/A'}</div>
                  <div>Equity %: {casData.summary?.asset_allocation?.equity_percentage || 0}%</div>
                  <div>Debt %: {casData.summary?.asset_allocation?.debt_percentage || 0}%</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-3">
            <div>
              <div className="text-yellow-400 font-bold mb-2">Technical Info</div>
              <div className="text-xs space-y-1">
                <div>Token: {token ? token.substring(0, 10) + '...' : 'None'}</div>
                <div>Invitation: {invitation ? 'Loaded' : 'Not loaded'}</div>
                <div>User Agent: {navigator.userAgent.substring(0, 30)}...</div>
                <div>Screen: {window.screen.width}x{window.screen.height}</div>
                <div>Timestamp: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>

            <div>
              <div className="text-yellow-400 font-bold mb-2">Quick Actions</div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const safeFormData = {};
                    Object.keys(formData).forEach(key => {
                      const value = formData[key];
                      if (typeof value === 'object' && value !== null) {
                        safeFormData[key] = JSON.stringify(value);
                      } else {
                        safeFormData[key] = value;
                      }
                    });
                    console.log('Form Data:', safeFormData);
                  }}
                  className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Log Form Data
                </button>
                <button
                  onClick={() => console.log('CAS Data:', casData)}
                  className="w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Log CAS Data
                </button>
                <button
                  onClick={() => console.log('Errors:', errors)}
                  className="w-full px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                >
                  Log Errors
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;