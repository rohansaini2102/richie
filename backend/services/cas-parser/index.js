const fs = require('fs');
const path = require('path');
const PDFReader = require('./utils/pdf-reader-pdfjs');
const CDSLParser = require('./parsers/cdsl-parser');
const NSDLParser = require('./parsers/nsdl-parser');
const JSONFormatter = require('./utils/json-formatter');
const { logger } = require('../../utils/logger');
const { casEventLogger } = require('../../utils/casEventLogger');

class CASParser {
  constructor() {
    this.pdfReader = new PDFReader();
    this.formatter = new JSONFormatter();
    this.parsers = {
      'CDSL': CDSLParser,
      'NSDL': NSDLParser
      // Future parsers can be added here
      // 'CAMS': CAMSParser,
      // 'KFINTECH': KFintechParser
    };
    this.trackingId = this.generateTrackingId();
  }

  /**
   * Generate unique tracking ID for this parsing session
   */
  generateTrackingId() {
    return `CAS_SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Parse a CAS PDF file - Main entry point
   * @param {string} filePath - Path to the PDF file
   * @param {string} password - Password for the PDF (if protected)
   * @returns {Promise<Object>} - Parsed data in standardized format
   */
  async parseCASFile(filePath, password = '') {
    const parseStartTime = Date.now();
    const eventId = casEventLogger.logInfo('CAS_PARSER_MAIN_STARTED', {
      filePath: path.basename(filePath),
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      trackingId: this.trackingId
    });

    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`CAS file not found: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      casEventLogger.logInfo('CAS_FILE_VALIDATION_SUCCESS', {
        filePath: path.basename(filePath),
        fileSize: fileStats.size,
        fileModified: fileStats.mtime.toISOString(),
        trackingId: this.trackingId,
        eventId
      });

      console.log(`\n🚀 CAS PARSING STARTED`);
      console.log(`📁 File: ${path.basename(filePath)}`);
      console.log(`📊 Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🔒 Password Protected: ${password ? 'Yes' : 'No'}`);
      console.log(`🆔 Tracking ID: ${this.trackingId}`);

      // Step 1: Extract text from PDF
      casEventLogger.logInfo('CAS_PDF_TEXT_EXTRACTION_STARTED', {
        trackingId: this.trackingId,
        eventId
      });

      const pdfText = await this.pdfReader.readPDF(filePath, password);
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('Failed to extract text from PDF. The PDF might be corrupted, password protected, or in an unsupported format.');
      }

      casEventLogger.logInfo('CAS_PDF_TEXT_EXTRACTION_SUCCESS', {
        textLength: pdfText.length,
        lineCount: pdfText.split('\n').length,
        wordCount: pdfText.split(/\s+/).length,
        trackingId: this.trackingId,
        eventId
      });

      console.log(`✅ PDF text extracted successfully`);
      console.log(`📝 Text length: ${pdfText.length} characters`);
      console.log(`📄 Lines: ${pdfText.split('\n').length}`);

      // Step 2: Detect CAS type
      const casType = this.detectCASType(pdfText);
      
      casEventLogger.logInfo('CAS_TYPE_DETECTION_COMPLETED', {
        casType,
        trackingId: this.trackingId,
        eventId
      });

      console.log(`🔍 Detected CAS Type: ${casType}`);
      
      if (casType === 'UNKNOWN') {
        console.log(`❌ Unknown CAS format detected`);
        console.log(`📄 Text preview:`, pdfText.substring(0, 500));
        throw new Error('Unknown CAS format. Currently supported: CDSL, NSDL. Please check if this is a valid CAS document.');
      }

      // Step 3: Get appropriate parser
      const ParserClass = this.parsers[casType];
      if (!ParserClass) {
        throw new Error(`Parser not implemented for CAS type: ${casType}. Available parsers: ${Object.keys(this.parsers).join(', ')}`);
      }

      // Step 4: Parse the document
      const parser = new ParserClass();
      
      casEventLogger.logInfo('CAS_DOCUMENT_PARSING_STARTED', {
        casType,
        parserClass: ParserClass.name,
        trackingId: this.trackingId,
        eventId
      });

      console.log(`🔧 Using ${casType} parser...`);
      
      const parsedData = await parser.parse(pdfText, password);
      
      casEventLogger.logInfo('CAS_DOCUMENT_PARSING_SUCCESS', {
        casType,
        hasInvestorInfo: !!parsedData.investor,
        dematAccountsCount: parsedData.demat_accounts?.length || 0,
        holdingsCount: parsedData.holdings?.length || 0,
        mutualFundsCount: parsedData.mutual_funds?.length || 0,
        trackingId: this.trackingId,
        eventId
      });

      // Step 5: Format the output
      const formattedData = this.formatter.format(parsedData);
      
      // Step 6: Add metadata
      formattedData.meta = {
        ...formattedData.meta,
        trackingId: this.trackingId,
        filePath: path.basename(filePath),
        fileSize: fileStats.size,
        parseTime: Date.now() - parseStartTime,
        casType: casType,
        generated_at: new Date().toISOString(),
        parser_version: '2.0.0'
      };

      const totalParseTime = Date.now() - parseStartTime;

      casEventLogger.logInfo('CAS_PARSING_COMPLETED_SUCCESSFULLY', {
        casType,
        totalParseTime: `${totalParseTime}ms`,
        totalValue: formattedData.summary?.total_value || 0,
        trackingId: this.trackingId,
        eventId
      });

