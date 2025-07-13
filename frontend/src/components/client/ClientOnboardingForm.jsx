// frontend/src/components/client/ClientOnboardingForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientAPI } from '../../services/api';
import { FrontendCASParser } from '../../utils/casParser';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Target, 
  FileText,
  Building,
  MapPin,
  CheckCircle,
  Loader2,
  Upload,
  AlertCircle,
  Eye,
  Clock,
  BarChart3,
  TrendingUp,
  Briefcase,
  Download
} from 'lucide-react';

function ClientOnboardingForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // CAS Upload State with enhanced frontend processing
  const [casFile, setCasFile] = useState(null);
  const [casPassword, setCasPassword] = useState('');
  const [casUploadStatus, setCasUploadStatus] = useState('not_uploaded');
  const [casData, setCasData] = useState(null);
  const [casParsingProgress, setCasParsingProgress] = useState(0);
  const [casTrackingId, setCasTrackingId] = useState(null);
  const [showCasDetails, setShowCasDetails] = useState(false);

  // Form tracking
  const [formStartTime, setFormStartTime] = useState(null);
  const [sectionTimes, setSectionTimes] = useState({});
  const [currentSection, setCurrentSection] = useState('personal');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm();

  // Initialize form tracking
  useEffect(() => {
    setFormStartTime(new Date());
    console.log('🎯 CLIENT ONBOARDING: Form initialization started', {
      token,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    });
  }, [token]);

  // Track section changes
  useEffect(() => {
    if (formStartTime) {
      const sectionStartTime = new Date();
      setSectionTimes(prev => ({
        ...prev,
        [currentSection]: sectionStartTime
      }));
      
      console.log('📝 SECTION CHANGE:', {
        section: currentSection,
        timestamp: sectionStartTime.toISOString(),
        token
      });
    }
  }, [currentSection, formStartTime]);

  // Load invitation data
  useEffect(() => {
    const loadInvitation = async () => {
      try {
        console.log('🔍 INVITATION LOADING: Starting', { token });
        
        const response = await clientAPI.getOnboardingForm(token);
        setInvitation(response.data);
        
        console.log('✅ INVITATION LOADED:', {
          token,
          advisorName: `${response.data.advisor.firstName} ${response.data.advisor.lastName}`,
          clientEmail: response.data.invitation.clientEmail,
          expiresAt: response.data.invitation.expiresAt,
          timeRemaining: response.data.invitation.timeRemaining
        });
        
        // Pre-fill email from invitation
        if (response.data.invitation?.clientEmail) {
          setValue('email', response.data.invitation.clientEmail);
        }
      } catch (error) {
        console.error('❌ INVITATION LOADING FAILED:', {
          token,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        toast.error(error.message || 'Invalid or expired invitation link');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvitation();
    }
  }, [token, navigate, setValue]);

  // Enhanced CAS File Upload Handlers with FRONTEND processing
  const handleCasFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 CAS FILE SELECTED:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        token
      });

      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file only');
        console.log('❌ CAS FILE INVALID TYPE:', { fileName: file.name, type: file.type, token });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        console.log('❌ CAS FILE TOO LARGE:', { fileName: file.name, size: file.size, token });
        return;
      }
      setCasFile(file);
      setCasUploadStatus('file_selected');
    }
  };

  // FRONTEND CAS PROCESSING - Main function
  const handleCasProcessing = async () => {
    if (!casFile) {
      toast.error('Please select a CAS file to process');
      return;
    }

    const processingStartTime = new Date();
    const processingTrackingId = `FRONTEND_CAS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCasTrackingId(processingTrackingId);
    setCasUploadStatus('processing');
    setCasParsingProgress(0);
    
    console.log('🚀 FRONTEND CAS PROCESSING STARTED:', {
      trackingId: processingTrackingId,
      fileName: casFile.name,
      fileSize: casFile.size,
      hasPassword: !!casPassword,
      passwordLength: casPassword ? casPassword.length : 0,
      token,
      startTime: processingStartTime.toISOString()
    });

    try {
      // Create frontend parser instance
      const casParser = new FrontendCASParser();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCasParsingProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      // Parse PDF in frontend
      const parsedData = await casParser.parsePDFFile(casFile, casPassword);
      
      clearInterval(progressInterval);
      setCasParsingProgress(100);

      const processingDuration = new Date() - processingStartTime;
      setCasUploadStatus('processed');
      setCasData(parsedData);
      
      console.log('✅ FRONTEND CAS PROCESSING SUCCESS:', {
        trackingId: processingTrackingId,
        fileName: casFile.name,
        fileSize: casFile.size,
        processingDuration: `${processingDuration}ms`,
        totalValue: parsedData.summary?.total_value || 0,
        dematAccounts: parsedData.demat_accounts?.length || 0,
        mutualFunds: parsedData.mutual_funds?.length || 0,
        token
      });
      
      toast.success('CAS file processed successfully!');
      
      // Auto-fill PAN if available and not already filled
      if (parsedData.investor?.pan && !watch('panNumber')) {
        setValue('panNumber', parsedData.investor.pan);
        console.log('🔄 PAN AUTO-FILLED:', {
          trackingId: processingTrackingId,
          panNumber: '***MASKED***',
          token
        });
      }

      // Show extracted details
      setShowCasDetails(true);

    } catch (error) {
      setCasUploadStatus('error');
      console.error('❌ FRONTEND CAS PROCESSING ERROR:', {
        trackingId: processingTrackingId,
        error: error.message,
        stack: error.stack,
        token
      });
      
      // Better error messages for users
      let userMessage = 'Failed to process CAS file';
      if (error.message.includes('password')) {
        userMessage = 'Incorrect CAS password. Please check and try again.';
      } else if (error.message.includes('text')) {
        userMessage = 'Unable to read PDF content. File may be corrupted.';
      } else if (error.message.includes('Unknown CAS format')) {
        userMessage = 'Unsupported CAS format. Currently supported: CDSL';
      }
      
      toast.error(userMessage);
    }
  };

  const onSubmit = async (data) => {
    const submissionStartTime = new Date();
    const submissionTrackingId = `FORM_SUBMIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setSubmitting(true);
    
    // Calculate form completion time
    const formCompletionTime = formStartTime ? submissionStartTime - formStartTime : 0;
    
    console.log('📤 FORM SUBMISSION STARTED:', {
      trackingId: submissionTrackingId,
      token,
      formData: {
        ...data,
        panNumber: data.panNumber ? '***MASKED***' : null,
      },
      formMetrics: {
        totalTime: `${formCompletionTime}ms`,
        formStartTime: formStartTime?.toISOString(),
        submissionStartTime: submissionStartTime.toISOString(),
        sectionTimes: Object.keys(sectionTimes).map(section => ({
          section,
          startTime: sectionTimes[section]?.toISOString()
        }))
      },
      casData: {
        hasFile: !!casFile,
        fileName: casFile?.name,
        fileSize: casFile?.size,
        status: casUploadStatus,
        processingTrackingId: casTrackingId,
        hasParsedData: !!(casData?.summary)
      }
    });
    
    try {
      // Include PARSED CAS data in the form submission
      const submitData = {
        ...data,
        casData: casData ? {
          fileName: casFile?.name,
          fileSize: casFile?.size,
          status: casUploadStatus,
          parsedData: casData,
          processingTrackingId: casTrackingId,
          frontendProcessed: true // Flag to indicate frontend processing
        } : null
      };

      // Submit the onboarding form with CAS data
      const response = await clientAPI.submitOnboardingForm(token, submitData);
      
      const submissionDuration = new Date() - submissionStartTime;
      
      console.log('✅ FORM SUBMISSION SUCCESS:', {
        trackingId: submissionTrackingId,
        token,
        clientId: response.data?.clientId,
        submissionDuration: `${submissionDuration}ms`,
        totalFormTime: `${formCompletionTime}ms`,
        response: response.data,
        includedCASData: !!casData
      });
      
      console.log('🎉 CLIENT ONBOARDING COMPLETED:', {
        trackingId: submissionTrackingId,
        token,
        clientId: response.data?.clientId,
        completedAt: new Date().toISOString(),
        hasCASData: casUploadStatus === 'processed',
        totalJourneyTime: `${formCompletionTime}ms`,
        casTrackingId: casTrackingId
      });
      
      toast.success('Your information has been submitted successfully!');
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      const submissionDuration = new Date() - submissionStartTime;
      
      console.error('❌ FORM SUBMISSION FAILED:', {
        trackingId: submissionTrackingId,
        token,
        error: error.message,
        submissionDuration: `${submissionDuration}ms`,
        stack: error.stack
      });
      
      toast.error(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderCasDetails = () => {
    if (!casData || !showCasDetails) return null;

    const { summary, investor, demat_accounts, mutual_funds } = casData;

    return (
      <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            CAS Data Extracted Successfully!
          </h4>
          <button
            type="button"
            onClick={() => setShowCasDetails(!showCasDetails)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(summary?.total_value || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Demat Accounts</p>
                <p className="text-xl font-bold text-blue-700">
                  {demat_accounts?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Mutual Fund Folios</p>
                <p className="text-xl font-bold text-purple-700">
                  {mutual_funds?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Investor Information */}
        {investor && (investor.name || investor.pan) && (
          <div className="mb-6">
            <h5 className="text-md font-semibold text-gray-900 mb-3">Investor Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg">
              {investor.name && (
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{investor.name}</p>
                </div>
              )}
              {investor.pan && (
                <div>
                  <p className="text-sm text-gray-600">PAN</p>
                  <p className="font-medium">{investor.pan}</p>
                </div>
              )}
              {investor.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{investor.email}</p>
                </div>
              )}
              {investor.mobile && (
                <div>
                  <p className="text-sm text-gray-600">Mobile</p>
                  <p className="font-medium">{investor.mobile}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Demat Accounts Summary */}
        {demat_accounts && demat_accounts.length > 0 && (
          <div className="mb-6">
            <h5 className="text-md font-semibold text-gray-900 mb-3">Demat Accounts</h5>
            <div className="space-y-3">
              {demat_accounts.slice(0, 2).map((account, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">DP Name</p>
                      <p className="font-medium">{account.dp_name || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">DP ID / Client ID</p>
                      <p className="font-medium">{account.dp_id} / {account.client_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Value</p>
                      <p className="font-medium text-green-600">{formatCurrency(account.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {demat_accounts.length > 2 && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    ... and {demat_accounts.length - 2} more demat accounts
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mutual Funds Summary */}
        {mutual_funds && mutual_funds.length > 0 && (
          <div className="mb-6">
            <h5 className="text-md font-semibold text-gray-900 mb-3">Mutual Fund Holdings</h5>
            <div className="space-y-3">
              {mutual_funds.slice(0, 2).map((fund, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">AMC</p>
                      <p className="font-medium">{fund.amc}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Folio Number</p>
                      <p className="font-medium">{fund.folio_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="font-medium text-green-600">{formatCurrency(fund.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {mutual_funds.length > 2 && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    ... and {mutual_funds.length - 2} more mutual fund folios
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>✅ Your portfolio data has been extracted and will be sent to your advisor along with your onboarding form.</strong>
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired. Please contact your advisor for a new invitation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Onboarding</h1>
              <p className="text-gray-600">
                You've been invited by <strong>{invitation.advisor?.firstName} {invitation.advisor?.lastName}</strong> to join RICHIEAT
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${submitting ? 100 : casUploadStatus === 'processed' ? 80 : 60}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Please provide your details to complete the onboarding process
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  First Name *
                </label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                  onFocus={() => setCurrentSection('personal')}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Last Name *
                </label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                  onFocus={() => setCurrentSection('personal')}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email address"
                  onFocus={() => setCurrentSection('personal')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('phoneNumber', { required: 'Phone number is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                  onFocus={() => setCurrentSection('personal')}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onFocus={() => setCurrentSection('personal')}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onFocus={() => setCurrentSection('personal')}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    {...register('address.street', { required: 'Address is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your street address"
                    onFocus={() => setCurrentSection('address')}
                  />
                  {errors.address?.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    {...register('address.city', { required: 'City is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your city"
                    onFocus={() => setCurrentSection('address')}
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    {...register('address.state', { required: 'State is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your state"
                    onFocus={() => setCurrentSection('address')}
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                  <input
                    type="text"
                    {...register('address.zipCode', { required: 'ZIP code is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your ZIP code"
                    onFocus={() => setCurrentSection('address')}
                  />
                  {errors.address?.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    {...register('address.country', { required: 'Country is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your country"
                    defaultValue="India"
                    onFocus={() => setCurrentSection('address')}
                  />
                  {errors.address?.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.country.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income *</label>
                  <input
                    type="number"
                    {...register('annualIncome', { 
                      required: 'Annual income is required',
                      min: { value: 0, message: 'Income must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter annual income in INR"
                    onFocus={() => setCurrentSection('financial')}
                  />
                  {errors.annualIncome && (
                    <p className="mt-1 text-sm text-red-600">{errors.annualIncome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Risk Tolerance *
                  </label>
                  <select
                    {...register('riskTolerance', { required: 'Risk tolerance is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={() => setCurrentSection('financial')}
                  >
                    <option value="">Select risk tolerance</option>
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Very Aggressive">Very Aggressive</option>
                  </select>
                  {errors.riskTolerance && (
                    <p className="mt-1 text-sm text-red-600">{errors.riskTolerance.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Experience *</label>
                  <select
                    {...register('investmentExperience', { required: 'Investment experience is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={() => setCurrentSection('financial')}
                  >
                    <option value="">Select experience level</option>
                    <option value="Beginner">Beginner (0-2 years)</option>
                    <option value="Intermediate">Intermediate (2-5 years)</option>
                    <option value="Advanced">Advanced (5+ years)</option>
                  </select>
                  {errors.investmentExperience && (
                    <p className="mt-1 text-sm text-red-600">{errors.investmentExperience.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Savings Target</label>
                  <input
                    type="number"
                    {...register('monthlySavingsTarget', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter monthly savings target in INR"
                    onFocus={() => setCurrentSection('financial')}
                  />
                  {errors.monthlySavingsTarget && (
                    <p className="mt-1 text-sm text-red-600">{errors.monthlySavingsTarget.message}</p>
                  )}
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
                  <input
                    type="text"
                    {...register('panNumber', { 
                      required: 'PAN number is required',
                      pattern: {
                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: 'Please enter a valid PAN number (e.g., ABCDE1234F)'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABCDE1234F"
                    style={{ textTransform: 'uppercase' }}
                    onFocus={() => setCurrentSection('financial')}
                  />
                  {errors.panNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.panNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Goals</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    'Retirement',
                    'Wealth Building',
                    'Education',
                    'Tax Saving',
                    'Emergency Fund',
                    'Home Purchase',
                    'Other'
                  ].map((goal) => (
                    <label key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        value={goal}
                        {...register('investmentGoals')}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        onFocus={() => setCurrentSection('financial')}
                      />
                      <span className="text-sm text-gray-700">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced FRONTEND CAS Processing Section */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Upload CAS Statement (Optional)
              </h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">What is CAS?</h4>
                <p className="text-blue-700 text-sm">
                  Consolidated Account Statement (CAS) contains details of all your investments across 
                  mutual funds, stocks, and other securities. Upload your CAS to automatically import your portfolio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select CAS File (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCasFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={() => setCurrentSection('cas')}
                  />
                  {casFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {casFile.name} ({(casFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAS Password (if password protected)
                  </label>
                  <input
                    type="password"
                    value={casPassword}
                    onChange={(e) => setCasPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter CAS password (optional)"
                    onFocus={() => setCurrentSection('cas')}
                  />
                </div>
              </div>

              {/* Processing Progress */}
              {casUploadStatus === 'processing' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                    <span className="text-yellow-800 font-medium">Processing CAS file in your browser...</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${casParsingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">{Math.round(casParsingProgress)}% complete</p>
                </div>
              )}

              {/* Process Button */}
              <div>
                <button
                  type="button"
                  onClick={handleCasProcessing}
                  disabled={!casFile || casUploadStatus === 'processing'}
                  className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                >
                  {casUploadStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Processing... ({Math.round(casParsingProgress)}%)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      <span>Process CAS in Browser</span>
                    </>
                  )}
                </button>
              </div>

              {/* CAS Processing Status */}
              {casUploadStatus === 'processed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">CAS processed successfully in your browser!</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>File:</strong> {casFile?.name}</p>
                    <p><strong>Size:</strong> {casFile ? (casFile.size / 1024 / 1024).toFixed(2) : 0} MB</p>
                    <p className="text-xs mt-2">Your portfolio data has been extracted and will be sent with your form.</p>
                  </div>
                </div>
              )}

              {casUploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">
                      Failed to process CAS file. Please check the file and password, then try again.
                    </span>
                  </div>
                </div>
              )}

              {/* Display Extracted CAS Details */}
              {renderCasDetails()}

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> CAS upload is optional. You can complete onboarding without it and upload later.
                  All processing happens in your browser for security.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Onboarding
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Debug Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <h3 className="text-white font-bold mb-2">🔍 Debug Information</h3>
            <div className="space-y-1">
              <div>Token: {token}</div>
              <div>Current Section: {currentSection}</div>
              <div>Form Start Time: {formStartTime?.toISOString()}</div>
              <div>CAS Status: {casUploadStatus}</div>
              <div>CAS Tracking ID: {casTrackingId || 'Not assigned'}</div>
              <div>Has CAS File: {casFile ? 'Yes' : 'No'}</div>
              {casFile && <div>CAS File: {casFile.name} ({(casFile.size / 1024).toFixed(1)} KB)</div>}
              {casData && <div>CAS Total Value: ₹{(casData.summary?.total_value || 0).toLocaleString('en-IN')}</div>}
              <div>Frontend Processing: {casData ? 'Success' : 'Not processed'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientOnboardingForm;