const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { logger } = require('../../../utils/logger');
const { casEventLogger } = require('../../../utils/casEventLogger');

class PDFReader {
  constructor() {
    this.trackingId = this.generateTrackingId();
  }

  /**
   * Generate unique tracking ID
   */
  generateTrackingId() {
    return `PDF_READER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Read PDF file and extract text content with enhanced error handling
   * @param {string} filePath - Path to the PDF file
   * @param {string} password - Password for the PDF (if protected)
   * @returns {Promise<string>} - Extracted text content
   */
  async readPDF(filePath, password = '') {
    const readStartTime = Date.now();
    
    casEventLogger.logInfo('PDF_READ_STARTED', {
      filePath: path.basename(filePath),
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      trackingId: this.trackingId
    });

    try {
      // Validate file exists and is readable
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      if (fileStats.size === 0) {
        throw new Error('PDF file is empty');
      }

      if (fileStats.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('PDF file too large (max 50MB supported)');
      }

      console.log(`📖 Reading PDF: ${path.basename(filePath)}`);
      console.log(`   📊 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   🔐 Password protected: ${password ? 'Yes' : 'No'}`);

      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      casEventLogger.logInfo('PDF_FILE_LOADED', {
        filePath: path.basename(filePath),
        fileSize: fileStats.size,
        trackingId: this.trackingId
      });

      // Try multiple extraction methods
      let extractedText = '';
      let extractionMethod = '';
      let extractionError = null;

      // Method 1: Direct pdf-parse with password
      try {
        console.log(`   🔧 Attempting pdf-parse extraction...`);
        extractedText = await this.extractWithPdfParse(fileBuffer, password);
        extractionMethod = 'pdf-parse';
        console.log(`   ✅ pdf-parse extraction successful`);
      } catch (error) {
        extractionError = error;
        console.log(`   ❌ pdf-parse extraction failed: ${error.message}`);
      }

      // Method 2: Fallback for password-protected files
      if (!extractedText && password) {
        try {
          console.log(`   🔧 Attempting password fallback extraction...`);
          extractedText = await this.extractWithPasswordFallback(fileBuffer, password);
          extractionMethod = 'password-fallback';
          console.log(`   ✅ Password fallback extraction successful`);
        } catch (error) {
          console.log(`   ❌ Password fallback extraction failed: ${error.message}`);
        }
      }

      // Method 3: Try without password (for testing)
      if (!extractedText && !password) {
        try {
          console.log(`   🔧 Attempting extraction without password...`);
          extractedText = await this.extractWithPdfParse(fileBuffer, '');
          extractionMethod = 'no-password';
          console.log(`   ✅ No-password extraction successful`);
        } catch (error) {
          console.log(`   ❌ No-password extraction failed: ${error.message}`);
        }
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        const errorMsg = extractionError ? extractionError.message : 'No text could be extracted';
        throw new Error(`Failed to extract text from PDF: ${errorMsg}`);
      }

      // Clean and validate text
      const cleanedText = this.cleanExtractedText(extractedText);
      const readDuration = Date.now() - readStartTime;

      casEventLogger.logInfo('PDF_READ_SUCCESS', {
        filePath: path.basename(filePath),
        extractionMethod,
        textLength: cleanedText.length,
        readDuration: `${readDuration}ms`,
        trackingId: this.trackingId
      });

      console.log(`   📝 Text extracted: ${cleanedText.length} characters`);
      console.log(`   ⏱️  Read duration: ${readDuration}ms`);
      console.log(`   🛠️  Method: ${extractionMethod}`);

      logger.info('PDF read successfully', {
        filePath: path.basename(filePath),
        fileSize: fileStats.size,
        textLength: cleanedText.length,
        extractionMethod,
        readDuration,
        trackingId: this.trackingId
      });

      return cleanedText;
      
    } catch (error) {
      const readDuration = Date.now() - readStartTime;
      
      casEventLogger.logError('PDF_READ_FAILED', error, {
        filePath: path.basename(filePath),
        hasPassword: !!password,
        readDuration: `${readDuration}ms`,
        trackingId: this.trackingId
      });

      console.log(`❌ PDF reading failed after ${readDuration}ms`);
      
      logger.error('PDF reading failed:', {
        filePath: path.basename(filePath),
        error: error.message,
        hasPassword: !!password,
        readDuration,
        trackingId: this.trackingId
      });
      
      // Enhance error messages for better user experience
      if (error.message && error.message.toLowerCase().includes('password')) {
        if (password) {
          throw new Error('Incorrect password provided. Please verify the CAS password and try again.');
        } else {
          throw new Error('This PDF is password protected. Please provide the correct password.');
        }
      }
      
      if (error.message && error.message.toLowerCase().includes('invalid')) {
        throw new Error('Invalid or corrupted PDF file. Please ensure the file is a valid CAS document.');
      }
      
      throw new Error(`Failed to read PDF: ${error.message}`);
    }
  }

  /**
   * Extract text using pdf-parse library
   */
  async extractWithPdfParse(buffer, password) {
    const options = {
      max: 0, // Extract all pages
    };
    
    // Add password if provided
    if (password && password.trim() !== '') {
      options.password = password.trim();
    }
    
    try {
      const data = await pdfParse(buffer, options);
      
      if (!data || !data.text) {
        throw new Error('No text content found in PDF');
      }
      
      return data.text;
    } catch (error) {
      // Check for specific pdf-parse errors
      if (error.message && error.message.includes('Invalid password')) {
        throw new Error('Invalid password provided for PDF');
      }
      
      if (error.message && error.message.includes('password required')) {
        throw new Error('PDF requires a password');
      }
      
      throw error;
    }
  }

  /**
   * Fallback extraction method for password-protected files
   */
  async extractWithPasswordFallback(buffer, password) {
    // Try different password formats that might work
    const passwordVariants = [
      password,
      password.trim(),
      password.toUpperCase(),
      password.toLowerCase(),
    ];
    
    for (const variant of passwordVariants) {
      try {
        const options = { password: variant };
        const data = await pdfParse(buffer, options);
        
        if (data && data.text && data.text.trim().length > 0) {
          return data.text;
        }
      } catch (error) {
        // Continue to next variant
        continue;
      }
    }
    
    throw new Error('Unable to extract text with any password variant');
  }

  /**
   * Clean extracted text
   */
  cleanExtractedText(text) {
    if (!text) return '';
    
    // Remove excessive whitespace while preserving structure
    let cleaned = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Handle old Mac line endings
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .replace(/[ \t]{2,}/g, ' ') // Limit consecutive spaces/tabs
      .trim();
    
    // Ensure minimum content length
    if (cleaned.length < 50) {
      throw new Error('Extracted text is too short to be a valid CAS document');
    }
    
    return cleaned;
  }

  /**
   * Validate that text looks like a CAS document
   */
  validateCASText(text) {
    if (!text || text.length < 100) {
      return false;
    }
    
    const lowerText = text.toLowerCase();
    
    // Check for common CAS indicators
    const casIndicators = [
      'consolidated account statement',
      'cas',
      'demat',
      'mutual fund',
      'portfolio',
      'holding',
      'cdsl',
      'nsdl',
      'pan',
      'folio'
    ];
    
    const foundIndicators = casIndicators.filter(indicator => 
      lowerText.includes(indicator)
    );
    
    // Require at least 3 indicators for validation
    return foundIndicators.length >= 3;
  }

  /**
   * Get PDF metadata (for debugging)
   */
  async getPDFMetadata(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(fileBuffer);
      
      return {
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
        version: data.version
      };
    } catch (error) {
      logger.warn('Failed to get PDF metadata:', {
        filePath: path.basename(filePath),
        error: error.message
      });
      return null;
    }
  }

  /**
   * Check if PDF is password protected
   */
  async isPasswordProtected(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      await pdfParse(fileBuffer);
      return false; // No password required
    } catch (error) {
      if (error.message && (
        error.message.includes('password') || 
        error.message.includes('encrypted')
      )) {
        return true; // Password required
      }
      throw error; // Other error
    }
  }
}

module.exports = PDFReader;