      console.log(`🎉 CAS parsing completed successfully!`);
      console.log(`⏱️  Total time: ${totalParseTime}ms`);
      console.log(`💰 Total portfolio value: ₹${(formattedData.summary?.total_value || 0).toLocaleString('en-IN')}`);
      console.log(`🏦 Demat accounts: ${formattedData.demat_accounts?.length || 0}`);
      console.log(`📊 Mutual funds: ${formattedData.mutual_funds?.length || 0}`);

      // Log success with full details
      logger.info('CAS parsing completed successfully', {
        filePath: path.basename(filePath),
        casType,
        totalParseTime,
        trackingId: this.trackingId,
        summary: {
          totalValue: formattedData.summary?.total_value || 0,
          dematAccounts: formattedData.demat_accounts?.length || 0,
          mutualFunds: formattedData.mutual_funds?.length || 0,
          investor: {
            name: formattedData.investor?.name ? '***EXTRACTED***' : 'NOT_FOUND',
            pan: formattedData.investor?.pan ? '***EXTRACTED***' : 'NOT_FOUND'
          }
        }
      });

      return formattedData;
      
    } catch (error) {
      const totalParseTime = Date.now() - parseStartTime;
      
      casEventLogger.logError('CAS_PARSING_FAILED', error, {
        filePath: path.basename(filePath),
        hasPassword: !!password,
        totalParseTime: `${totalParseTime}ms`,
        trackingId: this.trackingId,
        eventId
      });

      console.log(`❌ CAS parsing failed after ${totalParseTime}ms`);
      console.log(`💥 Error: ${error.message}`);
      
      // Log error with context
      logger.error('CAS parsing failed:', {
        filePath: path.basename(filePath),
        error: error.message,
        hasPassword: !!password,
        trackingId: this.trackingId,
        stack: error.stack,
        totalParseTime
      });
      
      // Provide better error messages for common issues
      if (error.message && error.message.toLowerCase().includes('password')) {
        throw new Error(`Password error: ${error.message}. Please verify the CAS password is correct.`);
      }
      
      if (error.message && error.message.toLowerCase().includes('corrupted')) {
        throw new Error(`File error: ${error.message}. Please ensure the PDF file is not corrupted.`);
      }
      
      throw new Error(`CAS parsing failed: ${error.message}`);
    }
  }

  /**
   * Detect the type of CAS document
   * @param {string} text - PDF text content
   * @returns {string} - CAS type
   */
  detectCASType(text) {
    const cleanText = text.toLowerCase();
    
    console.log(`🔍 Analyzing CAS document type...`);
    
    // CDSL Detection - Enhanced patterns
    const cdslPatterns = [
      'cdsl',
      'central depository services',
      'dp name',
      'dp id',
      'bo id'
    ];
    
    const cdslMatches = cdslPatterns.filter(pattern => cleanText.includes(pattern));
    
    // NSDL Detection - Enhanced patterns  
    const nsdlPatterns = [
      'nsdl',
      'national securities depository',
      'demat account statement'
    ];
    
    const nsdlMatches = nsdlPatterns.filter(pattern => cleanText.includes(pattern));
    
    // CAMS Detection
    const camsPatterns = [
      'computer age management services',
      'cams',
      'mutual fund statement'
    ];
    
    const camsMatches = camsPatterns.filter(pattern => cleanText.includes(pattern));
    
    // KFintech Detection
    const kfintechPatterns = [
      'kfintech',
      'karvy'
    ];
    
    const kfintechMatches = kfintechPatterns.filter(pattern => cleanText.includes(pattern));
    
    console.log(`📊 Pattern matches:`);
    console.log(`   CDSL: ${cdslMatches.length}/5 patterns`);
    console.log(`   NSDL: ${nsdlMatches.length}/3 patterns`);
    console.log(`   CAMS: ${camsMatches.length}/3 patterns`);
    console.log(`   KFintech: ${kfintechMatches.length}/2 patterns`);
    
    // Determine CAS type based on strongest match
    if (cdslMatches.length >= 2) {
      return 'CDSL';
    } else if (nsdlMatches.length >= 1) {
      return 'NSDL';
    } else if (camsMatches.length >= 1) {
      return 'CAMS';
    } else if (kfintechMatches.length >= 1) {
      return 'KFINTECH';
    }
    
    // Additional fallback detection
    if (cleanText.includes('demat') && cleanText.includes('account')) {
      console.log(`⚠️  Fallback detection: Generic demat account detected, defaulting to CDSL`);
      return 'CDSL';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Save parsed data to JSON file (for debugging)
   * @param {Object} data - Parsed data
   * @param {string} outputPath - Output file path
   */
  async saveToFile(data, outputPath) {
    try {
      const jsonContent = this.formatter.prettyPrint(data);
      fs.writeFileSync(outputPath, jsonContent, 'utf8');
      
      casEventLogger.logInfo('CAS_OUTPUT_SAVED', {
        outputPath: path.basename(outputPath),
        dataSize: jsonContent.length,
        trackingId: this.trackingId
      });
      
      console.log(`💾 Output saved to: ${outputPath}`);
    } catch (error) {
      casEventLogger.logError('CAS_OUTPUT_SAVE_FAILED', error, {
        outputPath: path.basename(outputPath),
        trackingId: this.trackingId
      });
      
      console.error('❌ Error saving output:', error.message);
      throw error;
    }
  }

  /**
   * Get parser statistics
   */
  getStats() {
    return {
      trackingId: this.trackingId,
      supportedTypes: Object.keys(this.parsers),
      version: '2.0.0'
    };
  }
}

module.exports = CASParser;