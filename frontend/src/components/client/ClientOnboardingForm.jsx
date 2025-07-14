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
  Download,
  ArrowLeft,
  ArrowRight,
  Save,
  Home,
  Banknote,
  PiggyBank,
  Calculator,
  Plus,
  Trash2
} from 'lucide-react';

// Indian States for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 
  'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 
  'Puducherry', 'Andaman and Nicobar Islands'
];

// Occupation options
const OCCUPATION_OPTIONS = [
  'Government Employee', 'Private Employee', 'Teacher/Professor', 'Doctor', 'Engineer',
  'Lawyer', 'Chartered Accountant', 'Banking Professional', 'Insurance Professional',
  'IT Professional', 'Consultant', 'Sales Professional', 'Marketing Professional',
  'Finance Professional', 'HR Professional', 'Business Owner', 'Entrepreneur',
  'Freelancer', 'Retired', 'Student', 'Homemaker', 'Self Employed'
];

function ClientOnboardingForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [savingDraft, setSavingDraft] = useState(false);

  // CAS Upload State - PRESERVED FROM ORIGINAL
  const [casFile, setCasFile] = useState(null);
  const [casPassword, setCasPassword] = useState('');
  const [casUploadStatus, setCasUploadStatus] = useState('not_uploaded');
  const [casData, setCasData] = useState(null);
  const [casParsingProgress, setCasParsingProgress] = useState(0);
  const [casTrackingId, setCasTrackingId] = useState(null);
  const [showCasDetails, setShowCasDetails] = useState(false);

  // Dynamic Goals State
  const [customGoals, setCustomGoals] = useState([]);

  // Form tracking
  const [formStartTime, setFormStartTime] = useState(null);
  const [stepTimes, setStepTimes] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
    reset
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      // Step 1 defaults
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      panNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      // Step 2 defaults
      occupation: '',
      employerBusinessName: '',
      annualIncome: '',
      additionalIncome: '',
      monthlyExpenses: {
        housingRent: '',
        groceriesUtilitiesFood: '',
        transportation: '',
        education: '',
        healthcare: '',
        entertainment: '',
        insurancePremiums: '',
        loanEmis: '',
        otherExpenses: ''
      },
      expenseNotes: '',
      annualTaxes: '',
      annualVacationExpenses: '',
      // Step 3 defaults
      retirementPlanning: {
        targetRetirementAge: '',
        retirementCorpusTarget: ''
      },
      majorGoals: [
        { goalName: "Child's Education", targetAmount: '', targetYear: '', priority: 'High' },
        { goalName: "Home Purchase", targetAmount: '', targetYear: '', priority: 'Medium' }
      ],
      // Step 4 defaults
      assets: {
        cashBankSavings: '',
        realEstate: '',
        investments: {
          equity: {
            mutualFunds: '',
            directStocks: ''
          },
          fixedIncome: {
            ppf: '',
            epf: '',
            nps: '',
            fixedDeposits: '',
            bondsDebentures: '',
            nsc: ''
          },
          other: {
            ulip: '',
            otherInvestments: ''
          }
        }
      },
      liabilities: {
        loans: '',
        creditCardDebt: ''
      },
      // Step 5 - Original fields for compatibility
      investmentExperience: '',
      riskTolerance: '',
      investmentGoals: [],
      monthlySavingsTarget: ''
    }
  });

  // Initialize form tracking
  useEffect(() => {
    setFormStartTime(new Date());
    console.log('🎯 ENHANCED CLIENT ONBOARDING: Form initialization started', {
      token,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    });
  }, [token]);

  // Track step changes
  useEffect(() => {
    if (formStartTime) {
      const stepStartTime = new Date();
      setStepTimes(prev => ({
        ...prev,
        [`step${currentStep}`]: stepStartTime
      }));
      
      console.log('📝 STEP CHANGE:', {
        step: currentStep,
        timestamp: stepStartTime.toISOString(),
        token
      });
    }
  }, [currentStep, formStartTime]);

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
        
        // Load any saved draft data
        // TODO: Implement draft loading from backend
        
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

  // Watch form values for auto-calculations
  const watchedValues = watch();

  // Calculate financial summaries in real-time
  const calculateFinancialSummary = () => {
    const annualIncome = parseFloat(watchedValues.annualIncome) || 0;
    const additionalIncome = parseFloat(watchedValues.additionalIncome) || 0;
    const monthlyIncome = (annualIncome + additionalIncome) / 12;
    
    const expenses = watchedValues.monthlyExpenses || {};
    const totalMonthlyExpenses = Object.values(expenses)
      .reduce((sum, expense) => sum + (parseFloat(expense) || 0), 0);
    
    const monthlySavings = monthlyIncome - totalMonthlyExpenses;
    
    return {
      monthlyIncome: Math.round(monthlyIncome),
      totalMonthlyExpenses: Math.round(totalMonthlyExpenses),
      monthlySavings: Math.round(monthlySavings)
    };
  };

  // Calculate assets & liabilities summary
  const calculateAssetsLiabilities = () => {
    const assets = watchedValues.assets || {};
    
    const cashBank = parseFloat(assets.cashBankSavings) || 0;
    const realEstate = parseFloat(assets.realEstate) || 0;
    
    const equity = assets.investments?.equity || {};
    const mutualFunds = parseFloat(equity.mutualFunds) || 0;
    const directStocks = parseFloat(equity.directStocks) || 0;
    
    const fixedIncome = assets.investments?.fixedIncome || {};
    const ppf = parseFloat(fixedIncome.ppf) || 0;
    const epf = parseFloat(fixedIncome.epf) || 0;
    const nps = parseFloat(fixedIncome.nps) || 0;
    const fixedDeposits = parseFloat(fixedIncome.fixedDeposits) || 0;
    const bondsDebentures = parseFloat(fixedIncome.bondsDebentures) || 0;
    const nsc = parseFloat(fixedIncome.nsc) || 0;
    
    const other = assets.investments?.other || {};
    const ulip = parseFloat(other.ulip) || 0;
    const otherInvestments = parseFloat(other.otherInvestments) || 0;
    
    const totalAssets = cashBank + realEstate + mutualFunds + directStocks + 
                       ppf + epf + nps + fixedDeposits + bondsDebentures + nsc + 
                       ulip + otherInvestments;
    
    const liabilities = watchedValues.liabilities || {};
    const loans = parseFloat(liabilities.loans) || 0;
    const creditCardDebt = parseFloat(liabilities.creditCardDebt) || 0;
    const totalLiabilities = loans + creditCardDebt;
    
    const netWorth = totalAssets - totalLiabilities;
    
    return {
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(netWorth)
    };
  };

  // Save draft functionality
  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const currentData = getValues();
      
      // TODO: Implement draft saving API call
      console.log('💾 SAVING DRAFT:', {
        step: currentStep,
        data: currentData,
        timestamp: new Date().toISOString(),
        token
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('❌ DRAFT SAVE FAILED:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Step navigation
  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error('Please fill in all required fields before proceeding');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add custom goal
  const addCustomGoal = () => {
    setCustomGoals([...customGoals, {
      goalName: '',
      targetAmount: '',
      targetYear: '',
      priority: 'Medium'
    }]);
  };

  // Remove custom goal
  const removeCustomGoal = (index) => {
    setCustomGoals(customGoals.filter((_, i) => i !== index));
  };

  // Enhanced CAS File Upload Handlers - PRESERVED FROM ORIGINAL
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

  // FRONTEND CAS PROCESSING - PRESERVED FROM ORIGINAL
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

  // Final form submission
  const onSubmit = async (data) => {
    const submissionStartTime = new Date();
    const submissionTrackingId = `FORM_SUBMIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setSubmitting(true);
    
    // Calculate form completion time
    const formCompletionTime = formStartTime ? submissionStartTime - formStartTime : 0;
    
    console.log('📤 ENHANCED FORM SUBMISSION STARTED:', {
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
        stepTimes: Object.keys(stepTimes).map(step => ({
          step,
          startTime: stepTimes[step]?.toISOString()
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
      // Include all form data with CAS data
      const submitData = {
        ...data,
        customGoals,
        casData: casData ? {
          fileName: casFile?.name,
          fileSize: casFile?.size,
          status: casUploadStatus,
          parsedData: casData,
          processingTrackingId: casTrackingId,
          frontendProcessed: true
        } : null
      };

      // Submit the enhanced onboarding form
      const response = await clientAPI.submitOnboardingForm(token, submitData);
      
      const submissionDuration = new Date() - submissionStartTime;
      
      console.log('✅ ENHANCED FORM SUBMISSION SUCCESS:', {
        trackingId: submissionTrackingId,
        token,
        clientId: response.data?.clientId,
        submissionDuration: `${submissionDuration}ms`,
        totalFormTime: `${formCompletionTime}ms`,
        response: response.data,
        includedCASData: !!casData
      });
      
      console.log('🎉 ENHANCED CLIENT ONBOARDING COMPLETED:', {
        trackingId: submissionTrackingId,
        token,
        clientId: response.data?.clientId,
        completedAt: new Date().toISOString(),
        hasCASData: casUploadStatus === 'processed',
        totalJourneyTime: `${formCompletionTime}ms`,
        casTrackingId: casTrackingId
      });
      
      toast.success('Your comprehensive financial profile has been submitted successfully!');
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      const submissionDuration = new Date() - submissionStartTime;
      
      console.error('❌ ENHANCED FORM SUBMISSION FAILED:', {
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

  // Utility functions
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // CAS Details Render - PRESERVED FROM ORIGINAL
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

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>✅ Your portfolio data has been extracted and will be sent to your advisor along with your comprehensive financial profile.</strong>
          </p>
        </div>
      </div>
    );
  };

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep
                  ? 'bg-green-500 text-white'
                  : step === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          Step {currentStep} of 5
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Personal Info</span>
        <span>Income & Employment</span>
        <span>Financial Goals</span>
        <span>Assets & Liabilities</span>
        <span>CAS Upload</span>
      </div>
    </div>
  );

  // Step content render functions
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

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
            readOnly
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
            {...register('phoneNumber', { 
              required: 'Phone number is required',
              pattern: {
                value: /^[+]91-[0-9]{10}$/,
                message: 'Please enter phone number in format: +91-XXXXXXXXXX'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+91-XXXXXXXXXX"
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
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            {...register('gender', { required: 'Gender is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

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
          />
          {errors.panNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.panNumber.message}</p>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Complete Residential Address
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              {...register('address.street', { required: 'Street address is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your complete street address"
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
            />
            {errors.address?.city && (
              <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <select
              {...register('address.state', { required: 'State is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.address?.state && (
              <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code *</label>
            <input
              type="text"
              {...register('address.zipCode', { 
                required: 'PIN code is required',
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: 'Please enter a valid 6-digit PIN code'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 6-digit PIN code"
            />
            {errors.address?.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const financialSummary = calculateFinancialSummary();
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Income & Employment</h2>
          <p className="text-gray-600">Tell us about your income and monthly expenses</p>
        </div>

        {/* Employment Details */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Employment Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Occupation *</label>
              <select
                {...register('occupation', { required: 'Occupation is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your occupation</option>
                {OCCUPATION_OPTIONS.map((occupation) => (
                  <option key={occupation} value={occupation}>{occupation}</option>
                ))}
              </select>
              {errors.occupation && (
                <p className="mt-1 text-sm text-red-600">{errors.occupation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employer/Business Name *</label>
              <input
                type="text"
                {...register('employerBusinessName', { required: 'Employer/Business name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter employer or business name"
              />
              {errors.employerBusinessName && (
                <p className="mt-1 text-sm text-red-600">{errors.employerBusinessName.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Income Details */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Income Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (₹) *</label>
              <input
                type="number"
                {...register('annualIncome', { 
                  required: 'Annual income is required',
                  min: { value: 0, message: 'Income must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter annual income in INR"
              />
              {errors.annualIncome && (
                <p className="mt-1 text-sm text-red-600">{errors.annualIncome.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Income (₹)</label>
              <input
                type="number"
                {...register('additionalIncome', {
                  min: { value: 0, message: 'Income must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rental, dividend, interest, etc."
              />
              <p className="text-xs text-gray-500 mt-1">Rental, dividend, interest, etc.</p>
              {errors.additionalIncome && (
                <p className="mt-1 text-sm text-red-600">{errors.additionalIncome.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Expense Breakdown */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Detailed Monthly Expense Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Housing/Rent (per month) *</label>
              <input
                type="number"
                {...register('monthlyExpenses.housingRent', { 
                  required: 'Housing/Rent expense is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly housing/rent expense"
              />
              {errors.monthlyExpenses?.housingRent && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.housingRent.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Groceries, Utilities & Food (per month) *</label>
              <input
                type="number"
                {...register('monthlyExpenses.groceriesUtilitiesFood', { 
                  required: 'Groceries, Utilities & Food expense is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly groceries & utilities"
              />
              {errors.monthlyExpenses?.groceriesUtilitiesFood && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.groceriesUtilitiesFood.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transportation (per month) *</label>
              <input
                type="number"
                {...register('monthlyExpenses.transportation', { 
                  required: 'Transportation expense is required',
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly transportation cost"
              />
              {errors.monthlyExpenses?.transportation && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.transportation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.education', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly education expenses"
              />
              {errors.monthlyExpenses?.education && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.education.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Healthcare (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.healthcare', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly healthcare expenses"
              />
              {errors.monthlyExpenses?.healthcare && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.healthcare.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entertainment (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.entertainment', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly entertainment expenses"
              />
              {errors.monthlyExpenses?.entertainment && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.entertainment.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Premiums (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.insurancePremiums', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly insurance premiums"
              />
              {errors.monthlyExpenses?.insurancePremiums && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.insurancePremiums.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan EMIs (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.loanEmis', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Monthly loan EMIs"
              />
              {errors.monthlyExpenses?.loanEmis && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.loanEmis.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Monthly Expenses</label>
              <input
                type="number"
                {...register('monthlyExpenses.otherExpenses', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Other monthly expenses"
              />
              {errors.monthlyExpenses?.otherExpenses && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyExpenses.otherExpenses.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expense Notes (Optional)</label>
            <textarea
              {...register('expenseNotes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter details or notes about your expenses..."
            />
          </div>
        </div>

        {/* Annual & Emergency Expenses */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Annual & Emergency Expenses
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Taxes (₹)</label>
              <input
                type="number"
                {...register('annualTaxes', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Annual tax expenses"
              />
              {errors.annualTaxes && (
                <p className="mt-1 text-sm text-red-600">{errors.annualTaxes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Vacation Expenses (₹)</label>
              <input
                type="number"
                {...register('annualVacationExpenses', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Annual vacation expenses"
              />
              {errors.annualVacationExpenses && (
                <p className="mt-1 text-sm text-red-600">{errors.annualVacationExpenses.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-calculated Financial Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Auto-calculated Financial Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Income</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(financialSummary.monthlyIncome)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <Calculator className="h-6 w-6 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Expenses</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatCurrency(financialSummary.totalMonthlyExpenses)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <PiggyBank className="h-6 w-6 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Savings</p>
                  <p className={`text-lg font-bold ${financialSummary.monthlySavings >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                    {formatCurrency(financialSummary.monthlySavings)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {financialSummary.monthlySavings < 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ Your expenses exceed your income. Consider reviewing your budget or increasing your income.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Goals</h2>
        <p className="text-gray-600">Define your financial aspirations and targets</p>
      </div>

      {/* Retirement Planning */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Retirement Planning
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Retirement Age *</label>
            <input
              type="number"
              {...register('retirementPlanning.targetRetirementAge', { 
                required: 'Target retirement age is required',
                min: { value: 50, message: 'Retirement age should be at least 50' },
                max: { value: 80, message: 'Retirement age should not exceed 80' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 60"
            />
            {errors.retirementPlanning?.targetRetirementAge && (
              <p className="mt-1 text-sm text-red-600">{errors.retirementPlanning.targetRetirementAge.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retirement Corpus Target (₹) *</label>
            <input
              type="number"
              {...register('retirementPlanning.retirementCorpusTarget', { 
                required: 'Retirement corpus target is required',
                min: { value: 1000000, message: 'Minimum corpus should be ₹10 lakhs' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 50000000 (5 crores)"
            />
            {errors.retirementPlanning?.retirementCorpusTarget && (
              <p className="mt-1 text-sm text-red-600">{errors.retirementPlanning.retirementCorpusTarget.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Other Major Goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Other Major Goals
          </h3>
          <button
            type="button"
            onClick={addCustomGoal}
            className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Goal
          </button>
        </div>

        {/* Pre-defined Goals */}
        <div className="space-y-4">
          {/* Child's Education */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Child's Education</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  {...register('majorGoals.0.targetAmount', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Target amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Year</label>
                <input
                  type="number"
                  {...register('majorGoals.0.targetYear', {
                    min: { value: 2024, message: 'Year cannot be in the past' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2035"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  {...register('majorGoals.0.priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Home Purchase */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Home Purchase</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  {...register('majorGoals.1.targetAmount', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Target amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Year</label>
                <input
                  type="number"
                  {...register('majorGoals.1.targetYear', {
                    min: { value: 2024, message: 'Year cannot be in the past' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2030"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  {...register('majorGoals.1.priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Goals */}
          {customGoals.map((goal, index) => (
            <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Custom Goal {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeCustomGoal(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                  <input
                    type="text"
                    value={goal.goalName}
                    onChange={(e) => {
                      const newGoals = [...customGoals];
                      newGoals[index].goalName = e.target.value;
                      setCustomGoals(newGoals);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter goal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={goal.targetAmount}
                    onChange={(e) => {
                      const newGoals = [...customGoals];
                      newGoals[index].targetAmount = e.target.value;
                      setCustomGoals(newGoals);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Target amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Year</label>
                  <input
                    type="number"
                    value={goal.targetYear}
                    onChange={(e) => {
                      const newGoals = [...customGoals];
                      newGoals[index].targetYear = e.target.value;
                      setCustomGoals(newGoals);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={goal.priority}
                    onChange={(e) => {
                      const newGoals = [...customGoals];
                      newGoals[index].priority = e.target.value;
                      setCustomGoals(newGoals);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const assetsLiabilities = calculateAssetsLiabilities();
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assets & Liabilities</h2>
          <p className="text-gray-600">Tell us about your current financial position</p>
          <p className="text-sm text-gray-500 mt-1">All values to be entered in INR</p>
        </div>

        {/* Basic Assets */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Home className="h-4 w-4 mr-2" />
            Basic Assets
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cash & Bank Savings (₹)</label>
              <input
                type="number"
                {...register('assets.cashBankSavings', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Current cash and bank balance"
              />
              {errors.assets?.cashBankSavings && (
                <p className="mt-1 text-sm text-red-600">{errors.assets.cashBankSavings.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Real Estate (₹)</label>
              <input
                type="number"
                {...register('assets.realEstate', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Value of property owned"
              />
              {errors.assets?.realEstate && (
                <p className="mt-1 text-sm text-red-600">{errors.assets.realEstate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Existing Investments - Equity */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Existing Investments - Equity
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mutual Funds (₹)</label>
              <input
                type="number"
                {...register('assets.investments.equity.mutualFunds', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Current value of mutual funds"
              />
              {errors.assets?.investments?.equity?.mutualFunds && (
                <p className="mt-1 text-sm text-red-600">{errors.assets.investments.equity.mutualFunds.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Direct Stocks (₹)</label>
              <input
                type="number"
                {...register('assets.investments.equity.directStocks', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Current value of direct stocks"
              />
              {errors.assets?.investments?.equity?.directStocks && (
                <p className="mt-1 text-sm text-red-600">{errors.assets.investments.equity.directStocks.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Income */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Banknote className="h-4 w-4 mr-2" />
            Fixed Income Investments
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PPF (₹)</label>
              <input
                type="number"
                {...register('assets.investments.fixedIncome.ppf', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PPF balance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">EPF (₹)</label>
              <input
                type="number"
                {...register('assets.investments.fixedIncome.epf', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="EPF balance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NPS (₹)</label>
              <input
                type="number"
                {...register('assets.investments.fixedIncome.nps', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NPS balance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Deposits (₹)</label>
              <input
                type="number"
                {...register('assets.investments.fixedIncome.fixedDeposits', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="FD value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bonds & Debentures (₹)</label>
              <input
                type="number"
                {...register('assets.investments.fixedIncome.bondsDebentures', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bonds value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NSC (₹)</label>
              <input
                type="number"
                {...register('assets.investments.fixedIncome.nsc', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NSC value"
              />
            </div>
          </div>
        </div>

        {/* Other Investments */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <PiggyBank className="h-4 w-4 mr-2" />
            Other Investments
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ULIP (₹)</label>
              <input
                type="number"
                {...register('assets.investments.other.ulip', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ULIP value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Investments (₹)</label>
              <input
                type="number"
                {...register('assets.investments.other.otherInvestments', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Other investment value"
              />
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Liabilities
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loans (₹)</label>
              <input
                type="number"
                {...register('liabilities.loans', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Outstanding loan amount"
              />
              {errors.liabilities?.loans && (
                <p className="mt-1 text-sm text-red-600">{errors.liabilities.loans.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credit Card Debt (₹)</label>
              <input
                type="number"
                {...register('liabilities.creditCardDebt', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Credit card outstanding"
              />
              {errors.liabilities?.creditCardDebt && (
                <p className="mt-1 text-sm text-red-600">{errors.liabilities.creditCardDebt.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-calculated Financial Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Auto-calculated Financial Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(assetsLiabilities.totalAssets)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Liabilities</p>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(assetsLiabilities.totalLiabilities)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Net Worth</p>
                  <p className={`text-lg font-bold ${assetsLiabilities.netWorth >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(assetsLiabilities.netWorth)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {assetsLiabilities.netWorth < 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ Your liabilities exceed your assets. Consider debt reduction strategies.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Profile & CAS Upload</h2>
        <p className="text-gray-600">Complete your investment profile and upload your CAS statement</p>
      </div>

      {/* Investment Experience & Risk Tolerance */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Investment Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investment Experience *</label>
            <select
              {...register('investmentExperience', { required: 'Investment experience is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance *</label>
            <select
              {...register('riskTolerance', { required: 'Risk tolerance is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Savings Target (₹)</label>
            <input
              type="number"
              {...register('monthlySavingsTarget', {
                min: { value: 0, message: 'Amount must be positive' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter monthly savings target"
            />
            {errors.monthlySavingsTarget && (
              <p className="mt-1 text-sm text-red-600">{errors.monthlySavingsTarget.message}</p>
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
                />
                <span className="text-sm text-gray-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced FRONTEND CAS Processing Section - PRESERVED */}
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
    </div>
  );

  // Navigation buttons
  const NavigationButtons = () => (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      <div className="flex items-center space-x-4">
        {/* Previous Button */}
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>
        )}

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={saveDraft}
          disabled={savingDraft}
          className="flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          {savingDraft ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </>
          )}
        </button>
      </div>

      <div>
        {/* Next/Submit Button */}
        {currentStep < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        )}
      </div>
    </div>
  );

  // Loading state
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

  // Invalid invitation state
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

  // Main render
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
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Client Onboarding</h1>
              <p className="text-gray-600">
                You've been invited by <strong>{invitation.advisor?.firstName} {invitation.advisor?.lastName}</strong> 
                {invitation.advisor?.firmName && ` from ${invitation.advisor.firmName}`} to join Richie AI
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-6">
            <ProgressIndicator />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Step Content */}
            <div className="min-h-[600px]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
            </div>

            {/* Navigation */}
            <NavigationButtons />
          </form>
        </div>

        {/* Debug Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <h3 className="text-white font-bold mb-2">🔍 Enhanced Debug Information</h3>
            <div className="space-y-1">
              <div>Token: {token}</div>
              <div>Current Step: {currentStep}/5</div>
              <div>Form Start Time: {formStartTime?.toISOString()}</div>
              <div>CAS Status: {casUploadStatus}</div>
              <div>CAS Tracking ID: {casTrackingId || 'Not assigned'}</div>
              <div>Has CAS File: {casFile ? 'Yes' : 'No'}</div>
              {casFile && <div>CAS File: {casFile.name} ({(casFile.size / 1024).toFixed(1)} KB)</div>}
              {casData && <div>CAS Total Value: ₹{(casData.summary?.total_value || 0).toLocaleString('en-IN')}</div>}
              <div>Frontend Processing: {casData ? 'Success' : 'Not processed'}</div>
              <div>Custom Goals: {customGoals.length}</div>
              <div>Financial Summary: Income={calculateFinancialSummary().monthlyIncome}, Expenses={calculateFinancialSummary().totalMonthlyExpenses}, Savings={calculateFinancialSummary().monthlySavings}</div>
              <div>Assets Summary: Total={calculateAssetsLiabilities().totalAssets}, Liabilities={calculateAssetsLiabilities().totalLiabilities}, Net Worth={calculateAssetsLiabilities().netWorth}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientOnboardingForm;