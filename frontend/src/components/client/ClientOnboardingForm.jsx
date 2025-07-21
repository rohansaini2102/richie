// frontend/src/components/client/ClientOnboardingForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientAPI } from '../../services/api';
import { FrontendCASParser } from '../../utils/casParser';
import RequiredFieldsChecklist from './RequiredFieldsChecklist';
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
  Trash2,
  HelpCircle,
  ListChecks
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
  
  // Enhanced form state for new 7-step structure
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showManualCasEntry, setShowManualCasEntry] = useState(false);
  const [hasCAS, setHasCAS] = useState(false);
  const [selectedLoanTypes, setSelectedLoanTypes] = useState({});
  const [selectedInvestmentTypes, setSelectedInvestmentTypes] = useState({});
  const [selectedInsuranceTypes, setSelectedInsuranceTypes] = useState({});

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

  // UI State for debugging and help
  const [showRequiredFieldsChecklist, setShowRequiredFieldsChecklist] = useState(false);

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
      incomeType: '',
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
    // Get income from current form structure - convert annual to monthly
    const annualIncome = parseFloat(watchedValues.annualIncome) || 0;
    const additionalIncome = parseFloat(watchedValues.additionalIncome) || 0;
    const monthlyIncome = (annualIncome + additionalIncome) / 12;
    
    // Get expenses from current form structure
    const totalMonthlyExpenses = parseFloat(watchedValues.totalMonthlyExpenses) || 0;
    
    // Calculate breakdown expenses if available (multiple possible structures)
    let breakdownTotal = 0;
    
    // Check for individual expense fields
    const individualExpenses = [
      'housingRent', 'foodGroceries', 'transportation', 'utilities', 
      'entertainment', 'healthcare', 'otherExpenses'
    ];
    individualExpenses.forEach(field => {
      breakdownTotal += parseFloat(watchedValues[field]) || 0;
    });
    
    // Check for nested monthlyExpenses structure
    const monthlyExpenses = watchedValues.monthlyExpenses || {};
    Object.values(monthlyExpenses).forEach(expense => {
      breakdownTotal += parseFloat(expense) || 0;
    });
    
    // Use breakdown total if it's greater than the main total (more detailed)
    const finalExpenses = breakdownTotal > totalMonthlyExpenses ? breakdownTotal : totalMonthlyExpenses;
    
    const monthlySavings = monthlyIncome - finalExpenses;
    
    return {
      monthlyIncome: Math.round(monthlyIncome),
      totalMonthlyExpenses: Math.round(finalExpenses),
      monthlySavings: Math.round(monthlySavings)
    };
  };

  // Calculate assets & liabilities summary from CAS data and manual investments
  const calculateAssetsLiabilities = () => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    // Calculate assets from CAS data if available
    if (casData && casData.summary) {
      totalAssets += casData.summary.total_value || 0;
    }
    
    // Add manual investment entries if available
    const investmentFields = [
      'mutualFundValue', 'stockValue', 'ppfBalance', 'epfBalance', 
      'npsBalance', 'elssValue', 'fdValue', 'otherInvestmentValue'
    ];
    
    investmentFields.forEach(field => {
      totalAssets += parseFloat(watchedValues[field]) || 0;
    });
    
    // Calculate liabilities from debt information (Step 5 data)
    const debtFields = [
      'homeLoanAmount', 'personalLoanAmount', 'carLoanAmount', 
      'educationLoanAmount', 'goldLoanAmount', 'creditCardDebt',
      'businessLoanAmount', 'otherLoanAmount'
    ];
    
    debtFields.forEach(field => {
      totalLiabilities += parseFloat(watchedValues[field]) || 0;
    });
    
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
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Show more helpful error message
      const currentStepName = {
        1: 'Personal Information',
        2: 'Income & Employment', 
        3: 'Retirement Planning',
        4: 'Investments & CAS',
        5: 'Debts & Liabilities',
        6: 'Insurance Coverage',
        7: 'Goals & Risk Profile'
      }[currentStep];
      
      toast.error(
        `Please complete all required fields in "${currentStepName}" before proceeding.\n\nLook for red error messages under the fields.`,
        { duration: 6000 }
      );
      
      // Scroll to first error field
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-600');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add custom goal with unique ID
  const addCustomGoal = () => {
    const newGoal = {
      id: Date.now().toString(), // Simple unique ID
      goalName: '',
      targetAmount: '',
      targetYear: '',
      priority: 'Medium'
    };
    setCustomGoals([...customGoals, newGoal]);
  };

  // Remove custom goal by ID (for new structure)
  const removeCustomGoal = (goalId) => {
    if (typeof goalId === 'number') {
      // Handle legacy index-based removal
      setCustomGoals(customGoals.filter((_, i) => i !== goalId));
    } else {
      // Handle ID-based removal for new structure
      setCustomGoals(customGoals.filter(goal => goal.id !== goalId));
    }
  };

  // Enhanced CAS file upload handler for new Step 4
  const handleCasFileUpload = (e) => {
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
      setCasUploadStatus('uploaded');
      toast.success('CAS file uploaded successfully! Click "Extract Data" to process.');
    }
  };

  // Enhanced CAS data extraction handler for new Step 4
  const handleCasExtraction = async () => {
    if (!casFile) {
      toast.error('Please upload a CAS file first');
      return;
    }

    setCasUploadStatus('parsing');
    setCasParsingProgress(0);
    
    try {
      console.log('🔄 STARTING CAS EXTRACTION:', {
        fileName: casFile.name,
        fileSize: casFile.size,
        hasPassword: !!casPassword,
        token
      });

      // Initialize progress
      setCasParsingProgress(10);
      
      // Use existing FrontendCASParser
      const parser = new FrontendCASParser();
      
      // Progress updates
      setCasParsingProgress(30);
      
      const extractedData = await parser.parseCAS(casFile, casPassword, (progress) => {
        setCasParsingProgress(30 + (progress * 0.6)); // 30% to 90%
      });
      
      setCasParsingProgress(100);
      
      if (extractedData && Object.keys(extractedData).length > 0) {
        setCasData(extractedData);
        setCasUploadStatus('completed');
        toast.success('CAS data extracted successfully! Review the details below.');
        
        console.log('✅ CAS EXTRACTION SUCCESSFUL:', {
          fileName: casFile.name,
          extractedItems: Object.keys(extractedData).length,
          token
        });
      } else {
        throw new Error('No data could be extracted from the CAS file');
      }
    } catch (error) {
      console.error('❌ CAS EXTRACTION FAILED:', {
        fileName: casFile.name,
        error: error.message,
        token
      });
      
      setCasUploadStatus('error');
      setCasParsingProgress(0);
      toast.error(`Failed to extract CAS data: ${error.message}`);
    }
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
    // Validate required fields before submission
    const requiredFields = ['firstName', 'lastName', 'email', 'incomeType', 'investmentExperience', 'riskTolerance', 'monthlyInvestmentCapacity'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      // Show detailed error message with field names
      const fieldLabels = {
        firstName: 'First Name',
        lastName: 'Last Name', 
        email: 'Email Address',
        incomeType: 'Income Type (Step 2)',
        investmentExperience: 'Investment Experience (Step 7)',
        riskTolerance: 'Risk Tolerance (Step 7)',
        monthlyInvestmentCapacity: 'Monthly Investment Capacity (Step 7)'
      };
      
      const missingFieldLabels = missingFields.map(field => fieldLabels[field] || field);
      
      toast.error(
        `Cannot submit form. Missing required fields:\n• ${missingFieldLabels.join('\n• ')}\n\nTip: Complete all 7 steps and fill the required fields in Step 7.`,
        { duration: 8000 }
      );
      
      // Show the required fields checklist to help user
      setShowRequiredFieldsChecklist(true);
      
      // Scroll to the first error
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
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
      // Transform flat form data to nested structure expected by backend/database
      const transformFormData = (formData) => {
        return {
          // Step 1: Personal Information (already correct structure)
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          panNumber: formData.panNumber,
          maritalStatus: formData.maritalStatus,
          numberOfDependents: formData.numberOfDependents || 0,
          gender: formData.gender,
          address: formData.address,
          occupation: formData.occupation,
          employerBusinessName: formData.employerBusinessName,

          // Step 2: Income & Expenses
          totalMonthlyIncome: formData.totalMonthlyIncome,
          incomeType: formData.incomeType,
          totalMonthlyExpenses: formData.totalMonthlyExpenses,
          expenseBreakdown: {
            showBreakdown: formData.showExpenseBreakdown || false,
            housingRent: formData.housingRent || 0,
            foodGroceries: formData.foodGroceries || 0,
            transportation: formData.transportation || 0,
            utilities: formData.utilities || 0,
            entertainment: formData.entertainment || 0,
            healthcare: formData.healthcare || 0,
            otherExpenses: formData.otherExpenses || 0
          },

          // Step 3: Retirement Planning
          retirementAge: formData.retirementAge || 60,
          hasRetirementCorpus: formData.hasRetirementCorpus || false,
          currentRetirementCorpus: formData.currentRetirementCorpus || 0,
          targetRetirementCorpus: formData.targetRetirementCorpus || 0,

          // Step 4: Investments (Transform flat fields to nested structure)
          investments: {
            equity: {
              mutualFunds: formData.mutualFundsTotalValue || 0,
              directStocks: formData.directStocksTotalValue || 0
            },
            fixedIncome: {
              ppf: formData.ppfCurrentBalance || 0,
              epf: formData.epfCurrentBalance || 0,
              nps: formData.npsCurrentBalance || 0,
              fixedDeposits: formData.fixedDepositsTotalValue || 0,
              bondsDebentures: 0, // Not in current form
              nsc: 0 // Not in current form
            },
            other: {
              ulip: 0, // Not in current form
              otherInvestments: formData.otherInvestmentsTotalValue || 0
            }
          },

          // Additional investment details (for calculations)
          mutualFundsMonthlyInvestment: formData.mutualFundsMonthlyInvestment || 0,
          ppfAnnualContribution: formData.ppfAnnualContribution || 0,

          // Step 5: Debts & Liabilities (Transform to nested structure)
          debtsAndLiabilities: {
            homeLoan: {
              hasLoan: selectedLoanTypes.homeLoan || false,
              outstandingAmount: formData.homeLoanOutstanding || 0,
              monthlyEMI: formData.homeLoanEMI || 0,
              interestRate: formData.homeLoanInterestRate || 0,
              remainingTenure: formData.homeLoanTenure || 0
            },
            personalLoan: {
              hasLoan: selectedLoanTypes.personalLoan || false,
              outstandingAmount: formData.personalLoanOutstanding || 0,
              monthlyEMI: formData.personalLoanEMI || 0,
              interestRate: formData.personalLoanInterestRate || 0
            },
            carLoan: {
              hasLoan: selectedLoanTypes.carLoan || false,
              outstandingAmount: formData.carLoanOutstanding || 0,
              monthlyEMI: formData.carLoanEMI || 0,
              interestRate: formData.carLoanInterestRate || 0
            },
            educationLoan: {
              hasLoan: selectedLoanTypes.educationLoan || false,
              outstandingAmount: formData.educationLoanOutstanding || 0,
              monthlyEMI: formData.educationLoanEMI || 0,
              interestRate: formData.educationLoanInterestRate || 0
            },
            goldLoan: {
              hasLoan: selectedLoanTypes.goldLoan || false,
              outstandingAmount: formData.goldLoanOutstanding || 0,
              monthlyEMI: formData.goldLoanEMI || 0,
              interestRate: formData.goldLoanInterestRate || 0
            },
            businessLoan: {
              hasLoan: selectedLoanTypes.businessLoan || false,
              outstandingAmount: formData.businessLoanOutstanding || 0,
              monthlyEMI: formData.businessLoanEMI || 0,
              interestRate: formData.businessLoanInterestRate || 0
            },
            creditCards: {
              hasDebt: selectedLoanTypes.creditCards || false,
              totalOutstanding: formData.creditCardOutstanding || 0,
              monthlyPayment: formData.creditCardMonthlyPayment || 0,
              averageInterestRate: formData.creditCardInterestRate || 36
            },
            otherLoans: {
              hasLoan: selectedLoanTypes.otherLoans || false,
              loanType: formData.otherLoanType || '',
              outstandingAmount: formData.otherLoanOutstanding || 0,
              monthlyEMI: formData.otherLoanEMI || 0,
              interestRate: formData.otherLoanInterestRate || 0
            }
          },

          // Step 6: Insurance Coverage (Transform to nested structure)
          insuranceCoverage: {
            lifeInsurance: {
              hasInsurance: selectedInsuranceTypes.lifeInsurance || false,
              totalCoverAmount: formData.lifeInsuranceCoverAmount || 0,
              annualPremium: formData.lifeInsuranceAnnualPremium || 0,
              insuranceType: formData.lifeInsuranceType || 'Term Life'
            },
            healthInsurance: {
              hasInsurance: selectedInsuranceTypes.healthInsurance || false,
              totalCoverAmount: formData.healthInsuranceCoverAmount || 0,
              annualPremium: formData.healthInsuranceAnnualPremium || 0,
              familyMembers: formData.healthInsuranceFamilyMembers || 1
            },
            vehicleInsurance: {
              hasInsurance: selectedInsuranceTypes.vehicleInsurance || false,
              annualPremium: formData.vehicleInsuranceAnnualPremium || 0
            },
            otherInsurance: {
              hasInsurance: selectedInsuranceTypes.otherInsurance || false,
              insuranceTypes: formData.otherInsuranceTypes || '',
              annualPremium: formData.otherInsuranceAnnualPremium || 0
            }
          },

          // Step 7: Financial Goals & Risk Profile
          financialGoals: {
            emergencyFund: {
              priority: formData.emergencyFundPriority || 'High',
              targetAmount: formData.emergencyFundTarget || 0
            },
            childEducation: {
              isApplicable: formData.childEducationApplicable || false,
              targetAmount: formData.childEducationTarget || 0,
              targetYear: formData.childEducationYear || null
            },
            homePurchase: {
              isApplicable: formData.homePurchaseApplicable || false,
              targetAmount: formData.homePurchaseTarget || 0,
              targetYear: formData.homePurchaseYear || null
            }
          },

          // Risk Profile
          investmentExperience: formData.investmentExperience,
          riskTolerance: formData.riskTolerance,
          monthlyInvestmentCapacity: formData.monthlyInvestmentCapacity || 0,

          // Legacy fields for compatibility
          monthlySavingsTarget: formData.monthlySavingsTarget,
          investmentGoals: formData.investmentGoals || [],
          investmentHorizon: formData.investmentHorizon || '',
          
          // Additional fields that might be in form
          annualIncome: formData.annualIncome || (formData.totalMonthlyIncome * 12),
          additionalIncome: formData.additionalIncome || 0,
          
          // Keep any other fields that might be in the form data
          ...Object.keys(formData).reduce((acc, key) => {
            if (!['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'panNumber', 
                  'maritalStatus', 'numberOfDependents', 'gender', 'address', 'occupation', 
                  'employerBusinessName', 'totalMonthlyIncome', 'incomeType', 'totalMonthlyExpenses',
                  'retirementAge', 'hasRetirementCorpus', 'currentRetirementCorpus', 'targetRetirementCorpus',
                  'investmentExperience', 'riskTolerance', 'monthlyInvestmentCapacity'].includes(key) &&
                !key.includes('Loan') && !key.includes('Insurance') && !key.includes('mutual') && 
                !key.includes('ppf') && !key.includes('epf') && !key.includes('nps') && 
                !key.includes('creditCard') && !key.includes('emergencyFund') && 
                !key.includes('childEducation') && !key.includes('homePurchase')) {
              acc[key] = formData[key];
            }
            return acc;
          }, {})
        };
      };

      // Transform the form data
      const transformedData = transformFormData(data);

      // Include all form data with CAS data
      const submitData = {
        ...transformedData,
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
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
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
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Step {currentStep} of 7
          </div>
          <button
            type="button"
            onClick={() => setShowRequiredFieldsChecklist(true)}
            className="flex items-center px-3 py-1 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            title="View required fields checklist"
          >
            <ListChecks className="h-4 w-4 mr-1" />
            Help
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 7) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Personal Info</span>
        <span>Income & Employment</span>
        <span>Retirement</span>
        <span>Investments</span>
        <span>Debts</span>
        <span>Insurance</span>
        <span>Goals & Risk</span>
      </div>
    </div>
  );

  // Step content render functions
  const renderStep1_PersonalInfo = () => (
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
            maxLength="10"
            onChange={(e) => {
              // Convert to uppercase and remove any non-alphanumeric characters
              let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              // Limit to 10 characters and validate format
              if (value.length <= 10) {
                setValue('panNumber', value);
                // Clear any existing errors if format is becoming valid
                if (value.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
                  trigger('panNumber');
                }
              }
            }}
            onBlur={(e) => {
              // Additional cleanup on blur
              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              setValue('panNumber', value);
              // Trigger validation
              trigger('panNumber');
            }}
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

  const renderStep2_IncomeExpenses = () => {
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

        {/* Enhanced Total Monthly Expenses */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Monthly Expenses
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Monthly Expenses (₹) *</label>
              <input
                type="number"
                {...register('totalMonthlyExpenses', { 
                  required: 'Total monthly expenses is required',
                  min: { value: 0, message: 'Expenses must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter total monthly expenses"
              />
              <p className="text-xs text-gray-500 mt-1">Include rent, food, transport, bills, etc.</p>
              {errors.totalMonthlyExpenses && (
                <p className="mt-1 text-sm text-red-600">{errors.totalMonthlyExpenses.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Income Type *</label>
              <select
                {...register('incomeType', { required: 'Income type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select income type</option>
                <option value="Salaried">Salaried</option>
                <option value="Business">Business</option>
                <option value="Freelance">Freelance</option>
                <option value="Mixed">Mixed</option>
              </select>
              {errors.incomeType && (
                <p className="mt-1 text-sm text-red-600">{errors.incomeType.message}</p>
              )}
            </div>
          </div>
          
          {/* Optional Expense Breakdown Toggle */}
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showExpenseBreakdown}
                onChange={(e) => setShowExpenseBreakdown(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Want to provide detailed expense breakdown? (Optional)</span>
            </label>
          </div>
          
          {/* Conditional Expense Breakdown */}
          {showExpenseBreakdown && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Detailed Expense Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Housing/Rent (₹)</label>
                  <input
                    type="number"
                    {...register('housingRent', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Housing/Rent expenses"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food & Groceries (₹)</label>
                  <input
                    type="number"
                    {...register('foodGroceries', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Food & groceries"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transportation (₹)</label>
                  <input
                    type="number"
                    {...register('transportation', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Transport costs"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bills & Utilities (₹)</label>
                  <input
                    type="number"
                    {...register('utilities', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bills & utilities"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entertainment & Lifestyle (₹)</label>
                  <input
                    type="number"
                    {...register('entertainment', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entertainment & lifestyle"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Healthcare (₹)</label>
                  <input
                    type="number"
                    {...register('healthcare', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Healthcare expenses"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Legacy Expense Fields - Keep for compatibility but hide */}
        <div className="hidden">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Legacy Expense Breakdown (Hidden)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Housing/Rent (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.housingRent', { 
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Groceries, Utilities & Food (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.groceriesUtilitiesFood', { 
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Transportation (per month)</label>
              <input
                type="number"
                {...register('monthlyExpenses.transportation', { 
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

  const renderStep3_RetirementPlanning = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Retirement Planning</h2>
        <p className="text-gray-600">Plan for your golden years with smart retirement strategies</p>
      </div>

      {/* Enhanced Retirement Planning */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Retirement Planning
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Age</label>
            <input
              type="number"
              {...register('currentAge')}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
              placeholder="Auto-calculated from DOB"
            />
            <p className="text-xs text-gray-500 mt-1">Calculated from your date of birth</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Retirement Age *</label>
            <input
              type="number"
              {...register('retirementAge', { 
                required: 'Retirement age is required',
                min: { value: 45, message: 'Retirement age should be at least 45' },
                max: { value: 75, message: 'Retirement age should not exceed 75' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 60"
              defaultValue="60"
            />
            {errors.retirementAge && (
              <p className="mt-1 text-sm text-red-600">{errors.retirementAge.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years to Retirement</label>
            <input
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-gray-500 mt-1">Retirement age minus current age</p>
          </div>
        </div>
        
        {/* Existing Retirement Savings */}
        <div className="mt-6">
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              {...register('hasRetirementCorpus')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Do you have existing retirement savings?</span>
          </label>
          
          {watch('hasRetirementCorpus') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Retirement Corpus (₹)</label>
                <input
                  type="number"
                  {...register('currentRetirementCorpus', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Current retirement savings"
                />
                <p className="text-xs text-gray-500 mt-1">PPF, EPF, NPS, retirement-focused investments</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Retirement Corpus (₹)</label>
                <input
                  type="number"
                  {...register('targetRetirementCorpus', {
                    min: { value: 1000000, message: 'Minimum corpus should be ₹10 lakhs' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How much do you need?"
                />
                <p className="text-xs text-gray-500 mt-1">Suggested: 25x annual expenses</p>
              </div>
            </div>
          )}
          
          {!watch('hasRetirementCorpus') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Retirement Corpus (₹)</label>
              <input
                type="number"
                {...register('targetRetirementCorpus', {
                  min: { value: 1000000, message: 'Minimum corpus should be ₹10 lakhs' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How much do you need for retirement?"
              />
              <p className="text-xs text-gray-500 mt-1">Suggested: 25x your current annual expenses</p>
            </div>
          )}
        </div>
      </div>

      {/* Retirement Information Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-md font-medium text-blue-900 mb-4 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Retirement Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700"><strong>Years to Retirement:</strong> Auto-calculated</p>
            <p className="text-blue-700"><strong>Monthly Investment Needed:</strong> Auto-calculated</p>
          </div>
          <div>
            <p className="text-blue-700"><strong>Target Corpus:</strong> Based on your needs</p>
            <p className="text-blue-700"><strong>Strategy:</strong> Will be suggested based on risk profile</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4_CasAndInvestments = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Investments & CAS Upload</h2>
        <p className="text-gray-600">Upload your CAS statement or enter investment details manually</p>
      </div>

      {/* CAS Upload Section */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          CAS (Consolidated Account Statement)
        </h3>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={hasCAS}
              onChange={(e) => setHasCAS(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Do you have a CAS (Consolidated Account Statement)?</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">CAS contains all your mutual fund, stock, bond investments</p>
          
          {hasCAS && (
            <div className="space-y-4">
              {/* CAS Upload Interface */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload CAS PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCasFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CAS Password (if protected)</label>
                  <input
                    type="password"
                    value={casPassword}
                    onChange={(e) => setCasPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter CAS password"
                  />
                </div>
              </div>
              
              {casFile && (
                <button
                  type="button"
                  onClick={handleCasExtraction}
                  disabled={casUploadStatus === 'parsing'}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {casUploadStatus === 'parsing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Extract Data from CAS
                    </>
                  )}
                </button>
              )}
              
              {/* Manual Entry Option */}
              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showManualCasEntry}
                    onChange={(e) => setShowManualCasEntry(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">CAS not working? Fill manually</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Investment Entry */}
      {(!hasCAS || showManualCasEntry) && (
        <div className="space-y-6">
          <h3 className="text-md font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Investment Details
            <span className="ml-2 text-sm text-gray-500">(Enter manually or auto-filled from CAS)</span>
          </h3>
          
          {/* Investment Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Mutual Funds */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.mutualFunds || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, mutualFunds: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Mutual Funds</span>
              </label>
              
              {selectedInvestmentTypes.mutualFunds && (
                <div className="space-y-3">
                  <input
                    type="number"
                    {...register('mutualFundsTotalValue', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Total value (₹)"
                  />
                  <input
                    type="number"
                    {...register('mutualFundsMonthlyInvestment', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Monthly SIP (₹)"
                  />
                </div>
              )}
            </div>
            
            {/* Direct Stocks */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.directStocks || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, directStocks: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Direct Stocks</span>
              </label>
              
              {selectedInvestmentTypes.directStocks && (
                <input
                  type="number"
                  {...register('directStocksTotalValue', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Portfolio value (₹)"
                />
              )}
            </div>
            
            {/* PPF */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.ppf || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, ppf: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">PPF</span>
              </label>
              
              {selectedInvestmentTypes.ppf && (
                <div className="space-y-3">
                  <input
                    type="number"
                    {...register('ppfCurrentBalance', {
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Current balance (₹)"
                  />
                  <input
                    type="number"
                    {...register('ppfAnnualContribution', {
                      min: { value: 0, message: 'Amount must be positive' },
                      max: { value: 150000, message: 'PPF limit is ₹1.5L per year' }
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Annual contribution (₹)"
                  />
                </div>
              )}
            </div>
            
            {/* EPF */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.epf || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, epf: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">EPF</span>
              </label>
              
              {selectedInvestmentTypes.epf && (
                <input
                  type="number"
                  {...register('epfCurrentBalance', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Current balance (₹)"
                />
              )}
            </div>
          </div>
          
          {/* Additional Investment Types */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* NPS */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.nps || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, nps: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">NPS</span>
              </label>
              
              {selectedInvestmentTypes.nps && (
                <input
                  type="number"
                  {...register('npsCurrentBalance', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Current balance (₹)"
                />
              )}
            </div>
            
            {/* ELSS */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.elss || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, elss: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">ELSS</span>
              </label>
              
              {selectedInvestmentTypes.elss && (
                <input
                  type="number"
                  {...register('elssCurrentValue', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Current value (₹)"
                />
              )}
            </div>
            
            {/* Fixed Deposits */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.fixedDeposits || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, fixedDeposits: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Fixed Deposits</span>
              </label>
              
              {selectedInvestmentTypes.fixedDeposits && (
                <input
                  type="number"
                  {...register('fixedDepositsTotalValue', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Total FD value (₹)"
                />
              )}
            </div>
            
            {/* Other Investments */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedInvestmentTypes.otherInvestments || false}
                  onChange={(e) => setSelectedInvestmentTypes(prev => ({...prev, otherInvestments: e.target.checked}))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Other Investments</span>
              </label>
              
              {selectedInvestmentTypes.otherInvestments && (
                <input
                  type="number"
                  {...register('otherInvestmentsTotalValue', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Gold, real estate, bonds (₹)"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAS Data Display */}
      {casData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-md font-medium text-green-900 mb-4 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            CAS Data Extracted Successfully
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Your investment data has been automatically extracted from the CAS. You can review and edit the details below.
          </p>
          <button
            type="button"
            onClick={() => setShowCasDetails(!showCasDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showCasDetails ? 'Hide Details' : 'View Details'}
          </button>
          
          {showCasDetails && (
            <div className="mt-4 p-4 bg-white rounded border">
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(casData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Legacy code removed - replaced with new optimized 7-step structure

  // Old renderStep4 function removed - using renderStep4_CasAndInvestments instead

  const renderStep5_DebtsAndLiabilities = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Debts & Liabilities</h2>
        <p className="text-gray-600">Tell us about your loans and outstanding debts</p>
        <p className="text-sm text-gray-500 mt-1">Click on loan types you have to provide details</p>
      </div>

      {/* Enhanced Loan Types Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Home Loan */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLoanTypes.homeLoan || false}
                onChange={(e) => setSelectedLoanTypes(prev => ({...prev, homeLoan: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <Home className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Home Loan</span>
              </div>
            </label>
            
            {selectedLoanTypes.homeLoan && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="number"
                  {...register('homeLoanOutstanding', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Outstanding amount (₹)"
                />
                <input
                  type="number"
                  {...register('homeLoanEMI', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Monthly EMI (₹)"
                />
                <input
                  type="number"
                  step="0.1"
                  {...register('homeLoanInterestRate', {
                    min: { value: 0, message: 'Rate must be positive' },
                    max: { value: 50, message: 'Rate seems too high' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Interest rate (%)"
                />
                <input
                  type="number"
                  {...register('homeLoanTenure', {
                    min: { value: 0, message: 'Tenure must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Remaining years"
                />
              </div>
            )}
          </div>

          {/* Personal Loan */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLoanTypes.personalLoan || false}
                onChange={(e) => setSelectedLoanTypes(prev => ({...prev, personalLoan: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <User className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Personal Loan</span>
              </div>
            </label>
            
            {selectedLoanTypes.personalLoan && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="number"
                  {...register('personalLoanOutstanding')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Outstanding amount (₹)"
                />
                <input
                  type="number"
                  {...register('personalLoanEMI')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Monthly EMI (₹)"
                />
                <input
                  type="number"
                  step="0.1"
                  {...register('personalLoanInterestRate')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Interest rate (%)"
                />
              </div>
            )}
          </div>

          {/* Car Loan */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLoanTypes.carLoan || false}
                onChange={(e) => setSelectedLoanTypes(prev => ({...prev, carLoan: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <div className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs text-red-600">🚗</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Car Loan</span>
              </div>
            </label>
            
            {selectedLoanTypes.carLoan && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="number"
                  {...register('carLoanOutstanding')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Outstanding amount (₹)"
                />
                <input
                  type="number"
                  {...register('carLoanEMI')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Monthly EMI (₹)"
                />
                <input
                  type="number"
                  step="0.1"
                  {...register('carLoanInterestRate')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Interest rate (%)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Credit Cards and Other Loans */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLoanTypes.creditCards || false}
                onChange={(e) => setSelectedLoanTypes(prev => ({...prev, creditCards: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <Banknote className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Credit Card Debt</span>
              </div>
            </label>
            
            {selectedLoanTypes.creditCards && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                <input
                  type="number"
                  {...register('creditCardOutstanding')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Total outstanding (₹)"
                />
                <input
                  type="number"
                  {...register('creditCardMonthlyPayment')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Monthly payment (₹)"
                />
                <input
                  type="number"
                  step="0.1"
                  {...register('creditCardInterestRate')}
                  defaultValue="36"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Avg interest rate (%)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Debt Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-md font-medium text-orange-900 mb-4 flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Debt Summary (Auto-calculated)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-orange-700"><strong>Total Monthly EMIs:</strong> Auto-calculated</p>
              <p className="text-orange-700"><strong>Total Outstanding:</strong> Sum of all debts</p>
            </div>
            <div>
              <p className="text-orange-700"><strong>Debt-to-Income Ratio:</strong> EMIs ÷ Monthly Income</p>
              <p className="text-orange-700"><strong>Weighted Avg Rate:</strong> Calculated automatically</p>
            </div>
            <div>
              <p className="text-orange-700"><strong>Priority:</strong> Highest rate debts first</p>
              <p className="text-orange-700"><strong>Strategy:</strong> Will be suggested</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy content - temporarily hidden */}
      <div className="hidden">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Old Investment Profile Section
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investment Experience</label>
            <select
              {...register('investmentExperience_legacy')}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
            <select
              {...register('riskTolerance_legacy')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select risk tolerance</option>
              <option value="Conservative">Conservative</option>
              <option value="Moderate">Moderate</option>
              <option value="Aggressive">Aggressive</option>
              <option value="Very Aggressive">Very Aggressive</option>
            </select>
            {errors.riskTolerance_legacy && (
              <p className="mt-1 text-sm text-red-600">{errors.riskTolerance_legacy.message}</p>
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

  const renderStep6_InsuranceOptional = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Insurance Coverage</h2>
        <p className="text-gray-600">Tell us about your insurance policies (optional but recommended)</p>
        <p className="text-sm text-gray-500 mt-1">Click on insurance types you have to provide details</p>
      </div>

      {/* Insurance Types Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Life Insurance */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInsuranceTypes.lifeInsurance || false}
                onChange={(e) => setSelectedInsuranceTypes(prev => ({...prev, lifeInsurance: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs text-blue-600">🛡️</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Life Insurance</span>
              </div>
            </label>
            
            {selectedInsuranceTypes.lifeInsurance && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="number"
                  {...register('lifeInsuranceCoverAmount', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Total cover amount (₹)"
                />
                <input
                  type="number"
                  {...register('lifeInsuranceAnnualPremium', {
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Annual premium (₹)"
                />
                <select
                  {...register('lifeInsuranceType')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Insurance type</option>
                  <option value="Term Life">Term Life</option>
                  <option value="Whole Life">Whole Life</option>
                  <option value="ULIP">ULIP</option>
                  <option value="Endowment">Endowment</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            )}
          </div>

          {/* Health Insurance */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInsuranceTypes.healthInsurance || false}
                onChange={(e) => setSelectedInsuranceTypes(prev => ({...prev, healthInsurance: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs text-green-600">🏥</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Health Insurance</span>
              </div>
            </label>
            
            {selectedInsuranceTypes.healthInsurance && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="number"
                  {...register('healthInsuranceCoverAmount')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Total cover amount (₹)"
                />
                <input
                  type="number"
                  {...register('healthInsuranceAnnualPremium')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Annual premium (₹)"
                />
                <input
                  type="number"
                  {...register('healthInsuranceFamilyMembers')}
                  defaultValue="1"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Family members covered"
                />
              </div>
            )}
          </div>

          {/* Vehicle Insurance */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInsuranceTypes.vehicleInsurance || false}
                onChange={(e) => setSelectedInsuranceTypes(prev => ({...prev, vehicleInsurance: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <div className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs text-red-600">🚗</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Vehicle Insurance</span>
              </div>
            </label>
            
            {selectedInsuranceTypes.vehicleInsurance && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="number"
                  {...register('vehicleInsuranceAnnualPremium')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Annual premium (₹)"
                />
              </div>
            )}
          </div>

          {/* Other Insurance */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <label className="flex items-center space-x-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInsuranceTypes.otherInsurance || false}
                onChange={(e) => setSelectedInsuranceTypes(prev => ({...prev, otherInsurance: e.target.checked}))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center">
                <Plus className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Other Insurance</span>
              </div>
            </label>
            
            {selectedInsuranceTypes.otherInsurance && (
              <div className="space-y-3 bg-gray-50 p-3 rounded">
                <input
                  type="text"
                  {...register('otherInsuranceTypes')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Type (Travel, Home, etc.)"
                />
                <input
                  type="number"
                  {...register('otherInsuranceAnnualPremium')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Annual premium (₹)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Insurance Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-md font-medium text-green-900 mb-4 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Insurance Summary (Auto-calculated)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-700"><strong>Total Annual Premiums:</strong> Auto-calculated</p>
              <p className="text-green-700"><strong>Total Coverage:</strong> Sum of all covers</p>
            </div>
            <div>
              <p className="text-green-700"><strong>Coverage Adequacy:</strong> Recommended vs Current</p>
              <p className="text-green-700"><strong>Premium-to-Income:</strong> Premiums ÷ Annual Income</p>
            </div>
            <div>
              <p className="text-green-700"><strong>Gaps Identified:</strong> Based on profile</p>
              <p className="text-green-700"><strong>Recommendations:</strong> Will be provided</p>
            </div>
          </div>
        </div>

        {/* Optional Skip Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Insurance details are optional but help us provide comprehensive financial planning. 
            You can always add this information later in your profile.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep7_GoalsAndRiskProfile = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Goals & Risk Profile</h2>
        <p className="text-gray-600">Complete your financial profile with goals and investment preferences</p>
      </div>

      {/* Financial Goals Section */}
      <div className="space-y-6">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Financial Goals
        </h3>

        {/* Emergency Fund */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Fund Priority</label>
              <select
                {...register('emergencyFundPriority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="High"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Emergency Fund (₹)</label>
              <input
                type="number"
                {...register('emergencyFundTarget')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Suggested: 6x monthly expenses"
              />
            </div>
          </div>
        </div>

        {/* Child Education */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              {...register('hasChildEducationGoal')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Child's Education Goal</span>
          </label>
          
          {watch('hasChildEducationGoal') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (₹)</label>
                <input
                  type="number"
                  {...register('childEducationTarget')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2500000"
                  defaultValue="2500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Year</label>
                <input
                  type="number"
                  {...register('childEducationTargetYear')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2035"
                />
              </div>
            </div>
          )}
        </div>

        {/* Home Purchase */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              {...register('hasHomePurchaseGoal')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Home Purchase Goal</span>
          </label>
          
          {watch('hasHomePurchaseGoal') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (₹)</label>
                <input
                  type="number"
                  {...register('homePurchaseTarget')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Home purchase amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Year</label>
                <input
                  type="number"
                  {...register('homePurchaseTargetYear')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2030"
                />
              </div>
            </div>
          )}
        </div>

        {/* Custom Goals */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Custom Goals</h4>
            <button
              type="button"
              onClick={addCustomGoal}
              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </button>
          </div>
          
          {customGoals.map((goal, index) => (
            <div key={goal.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded mb-3">
              <input
                type="text"
                {...register(`customGoals.${index}.goalName`)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Goal name"
              />
              <input
                type="number"
                {...register(`customGoals.${index}.targetAmount`)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Target amount (₹)"
              />
              <input
                type="number"
                {...register(`customGoals.${index}.targetYear`)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Target year"
              />
              <div className="flex items-center space-x-2">
                <select
                  {...register(`customGoals.${index}.priority`)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeCustomGoal(goal.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Profile Section */}
      <div className="space-y-6">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2" />
          Investment Risk Profile
        </h3>
        
        {/* Required Fields Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> All fields marked with * are required to complete your profile. Please fill in your investment experience, risk tolerance, and monthly investment capacity before submitting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investment Experience *</label>
            <select
              {...register('investmentExperience', { required: 'Investment experience is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select experience level</option>
              <option value="Beginner">Beginner (0-2 years)</option>
              <option value="Intermediate">Intermediate (2-5 years)</option>
              <option value="Advanced">Experienced (5-10 years)</option>
              <option value="Expert">Expert (10+ years)</option>
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
              <option value="Conservative">Conservative - Low risk, stable returns</option>
              <option value="Moderate">Moderate - Balanced risk and returns</option>
              <option value="Aggressive">Aggressive - High risk, high returns</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Conservative: Low risk, stable returns | Moderate: Balanced | Aggressive: High risk, high returns</p>
            {errors.riskTolerance && (
              <p className="mt-1 text-sm text-red-600">{errors.riskTolerance.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Investment Capacity (₹) *</label>
          <input
            type="number"
            {...register('monthlyInvestmentCapacity', { 
              required: 'Monthly investment capacity is required',
              min: { value: 0, message: 'Amount must be positive' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="How much can you invest monthly?"
          />
          <p className="text-xs text-gray-500 mt-1">Suggested: Income - Expenses - EMIs = Available for investment</p>
          {errors.monthlyInvestmentCapacity && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlyInvestmentCapacity.message}</p>
          )}
        </div>
      </div>

      {/* Final Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-md font-medium text-green-900 mb-4 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          Ready to Complete Your Financial Profile!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-green-700"><strong>Profile Completion:</strong> Almost done!</p>
            <p className="text-green-700"><strong>Next Steps:</strong> Review and submit</p>
          </div>
          <div>
            <p className="text-green-700"><strong>Personalized Advice:</strong> Based on your profile</p>
            <p className="text-green-700"><strong>Action Plan:</strong> Custom recommendations</p>
          </div>
        </div>
        
        {/* Submission Checklist */}
        <div className="bg-white p-3 rounded border border-green-300">
          <h4 className="text-sm font-medium text-green-800 mb-2">Before you submit, make sure:</h4>
          <div className="text-xs text-green-700 space-y-1">
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-2" />
              <span>All required fields above are filled (marked with *)</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-2" />
              <span>Your contact information is correct</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-2" />
              <span>Your income and expense information is accurate</span>
            </div>
            <div className="flex items-center">
              <HelpCircle className="h-3 w-3 mr-2" />
              <span className="flex-1">Need help? Click the "Help" button above to see all required fields</span>
            </div>
          </div>
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
        {currentStep < 7 ? (
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
              {currentStep === 1 && renderStep1_PersonalInfo()}
              {currentStep === 2 && renderStep2_IncomeExpenses()}
              {currentStep === 3 && renderStep3_RetirementPlanning()}
              {currentStep === 4 && renderStep4_CasAndInvestments()}
              {currentStep === 5 && renderStep5_DebtsAndLiabilities()}
              {currentStep === 6 && renderStep6_InsuranceOptional()}
              {currentStep === 7 && renderStep7_GoalsAndRiskProfile()}
            </div>

            {/* Navigation */}
            <NavigationButtons />
          </form>
        </div>

        {/* Debug Panel (Development Only) */}
        {import.meta.env.DEV && (
          <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <h3 className="text-white font-bold mb-2">🔍 Enhanced Debug Information</h3>
            <div className="space-y-1">
              <div>Token: {token}</div>
              <div>Current Step: {currentStep}/7</div>
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
              
              {/* Form Validation Debug */}
              <div className="border-t border-gray-600 pt-2 mt-2">
                <h4 className="text-yellow-400 font-bold">📋 Form Validation Debug</h4>
                <div>Critical Fields Status:</div>
                <div className="ml-2">
                  <div>• firstName: {getValues().firstName ? '✅' : '❌'} "{getValues().firstName}"</div>
                  <div>• lastName: {getValues().lastName ? '✅' : '❌'} "{getValues().lastName}"</div>
                  <div>• email: {getValues().email ? '✅' : '❌'} "{getValues().email}"</div>
                  <div>• incomeType: {getValues().incomeType ? '✅' : '❌'} "{getValues().incomeType}"</div>
                  <div>• investmentExperience: {getValues().investmentExperience ? '✅' : '❌'} "{getValues().investmentExperience}"</div>
                  <div>• riskTolerance: {getValues().riskTolerance ? '✅' : '❌'} "{getValues().riskTolerance}"</div>
                  <div>• monthlyInvestmentCapacity: {getValues().monthlyInvestmentCapacity ? '✅' : '❌'} "{getValues().monthlyInvestmentCapacity}"</div>
                </div>
                <div>Validation Errors: {Object.keys(errors).length > 0 ? `${Object.keys(errors).length} error(s): ${Object.keys(errors).join(', ')}` : 'None'}</div>
              </div>
              
              {/* Quick Actions */}
              <div className="border-t border-gray-600 pt-2 mt-2">
                <h4 className="text-yellow-400 font-bold">🔧 Quick Actions</h4>
                <div className="flex space-x-2 mt-1">
                  <button
                    onClick={() => setShowRequiredFieldsChecklist(true)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Show Checklist
                  </button>
                  <button
                    onClick={() => {
                      const formValues = getValues();
                      // Create a safe copy without circular references
                      const safeValues = {};
                      Object.keys(formValues).forEach(key => {
                        const value = formValues[key];
                        if (typeof value === 'object' && value !== null) {
                          safeValues[key] = JSON.stringify(value);
                        } else {
                          safeValues[key] = value;
                        }
                      });
                      console.log('Current form values:', safeValues);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Log Form Values
                  </button>
                  <button
                    onClick={() => {
                      // Create a safe copy of errors without circular references
                      const safeErrors = {};
                      Object.keys(errors).forEach(key => {
                        const error = errors[key];
                        if (error && typeof error === 'object') {
                          safeErrors[key] = error.message || 'Error present';
                        } else {
                          safeErrors[key] = error;
                        }
                      });
                      console.log('Form errors:', safeErrors);
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Log Errors
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Required Fields Checklist Modal */}
        {showRequiredFieldsChecklist && (
          <RequiredFieldsChecklist
            formValues={getValues()}
            errors={errors}
            currentStep={currentStep}
            onClose={() => setShowRequiredFieldsChecklist(false)}
            isVisible={showRequiredFieldsChecklist}
          />
        )}
      </div>
    </div>
  );
}

export default ClientOnboardingForm;