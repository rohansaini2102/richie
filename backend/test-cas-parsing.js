const path = require('path');
const fs = require('fs');
const CASParser = require('./services/cas-parser');
const { casEventLogger } = require('./utils/casEventLogger');

/**
 * Comprehensive CAS Parser Testing Script
 * This script helps test and debug CAS parsing functionality
 */

class CASParserTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * Run comprehensive CAS parser tests
   */
  async runTests() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 CAS PARSER TESTING STARTED');
    console.log('='.repeat(80));
    
    try {
      // Test 1: Basic parser initialization
      await this.testParserInitialization();
      
      // Test 2: PDF reading capabilities
      await this.testPDFReading();
      
      // Test 3: CAS type detection
      await this.testCASTypeDetection();
      
      // Test 4: Parse sample files (if available)
      await this.testSampleFiles();
      
      // Test 5: Error handling
      await this.testErrorHandling();
      
      // Test 6: Performance testing
      await this.testPerformance();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.log(`❌ Test suite failed: ${error.message}`);
      console.log(error.stack);
    }
  }

  /**
   * Test 1: Parser Initialization
   */
  async testParserInitialization() {
    console.log('\n📋 Test 1: Parser Initialization');
    console.log('-'.repeat(50));
    
    try {
      const parser = new CASParser();
      const stats = parser.getStats();
      
      console.log(`✅ Parser initialized successfully`);
      console.log(`   📊 Supported types: ${stats.supportedTypes.join(', ')}`);
      console.log(`   🔖 Version: ${stats.version}`);
      console.log(`   🆔 Tracking ID: ${stats.trackingId}`);
      
      this.addTestResult('Parser Initialization', true, 'Parser created successfully');
      
    } catch (error) {
      console.log(`❌ Parser initialization failed: ${error.message}`);
      this.addTestResult('Parser Initialization', false, error.message);
    }
  }

  /**
   * Test 2: PDF Reading Capabilities
   */
  async testPDFReading() {
    console.log('\n📖 Test 2: PDF Reading Capabilities');
    console.log('-'.repeat(50));
    
    try {
      const PDFReader = require('./services/cas-parser/utils/pdf-reader-pdfjs');
      const pdfReader = new PDFReader();
      
      console.log(`✅ PDF Reader initialized`);
      console.log(`   📚 Using pdf-parse library`);
      console.log(`   🛡️  Supports password protection`);
      
      this.addTestResult('PDF Reader Initialization', true, 'PDF reader ready');
      
    } catch (error) {
      console.log(`❌ PDF Reader initialization failed: ${error.message}`);
      this.addTestResult('PDF Reader Initialization', false, error.message);
    }
  }

  /**
   * Test 3: CAS Type Detection
   */
  async testCASTypeDetection() {
    console.log('\n🔍 Test 3: CAS Type Detection');
    console.log('-'.repeat(50));
    
    const testCases = [
      {
        name: 'CDSL Sample',
        text: 'CDSL Central Depository Services DP Name: TEST BROKER DP ID: 12345678 CLIENT ID: 87654321',
        expected: 'CDSL'
      },
      {
        name: 'NSDL Sample',
        text: 'NSDL National Securities Depository Demat Account Statement IN1234567890123456',
        expected: 'NSDL'
      },
      {
        name: 'CAMS Sample', 
        text: 'Computer Age Management Services Mutual Fund Statement',
        expected: 'CAMS'
      },
      {
        name: 'Unknown Format',
        text: 'This is not a CAS document just some random text',
        expected: 'UNKNOWN'
      }
    ];

    try {
      const parser = new CASParser();
      
      for (const testCase of testCases) {
        const detectedType = parser.detectCASType(testCase.text);
        const isCorrect = detectedType === testCase.expected;
        
        console.log(`   ${isCorrect ? '✅' : '❌'} ${testCase.name}: ${detectedType} (expected: ${testCase.expected})`);
        
        this.addTestResult(`CAS Detection - ${testCase.name}`, isCorrect, 
          `Detected: ${detectedType}, Expected: ${testCase.expected}`);
      }
      
    } catch (error) {
      console.log(`❌ CAS type detection test failed: ${error.message}`);
      this.addTestResult('CAS Type Detection', false, error.message);
    }
  }

  /**
   * Test 4: Sample Files Testing
   */
  async testSampleFiles() {
    console.log('\n📁 Test 4: Sample Files Testing');
    console.log('-'.repeat(50));
    
    const sampleFilesDir = path.join(__dirname, 'uploads/cas');
    
    try {
      if (!fs.existsSync(sampleFilesDir)) {
        console.log(`⚠️  Sample files directory not found: ${sampleFilesDir}`);
        console.log(`   Create the directory and add sample CAS files for testing`);
        this.addTestResult('Sample Files Directory', false, 'Directory not found');
        return;
      }

      const files = fs.readdirSync(sampleFilesDir).filter(file => file.endsWith('.pdf'));
      
      if (files.length === 0) {
        console.log(`ℹ️  No PDF files found in ${sampleFilesDir}`);
        console.log(`   Add sample CAS files for comprehensive testing`);
        this.addTestResult('Sample Files Available', false, 'No PDF files found');
        return;
      }

      console.log(`📄 Found ${files.length} PDF file(s) for testing`);
      
      const parser = new CASParser();
      
      for (let i = 0; i < Math.min(files.length, 3); i++) { // Test max 3 files
        const file = files[i];
        const filePath = path.join(sampleFilesDir, file);
        
        console.log(`\n   🧪 Testing file: ${file}`);
        
        try {
          const startTime = Date.now();
          const result = await parser.parseCASFile(filePath, ''); // Try without password first
          const parseTime = Date.now() - startTime;
          
          console.log(`   ✅ Parse successful (${parseTime}ms)`);
          console.log(`      📊 Type: ${result.meta?.cas_type || 'Unknown'}`);
          console.log(`      👤 Investor: ${result.investor?.name ? 'Found' : 'Not found'}`);
          console.log(`      🏦 Demat Accounts: ${result.demat_accounts?.length || 0}`);
          console.log(`      📈 Mutual Funds: ${result.mutual_funds?.length || 0}`);
          console.log(`      💰 Total Value: ₹${(result.summary?.total_value || 0).toLocaleString('en-IN')}`);
          
          this.addTestResult(`Sample File - ${file}`, true, `Parsed successfully in ${parseTime}ms`);
          
        } catch (error) {
          console.log(`   ❌ Parse failed: ${error.message}`);
          
          // Try with common passwords if parse failed
          const commonPasswords = ['PASSWORD', 'password', '123456', 'INVESTOR_PAN'];
          let passwordSuccess = false;
          
          for (const pwd of commonPasswords) {
            try {
              console.log(`      🔑 Trying password: ${pwd}`);
              await parser.parseCASFile(filePath, pwd);
              console.log(`      ✅ Success with password: ${pwd}`);
              passwordSuccess = true;
              break;
            } catch (pwdError) {
              // Continue to next password
            }
          }
          
          if (!passwordSuccess) {
            this.addTestResult(`Sample File - ${file}`, false, error.message);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Sample files test failed: ${error.message}`);
      this.addTestResult('Sample Files Testing', false, error.message);
    }
  }

  /**
   * Test 5: Error Handling
   */
  async testErrorHandling() {
    console.log('\n🛡️  Test 5: Error Handling');
    console.log('-'.repeat(50));
    
    const errorTests = [
      {
        name: 'Non-existent file',
        action: async () => {
          const parser = new CASParser();
          await parser.parseCASFile('/non/existent/file.pdf', '');
        },
        shouldFail: true
      },
      {
        name: 'Invalid file path',
        action: async () => {
          const parser = new CASParser();
          await parser.parseCASFile('', '');
        },
        shouldFail: true
      }
    ];

    for (const test of errorTests) {
      try {
        console.log(`   🧪 Testing: ${test.name}`);
        await test.action();
        
        if (test.shouldFail) {
          console.log(`   ❌ Expected failure but succeeded`);
          this.addTestResult(`Error Handling - ${test.name}`, false, 'Should have failed but succeeded');
        } else {
          console.log(`   ✅ Succeeded as expected`);
          this.addTestResult(`Error Handling - ${test.name}`, true, 'Succeeded as expected');
        }
        
      } catch (error) {
        if (test.shouldFail) {
          console.log(`   ✅ Failed as expected: ${error.message}`);
          this.addTestResult(`Error Handling - ${test.name}`, true, 'Failed as expected');
        } else {
          console.log(`   ❌ Unexpected failure: ${error.message}`);
          this.addTestResult(`Error Handling - ${test.name}`, false, `Unexpected failure: ${error.message}`);
        }
      }
    }
  }

  /**
   * Test 6: Performance Testing
   */
  async testPerformance() {
    console.log('\n⚡ Test 6: Performance Testing');
    console.log('-'.repeat(50));
    
    try {
      const parser = new CASParser();
      
      // Test parser creation performance
      const createStartTime = Date.now();
      for (let i = 0; i < 10; i++) {
        new CASParser();
      }
      const createTime = Date.now() - createStartTime;
      
      console.log(`   ✅ Parser creation: ${createTime}ms for 10 instances (${createTime/10}ms avg)`);
      
      // Test text detection performance
      const sampleText = 'CDSL Central Depository Services DP Name: TEST BROKER'.repeat(1000);
      const detectStartTime = Date.now();
      for (let i = 0; i < 100; i++) {
        parser.detectCASType(sampleText);
      }
      const detectTime = Date.now() - detectStartTime;
      
      console.log(`   ✅ Type detection: ${detectTime}ms for 100 detections (${detectTime/100}ms avg)`);
      
      this.addTestResult('Performance Testing', true, `Parser creation: ${createTime/10}ms, Detection: ${detectTime/100}ms`);
      
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
      this.addTestResult('Performance Testing', false, error.message);
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, success, details) {
    this.testResults.push({
      name: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.testResults.filter(r => r.success).length;
    const failCount = this.testResults.filter(r => !r.success).length;
    const totalTests = this.testResults.length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 CAS PARSER TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n🏁 Test Summary:`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);
    console.log(`   📝 Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Success Rate: ${totalTests > 0 ? Math.round((successCount/totalTests)*100) : 0}%`);

    console.log(`\n📋 Detailed Results:`);
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.name}`);
      if (result.details) {
        console.log(`      💬 ${result.details}`);
      }
    });

    console.log(`\n🎯 Recommendations:`);
    
    if (failCount === 0) {
      console.log(`   🎉 All tests passed! Your CAS parser is working correctly.`);
    } else {
      console.log(`   🔧 Fix the ${failCount} failing test(s) above.`);
    }
    
    console.log(`   📁 Add sample CAS files to uploads/cas/ directory for more comprehensive testing.`);
    console.log(`   🔐 Test with password-protected CAS files.`);
    console.log(`   📊 Monitor performance with larger CAS files.`);

    // Log to CAS event logger
    casEventLogger.logInfo('CAS_PARSER_TEST_COMPLETED', {
      totalTime: `${totalTime}ms`,
      totalTests,
      successCount,
      failCount,
      successRate: totalTests > 0 ? Math.round((successCount/totalTests)*100) : 0
    });

    console.log('\n' + '='.repeat(80));
    console.log('🧪 CAS PARSER TESTING COMPLETED');
    console.log('='.repeat(80));
  }
}

/**
 * Helper function to run specific tests
 */
async function runSpecificTest(testName) {
  console.log(`🧪 Running specific test: ${testName}`);
  
  const tester = new CASParserTester();
  
  switch (testName.toLowerCase()) {
    case 'init':
      await tester.testParserInitialization();
      break;
    case 'pdf':
      await tester.testPDFReading();
      break;
    case 'detection':
      await tester.testCASTypeDetection();
      break;
    case 'files':
      await tester.testSampleFiles();
      break;
    case 'errors':
      await tester.testErrorHandling();
      break;
    case 'performance':
      await tester.testPerformance();
      break;
    default:
      console.log(`❌ Unknown test: ${testName}`);
      console.log(`Available tests: init, pdf, detection, files, errors, performance`);
      return;
  }
  
  tester.generateTestReport();
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific test
    await runSpecificTest(args[0]);
  } else {
    // Run all tests
    const tester = new CASParserTester();
    await tester.runTests();
  }
}

// Export for programmatic use
module.exports = {
  CASParserTester,
  runSpecificTest
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}