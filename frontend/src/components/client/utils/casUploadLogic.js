// CAS upload logic extracted from ClientOnboardingForm.jsx
import { clientAPI } from '../../../services/api';
import { FrontendCASParser } from '../../../utils/casParser';
import toast from 'react-hot-toast';

/**
 * Handle CAS file upload
 */
export const handleCASFileUpload = async (token, file, password = '', setCasUploadStatus, setCasTrackingId, setCasParsingProgress) => {
  try {
    setCasUploadStatus('uploading');
    setCasParsingProgress(10);
    
    const formData = new FormData();
    formData.append('casFile', file);
    if (password) {
      formData.append('casPassword', password);
    }
    
    console.log('📤 ENHANCED: Starting CAS file upload...', {
      fileName: file.name,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      hasPassword: !!password,
      timestamp: new Date().toISOString()
    });
    
    const uploadResponse = await clientAPI.uploadOnboardingCAS(token, formData);
    
    if (uploadResponse.success) {
      setCasUploadStatus('uploaded');
      setCasTrackingId(uploadResponse.trackingId);
      setCasParsingProgress(30);
      
      toast.success('CAS file uploaded successfully!');
      
      console.log('✅ ENHANCED: CAS file uploaded successfully', {
        trackingId: uploadResponse.trackingId,
        fileName: file.name,
        uploadTime: new Date().toISOString()
      });
      
      return uploadResponse;
    } else {
      throw new Error(uploadResponse.message || 'Upload failed');
    }
    
  } catch (error) {
    console.error('❌ ENHANCED: CAS file upload failed:', error);
    setCasUploadStatus('error');
    setCasParsingProgress(0);
    
    toast.error(`Upload failed: ${error.message}`);
    throw error;
  }
};

/**
 * Parse uploaded CAS file
 */
export const parseCASFile = async (token, setCasUploadStatus, setCasData, setCasParsingProgress) => {
  try {
    setCasUploadStatus('parsing');
    setCasParsingProgress(50);
    
    console.log('🔄 ENHANCED: Starting CAS parsing...');
    
    const parseResponse = await clientAPI.parseOnboardingCAS(token);
    
    if (parseResponse.success) {
      setCasUploadStatus('parsed');
      setCasData(parseResponse.data);
      setCasParsingProgress(100);
      
      toast.success('CAS file parsed successfully!');
      
      console.log('✅ ENHANCED: CAS parsing completed', {
        totalValue: parseResponse.data?.summary?.total_value || 0,
        accounts: parseResponse.data?.demat_accounts?.length || 0,
        mutualFunds: parseResponse.data?.mutual_funds?.length || 0,
        parseTime: new Date().toISOString()
      });
      
      return parseResponse.data;
    } else {
      throw new Error(parseResponse.message || 'Parsing failed');
    }
    
  } catch (error) {
    console.error('❌ ENHANCED: CAS parsing failed:', error);
    setCasUploadStatus('error');
    setCasParsingProgress(0);
    
    toast.error(`Parsing failed: ${error.message}`);
    throw error;
  }
};

/**
 * Handle frontend CAS parsing using browser-based parser
 */
export const handleFrontendCASParsing = async (file, password, setCasData, setCasUploadStatus, setCasParsingProgress) => {
  try {
    setCasUploadStatus('parsing');
    setCasParsingProgress(20);
    
    console.log('🔄 Frontend CAS parsing started...', {
      fileName: file.name,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      hasPassword: !!password
    });
    
    const parser = new FrontendCASParser();
    setCasParsingProgress(40);
    
    const parsedData = await parser.parseFile(file, password);
    setCasParsingProgress(80);
    
    if (parsedData && parsedData.summary) {
      setCasData(parsedData);
      setCasUploadStatus('parsed');
      setCasParsingProgress(100);
      
      console.log('✅ Frontend CAS parsing successful:', {
        totalValue: parsedData.summary?.total_value || 0,
        accounts: parsedData.demat_accounts?.length || 0,
        mutualFunds: parsedData.mutual_funds?.length || 0
      });
      
      toast.success('CAS file processed successfully!');
      return parsedData;
    } else {
      throw new Error('Invalid CAS data structure');
    }
    
  } catch (error) {
    console.error('❌ Frontend CAS parsing failed:', error);
    setCasUploadStatus('error');
    setCasParsingProgress(0);
    
    toast.error(`CAS processing failed: ${error.message}`);
    throw error;
  }
};

/**
 * Get CAS status from server
 */
export const getCASStatus = async (token) => {
  try {
    const response = await clientAPI.getCASStatus(token);
    return response;
  } catch (error) {
    console.error('Error fetching CAS status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format CAS data for display
 */
export const formatCASData = (casData) => {
  if (!casData || !casData.summary) {
    return null;
  }
  
  return {
    totalValue: casData.summary.total_value || 0,
    dematAccounts: casData.demat_accounts?.length || 0,
    mutualFunds: casData.mutual_funds?.length || 0,
    investor: casData.investor || {},
    assetAllocation: casData.summary.asset_allocation || {},
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Validate CAS file before upload
 */
export const validateCASFile = (file) => {
  const errors = [];
  
  // Check file type
  if (file.type !== 'application/pdf') {
    errors.push('Only PDF files are allowed');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }
  
  // Check file name for basic validation
  const fileName = file.name.toLowerCase();
  if (!fileName.includes('cas') && !fileName.includes('statement')) {
    console.warn('File name does not contain "cas" or "statement" - might not be a CAS file');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Reset CAS upload state
 */
export const resetCASUploadState = (setCasFile, setCasPassword, setCasUploadStatus, setCasData, setCasParsingProgress, setCasTrackingId) => {
  setCasFile(null);
  setCasPassword('');
  setCasUploadStatus('not_uploaded');
  setCasData(null);
  setCasParsingProgress(0);
  setCasTrackingId(null);
};

/**
 * Handle CAS file removal
 */
export const handleCASFileRemoval = (resetFunction) => {
  if (window.confirm('Are you sure you want to remove the CAS file? This action cannot be undone.')) {
    resetFunction();
    toast.success('CAS file removed');
  }
};

/**
 * Extract portfolio summary from CAS data for form integration
 */
export const extractPortfolioSummary = (casData) => {
  if (!casData || !casData.summary) {
    return null;
  }
  
  const summary = casData.summary;
  const accounts = summary.accounts || {};
  
  return {
    // Equity investments
    mutualFunds: accounts.mutual_funds?.total_value || 0,
    directStocks: accounts.demat?.breakdown?.equities || 0,
    
    // Fixed income
    bonds: accounts.demat?.breakdown?.bonds || 0,
    governmentSecurities: accounts.demat?.breakdown?.government_securities || 0,
    
    // Other investments
    aifs: accounts.demat?.breakdown?.aifs || 0,
    
    // Total portfolio value
    totalValue: summary.total_value || 0,
    
    // Asset allocation
    assetAllocation: {
      equity: summary.asset_allocation?.equity_percentage || 0,
      debt: summary.asset_allocation?.debt_percentage || 0,
      others: summary.asset_allocation?.others_percentage || 0
    },
    
    // Account information
    accountsCount: {
      demat: casData.demat_accounts?.length || 0,
      mutualFunds: casData.mutual_funds?.length || 0
    }
  };
};