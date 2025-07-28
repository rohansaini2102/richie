// A/B Testing API Service
class ABTestingService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.apiURL = `${this.baseURL}/api/plans`;
  }

  // Helper method to get auth token
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Helper method to create request headers
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get all plans for a specific client
  async getClientPlans(clientId, planType = null) {
    try {
      const url = new URL(`${this.apiURL}/client/${clientId}/all`);
      if (planType) {
        url.searchParams.append('planType', planType);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching client plans:', error);
      throw error;
    }
  }

  // Compare two plans using AI
  async comparePlans(planAId, planBId) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/compare`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          planAId,
          planBId
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error comparing plans:', error);
      throw error;
    }
  }

  // Get comparison history for a client
  async getComparisonHistory(clientId, limit = 10) {
    try {
      const url = new URL(`${this.apiURL}/ab-test/history/${clientId}`);
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching comparison history:', error);
      throw error;
    }
  }

  // Update comparison decision (select winner)
  async updateComparisonDecision(comparisonId, selectedWinner, reason) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/comparison/${comparisonId}/decision`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          selectedWinner,
          reason
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating comparison decision:', error);
      throw error;
    }
  }

  // Get comparison by ID
  async getComparisonById(comparisonId) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/comparison/${comparisonId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching comparison:', error);
      throw error;
    }
  }

  // Get A/B testing statistics
  async getABTestingStats() {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching A/B testing stats:', error);
      throw error;
    }
  }

  // Search comparisons with filters
  async searchComparisons(filters = {}) {
    try {
      const url = new URL(`${this.apiURL}/ab-test/search`);
      
      // Add query parameters for filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error searching comparisons:', error);
      throw error;
    }
  }

  // Delete a comparison (admin only)
  async deleteComparison(comparisonId) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/comparison/${comparisonId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting comparison:', error);
      throw error;
    }
  }

  // Export comparison results as PDF/CSV
  async exportComparison(comparisonId, format = 'pdf') {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/comparison/${comparisonId}/export`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Return blob for file download
      const blob = await response.blob();
      return {
        success: true,
        blob,
        filename: `comparison-${comparisonId}.${format}`
      };
    } catch (error) {
      console.error('Error exporting comparison:', error);
      throw error;
    }
  }

  // Bulk compare multiple plan pairs
  async bulkComparePlans(planPairs) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/bulk-compare`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ planPairs }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error bulk comparing plans:', error);
      throw error;
    }
  }

  // Get plans suitable for comparison (same type, same client)
  async getComparablePlans(clientId) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/comparable-plans/${clientId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching comparable plans:', error);
      throw error;
    }
  }

  // Update comparison notes/tags
  async updateComparisonMeta(comparisonId, updates) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/comparison/${comparisonId}/meta`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating comparison metadata:', error);
      throw error;
    }
  }

  // View PDF for a specific plan
  async viewPlanPDF(planId, reportType) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/${planId}/pdf/${reportType}`, {
        method: 'GET',
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'PDF not available' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Get PDF metadata from headers
      const pdfInfo = response.headers.get('X-PDF-Info');
      const metadata = pdfInfo ? JSON.parse(pdfInfo) : {};

      // Convert response to blob
      const blob = await response.blob();
      
      // Create object URL for viewing
      const pdfUrl = URL.createObjectURL(blob);

      return {
        success: true,
        pdfUrl,
        metadata,
        filename: metadata.fileName || `plan-${planId}-${reportType}.pdf`,
        cleanup: () => URL.revokeObjectURL(pdfUrl)
      };
    } catch (error) {
      console.error('Error viewing plan PDF:', error);
      throw error;
    }
  }

  // Download PDF for a specific plan
  async downloadPlanPDF(planId, reportType, filename) {
    try {
      const result = await this.viewPlanPDF(planId, reportType);
      
      // Create download link
      const link = document.createElement('a');
      link.href = result.pdfUrl;
      link.download = filename || result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup the URL after download
      setTimeout(() => result.cleanup(), 1000);
      
      return {
        success: true,
        message: 'PDF downloaded successfully'
      };
    } catch (error) {
      console.error('Error downloading plan PDF:', error);
      throw error;
    }
  }

  // Check if PDF exists for a plan
  async checkPlanPDF(planId, reportType) {
    try {
      const response = await fetch(`${this.apiURL}/ab-test/${planId}/pdf/${reportType}`, {
        method: 'HEAD',
        headers: this.getHeaders(),
      });

      return {
        success: true,
        exists: response.ok,
        status: response.status
      };
    } catch (error) {
      console.error('Error checking plan PDF:', error);
      return {
        success: false,
        exists: false,
        error: error.message
      };
    }
  }
}

// Create and export a singleton instance
export const abTestingService = new ABTestingService();

// Export the class as well for potential custom instances
export default ABTestingService;