// Step 5: Investment Profile & CAS Upload
import { useState } from 'react';
import { BarChart3, Upload, FileText, Eye, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { INVESTMENT_EXPERIENCE_OPTIONS, RISK_TOLERANCE_OPTIONS, INVESTMENT_GOALS_OPTIONS } from '../constants/formConstants';
import { getValidationRules } from '../utils/formValidation';
import { calculateInvestmentCapacity, formatCurrency, calculateFinancialHealthScore } from '../utils/formCalculations';
import { handleCASFileUpload, parseCASFile, validateCASFile, formatCASData } from '../utils/casUploadLogic';

const Step5InvestmentProfile = ({ register, errors, watch, setValue, getValues, token }) => {
  const validationRules = getValidationRules();
  
  // CAS Upload State
  const [casFile, setCasFile] = useState(null);
  const [casPassword, setCasPassword] = useState('');
  const [casUploadStatus, setCasUploadStatus] = useState('not_uploaded');
  const [casData, setCasData] = useState(null);
  const [casParsingProgress, setCasParsingProgress] = useState(0);
  const [casTrackingId, setCasTrackingId] = useState(null);
  const [showCasDetails, setShowCasDetails] = useState(false);
  
  // UI State
  const [showInvestmentAnalysis, setShowInvestmentAnalysis] = useState(false);
  
  // Watch form values for real-time calculations
  const watchedValues = watch();
  const investmentCapacity = calculateInvestmentCapacity(watchedValues);
  const financialHealthScore = calculateFinancialHealthScore(watchedValues);
  
  // Handle CAS file selection
  const handleCASFileSelection = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const validation = validateCASFile(file);
    if (!validation.isValid) {
      alert(`File validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    setCasFile(file);
    setCasUploadStatus('selected');
    setCasParsingProgress(0);
  };
  
  // Handle CAS upload and parsing
  const handleCASUpload = async () => {
    if (!casFile) return;
    
    try {
      // Upload file
      await handleCASFileUpload(
        token, 
        casFile, 
        casPassword, 
        setCasUploadStatus, 
        setCasTrackingId, 
        setCasParsingProgress
      );
      
      // Parse file
      const parsedData = await parseCASFile(
        token,
        setCasUploadStatus,
        setCasData,
        setCasParsingProgress
      );
      
      if (parsedData) {
        // Auto-populate investment fields from CAS data
        const portfolioSummary = formatCASData(parsedData);
        if (portfolioSummary) {
          setValue('assets.investments.equity.mutualFunds', portfolioSummary.totalValue || 0);
        }
      }
    } catch (error) {
      console.error('CAS upload/parsing failed:', error);
    }
  };
  
  // Remove CAS file
  const removeCASFile = () => {
    setCasFile(null);
    setCasPassword('');
    setCasUploadStatus('not_uploaded');
    setCasData(null);
    setCasParsingProgress(0);
    setCasTrackingId(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
        <div className="flex items-center space-x-3 mb-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Investment Profile & CAS Upload</h2>
        </div>
        <p className="text-gray-600">
          Share your investment experience and risk tolerance. Optionally upload your CAS (Consolidated Account Statement) 
          for automatic portfolio analysis.
        </p>
      </div>

      {/* Investment Experience */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
          Investment Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Investment Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Experience *
            </label>
            <select
              {...register('investmentExperience', validationRules.investmentExperience)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                errors.investmentExperience ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select your experience level</option>
              {INVESTMENT_EXPERIENCE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.investmentExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.investmentExperience.message}</p>
            )}
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Tolerance *
            </label>
            <select
              {...register('riskTolerance', validationRules.riskTolerance)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                errors.riskTolerance ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select risk tolerance</option>
              {RISK_TOLERANCE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.riskTolerance && (
              <p className="mt-1 text-sm text-red-600">{errors.riskTolerance.message}</p>
            )}
          </div>

          {/* Monthly Investment Target */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Investment Target
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">₹</span>
              <input
                type="number"
                {...register('monthlySavingsTarget')}
                className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder={investmentCapacity.moderate.toString()}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Suggested range: {formatCurrency(investmentCapacity.conservative)} - {formatCurrency(investmentCapacity.aggressive)}
            </p>
          </div>
        </div>

        {/* Investment Goals */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Goals (Select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {INVESTMENT_GOALS_OPTIONS.map(goal => (
              <label key={goal} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('investmentGoals')}
                  value={goal}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Capacity Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            Investment Capacity Analysis
          </h3>
          <button
            type="button"
            onClick={() => setShowInvestmentAnalysis(!showInvestmentAnalysis)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            {showInvestmentAnalysis ? 'Hide' : 'Show'} Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(investmentCapacity.conservative)}
            </div>
            <div className="text-sm text-gray-600">Conservative</div>
            <div className="text-xs text-gray-500">20% of savings</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border-2 border-green-500">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(investmentCapacity.moderate)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Recommended</div>
            <div className="text-xs text-gray-500">50% of savings</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(investmentCapacity.aggressive)}
            </div>
            <div className="text-sm text-gray-600">Aggressive</div>
            <div className="text-xs text-gray-500">80% of savings</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {financialHealthScore}
            </div>
            <div className="text-sm text-gray-600">Health Score</div>
            <div className="text-xs text-gray-500">Out of 100</div>
          </div>
        </div>

        {showInvestmentAnalysis && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Investment Recommendations:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Based on your {watchedValues.riskTolerance?.toLowerCase() || 'selected'} risk profile</li>
              <li>• {watchedValues.investmentExperience?.includes('Beginner') ? 'Start with systematic investment plans (SIPs)' : 'Consider diversified portfolio across asset classes'}</li>
              <li>• Emergency fund: Keep 6-12 months expenses in liquid funds</li>
              <li>• {financialHealthScore >= 70 ? '✅ Good financial foundation for investments' : '⚠️ Focus on building emergency fund first'}</li>
            </ul>
          </div>
        )}
      </div>

      {/* CAS Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 text-gray-600 mr-2" />
          CAS File Upload (Optional)
        </h3>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">What is CAS?</h4>
              <p className="text-sm text-blue-700 mt-1">
                Consolidated Account Statement (CAS) is a monthly statement from your demat account 
                that shows all your mutual fund and stock investments. Upload it for automatic portfolio analysis.
              </p>
            </div>
          </div>
        </div>

        {casUploadStatus === 'not_uploaded' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <label htmlFor="cas-file" className="cursor-pointer">
                <div className="text-lg font-medium text-gray-900">Upload CAS File</div>
                <div className="text-sm text-gray-600">Click to browse or drag and drop your PDF file here</div>
                <input
                  id="cas-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleCASFileSelection}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">Maximum file size: 10MB • Only PDF files are supported</p>
            </div>
          </div>
        )}

        {casFile && casUploadStatus === 'selected' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">{casFile.name}</div>
                  <div className="text-sm text-gray-600">
                    {(casFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={removeCASFile}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CAS Password (if protected)
              </label>
              <input
                type="password"
                value={casPassword}
                onChange={(e) => setCasPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter password if your CAS is password protected"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handleCASUpload}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Upload and Parse CAS File
            </button>
          </div>
        )}

        {(casUploadStatus === 'uploading' || casUploadStatus === 'parsing') && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
              <div>
                <div className="font-medium text-gray-900">
                  {casUploadStatus === 'uploading' ? 'Uploading CAS file...' : 'Parsing CAS data...'}
                </div>
                <div className="text-sm text-gray-600">
                  This may take a few moments
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${casParsingProgress}%` }}
              />
            </div>
          </div>
        )}

        {casUploadStatus === 'parsed' && casData && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <div className="font-medium text-green-900">CAS file processed successfully!</div>
                <div className="text-sm text-green-700">
                  Portfolio data has been extracted and analyzed
                </div>
              </div>
            </div>

            {/* CAS Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900">Portfolio Summary</h4>
                <button
                  onClick={() => setShowCasDetails(!showCasDetails)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showCasDetails ? 'Hide' : 'Show'} Details
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(casData.summary?.total_value || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Portfolio</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {casData.demat_accounts?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Demat Accounts</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">
                    {casData.mutual_funds?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">MF Folios</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">
                    {casData.summary?.asset_allocation?.equity_percentage || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Equity Allocation</div>
                </div>
              </div>

              {showCasDetails && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Investor: {casData.investor?.name || 'N/A'}</div>
                    <div>PAN: {casData.investor?.pan || 'N/A'}</div>
                    <div>Last Updated: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {casUploadStatus === 'error' && (
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <div className="font-medium text-red-900">Upload failed</div>
              <div className="text-sm text-red-700">
                Please check your file and try again. Make sure it's a valid CAS PDF.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-3">
          <BarChart3 className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Investment Profile Tips</h4>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>Risk Tolerance:</strong> Conservative = Lower returns but safer, Aggressive = Higher potential returns but more volatile.
              <strong>CAS Upload:</strong> Optional but helps us understand your current portfolio for better recommendations.
              <strong>Monthly Target:</strong> Start small and increase gradually as your comfort level grows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5InvestmentProfile;