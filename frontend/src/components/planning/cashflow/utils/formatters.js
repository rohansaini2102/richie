// Formatting utilities for financial data display

export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCurrencyCompact = (amount) => {
  if (!amount || amount === 0) return '₹0';
  
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(amount);
};

export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date) => {
  if (!date) return 'Not provided';
  
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateShort = (date) => {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  
  return new Intl.NumberFormat('en-IN').format(number);
};

export const formatTenure = (months) => {
  if (!months) return 'N/A';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years > 0 && remainingMonths > 0) {
    return `${years}y ${remainingMonths}m`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else {
    return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }
};

export const getHealthScoreColor = (score) => {
  if (score >= 80) return 'success.main';
  if (score >= 60) return 'info.main';
  if (score >= 40) return 'warning.main';
  return 'error.main';
};

export const getHealthScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
};

export const getRatioColor = (ratio, type = 'emi') => {
  const thresholds = {
    emi: { good: 30, warning: 40, danger: 50 },
    expense: { good: 50, warning: 70, danger: 85 },
    savings: { good: 30, warning: 20, danger: 10 }
  };
  
  const threshold = thresholds[type] || thresholds.emi;
  
  if (type === 'savings') {
    // For savings, higher is better
    if (ratio >= threshold.good) return 'success.main';
    if (ratio >= threshold.warning) return 'warning.main';
    return 'error.main';
  } else {
    // For EMI and expenses, lower is better
    if (ratio <= threshold.good) return 'success.main';
    if (ratio <= threshold.warning) return 'warning.main';
    return 'error.main';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'error.main';
    case 'medium':
      return 'warning.main';
    case 'low':
      return 'success.main';
    default:
      return 'text.secondary';
  }
};

export const getPriorityBgColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'error.light';
    case 'medium':
      return 'warning.light';
    case 'low':
      return 'success.light';
    default:
      return 'grey.200';
  }
};

export const formatTimelineLabel = (timeline) => {
  const timelineMap = {
    '0-1 month': 'Immediate',
    '0-3 months': 'Short Term',
    '0-6 months': 'Medium Term',
    '0-12 months': 'Long Term',
    '12+ months': 'Extended'
  };
  
  return timelineMap[timeline] || timeline;
};

export const formatFieldName = (fieldName) => {
  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};