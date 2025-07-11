const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/es5/build/pdf');
const { logger } = require('../../../utils/logger');

class PDFReader {
  constructor() {
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js');
  }

  /**
   * Read PDF file and extract text content
   * @param {string} filePath - Path to the PDF file
   * @param {string} password - Password for the PDF (if protected)
   * @returns {Promise<string>} - Extracted text content
   */
  async readPDF(filePath, password = '') {
    try {
      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: fileBuffer,
        password: password || undefined
      });
      
      const pdf = await loadingTask.promise;
      logger.info(`PDF loaded successfully. Total pages: ${pdf.numPages}`);
      
      // Extract text from all pages
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items and join them
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
        logger.debug(`Extracted text from page ${pageNum}`);
      }
      
      return fullText;
      
    } catch (error) {
      if (error.name === 'PasswordException') {
        throw new Error('PDF is password protected. Please provide the correct password.');
      }
      
      logger.error('Error reading PDF:', error.message);
      throw new Error(`Failed to read PDF: ${error.message}`);
    }
  }
}

module.exports = PDFReader; 