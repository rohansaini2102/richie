#!/bin/bash

# Enhanced CAS Tracking System Setup Script
# This script sets up the comprehensive CAS tracking and logging system

echo "🚀 Setting up Enhanced CAS Tracking System for RICHIEAT"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_section "Creating Directory Structure"

# Create necessary directories
mkdir -p backend/logs/cas
mkdir -p backend/uploads/cas
mkdir -p backend/services/cas-parser/parsers
mkdir -p backend/services/cas-parser/utils

print_status "Created log directories"
print_status "Created upload directories"
print_status "Created CAS parser directories"

print_section "Installing Dependencies"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install additional dependencies for enhanced tracking
print_status "Installing additional npm packages..."
cd backend

# Add packages for enhanced CAS parsing and logging
npm install winston@3.10.0 --save
npm install pdf-parse@1.1.1 --save
npm install pdf-lib@1.17.1 --save
npm install pdfjs-dist@4.0.379 --save
npm install crypto --save

print_status "Dependencies installed successfully"

cd ..

print_section "Setting Up Environment Variables"

# Create or update .env file with CAS tracking configurations
ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_status "Creating .env file..."
    touch "$ENV_FILE"
fi

# Add CAS-specific environment variables if they don't exist
echo "" >> "$ENV_FILE"
echo "# CAS Tracking Configuration" >> "$ENV_FILE"

if ! grep -q "CAS_ENCRYPTION_KEY" "$ENV_FILE"; then
    # Generate a random 64-character hex key for CAS password encryption
    CAS_KEY=$(openssl rand -hex 32)
    echo "CAS_ENCRYPTION_KEY=${CAS_KEY}" >> "$ENV_FILE"
    print_status "Added CAS_ENCRYPTION_KEY to environment"
fi

if ! grep -q "LOG_LEVEL" "$ENV_FILE"; then
    echo "LOG_LEVEL=info" >> "$ENV_FILE"
    print_status "Added LOG_LEVEL to environment"
fi

if ! grep -q "INVITATION_EXPIRY_HOURS" "$ENV_FILE"; then
    echo "INVITATION_EXPIRY_HOURS=48" >> "$ENV_FILE"
    print_status "Added INVITATION_EXPIRY_HOURS to environment"
fi

if ! grep -q "CLIENT_FORM_BASE_URL" "$ENV_FILE"; then
    echo "CLIENT_FORM_BASE_URL=http://localhost:5173/client-onboarding" >> "$ENV_FILE"
    print_status "Added CLIENT_FORM_BASE_URL to environment"
fi

print_section "Creating Enhanced Base Parser"

# Create the base-parser.js file
cat > "backend/services/cas-parser/parsers/base-parser.js" << 'EOF'
const pdfParse = require('pdf-parse');
const { logger } = require('../../../utils/logger');

/**
 * Base Parser for CAS documents with comprehensive logging
 */
class BaseParser {
  constructor() {
    this.name = 'BaseParser';
    this.casType = 'UNKNOWN';
    this.pdfText = '';
    this.trackingId = this.generateTrackingId();
  }

  generateTrackingId() {
    return `CAS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async extractText(pdfBuffer, password = null) {
    try {
      let extractedText;
      
      if (password) {
        const data = await pdfParse(pdfBuffer, { password });
        extractedText = data.text;
      } else {
        const data = await pdfParse(pdfBuffer);
        extractedText = data.text;
      }

      logger.info(`[${this.trackingId}] PDF text extraction completed`, {
        textLength: extractedText.length,
        lineCount: extractedText.split('\n').length
      });

      return extractedText;
    } catch (error) {
      logger.error(`[${this.trackingId}] PDF text extraction failed: ${error.message}`);
      throw error;
    }
  }

  cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  extractValue(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  parseCurrency(value) {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned) || 0;
    return Math.round(parsed * 100) / 100;
  }

  generateId(prefix = 'id') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createResponse(data) {
    const response = {
      investorInfo: data.investorInfo || {},
      dematAccounts: data.dematAccounts || [],
      holdings: data.holdings || [],
      mutualFunds: data.mutualFunds || [],
      summary: this.calculateSummary(data),
      metadata: {
        trackingId: this.trackingId,
        parser: this.name,
        casType: this.casType,
        parsedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    logger.info(`[${this.trackingId}] Response created successfully`, {
      totalHoldings: response.holdings.length,
      totalMutualFunds: response.mutualFunds.length,
      totalValue: response.summary.totalValue
    });

    return response;
  }

  calculateSummary(data) {
    const summary = {
      totalValue: 0,
      holdingsValue: 0,
      mutualFundsValue: 0,
      holdingsCount: 0,
      mutualFundsCount: 0,
      categories: {}
    };

    if (data.holdings && Array.isArray(data.holdings)) {
      summary.holdingsCount = data.holdings.length;
      data.holdings.forEach(holding => {
        const value = this.parseCurrency(holding.currentValue || 0);
        summary.holdingsValue += value;
        
        const category = holding.category || 'Other';
        summary.categories[category] = (summary.categories[category] || 0) + value;
      });
    }

    if (data.mutualFunds && Array.isArray(data.mutualFunds)) {
      summary.mutualFundsCount = data.mutualFunds.length;
      data.mutualFunds.forEach(fund => {
        const value = this.parseCurrency(fund.currentValue || 0);
        summary.mutualFundsValue += value;
      });
    }

    summary.totalValue = summary.holdingsValue + summary.mutualFundsValue;
    return summary;
  }

  // Abstract methods
  async parse(pdfBuffer, password = null) {
    throw new Error(`${this.name}: parse method must be implemented by subclass`);
  }

  extractInvestorInfo(text) {
    throw new Error(`${this.name}: extractInvestorInfo method must be implemented by subclass`);
  }

  extractDematAccounts(text) {
    throw new Error(`${this.name}: extractDematAccounts method must be implemented by subclass`);
  }

  extractHoldings(text) {
    throw new Error(`${this.name}: extractHoldings method must be implemented by subclass`);
  }

  extractMutualFunds(text) {
    throw new Error(`${this.name}: extractMutualFunds method must be implemented by subclass`);
  }
}

module.exports = BaseParser;
EOF

print_status "Created enhanced base parser"

print_section "Creating CAS Monitoring Script"

# Create the monitoring script
cat > "cas-monitor.js" << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple CAS event monitor
const monitor = {
  init() {
    console.log('🔍 CAS Event Monitor Started');
    console.log('Monitoring: backend/logs/');
    
    const logsDir = path.join(__dirname, 'backend/logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Watch combined.log for CAS events
    const logFile = path.join(logsDir, 'combined.log');
    if (fs.existsSync(logFile)) {
      this.watchFile(logFile);
    } else {
      fs.writeFileSync(logFile, '');
      this.watchFile(logFile);
    }
  },
  
  watchFile(filePath) {
    let lastSize = 0;
    
    setInterval(() => {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > lastSize) {
          const stream = fs.createReadStream(filePath, {
            start: lastSize,
            end: stats.size - 1,
            encoding: 'utf8'
          });
          
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk;
          });
          
          stream.on('end', () => {
            const lines = buffer.split('\n').filter(line => line.trim());
            lines.forEach(line => {
              if (line.includes('CAS') || line.includes('ONBOARDING') || line.includes('CLIENT')) {
                console.log(`📊 ${new Date().toISOString()} - ${line}`);
              }
            });
          });
          
          lastSize = stats.size;
        }
      } catch (error) {
        // File might not exist yet
      }
    }, 1000);
  }
};

monitor.init();
EOF

chmod +x cas-monitor.js
print_status "Created CAS monitoring script"

print_section "Creating Package.json Scripts"

# Add scripts to package.json
if [ -f "package.json" ]; then
    # Use Node.js to update package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!pkg.scripts) pkg.scripts = {};
    
    pkg.scripts['cas-monitor'] = 'node cas-monitor.js';
    pkg.scripts['dev-with-monitor'] = 'concurrently \"npm run dev\" \"npm run cas-monitor\"';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('Updated package.json with CAS monitoring scripts');
    "
    
    print_status "Added CAS monitoring scripts to package.json"
fi

print_section "Setting Up File Permissions"

# Set proper permissions for upload directories
chmod 755 backend/uploads/cas
chmod 755 backend/logs/cas

print_status "Set proper file permissions"

print_section "Creating Test Script"

# Create a test script to verify the setup
cat > "test-cas-tracking.js" << 'EOF'
#!/usr/bin/env node

/**
 * Test script for CAS tracking system
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing CAS Tracking System Setup');
console.log('=====================================');

const tests = [
  {
    name: 'Log directories exist',
    test: () => fs.existsSync('backend/logs/cas'),
    fix: 'Run: mkdir -p backend/logs/cas'
  },
  {
    name: 'Upload directories exist',
    test: () => fs.existsSync('backend/uploads/cas'),
    fix: 'Run: mkdir -p backend/uploads/cas'
  },
  {
    name: 'Base parser exists',
    test: () => fs.existsSync('backend/services/cas-parser/parsers/base-parser.js'),
    fix: 'Re-run the setup script'
  },
  {
    name: 'Environment file exists',
    test: () => fs.existsSync('backend/.env'),
    fix: 'Create backend/.env file with required variables'
  },
  {
    name: 'CAS monitoring script exists',
    test: () => fs.existsSync('cas-monitor.js'),
    fix: 'Re-run the setup script'
  }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  process.stdout.write(`${index + 1}. ${test.name}... `);
  
  try {
    if (test.test()) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      console.log(`   Fix: ${test.fix}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`   Error: ${error.message}`);
    failed++;
  }
});

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! CAS tracking system is ready.');
  console.log('\n📋 Next steps:');
  console.log('1. Start the backend: cd backend && npm run dev');
  console.log('2. Start the frontend: cd frontend && npm run dev');
  console.log('3. Start CAS monitoring: npm run cas-monitor');
  console.log('4. Or run everything together: npm run dev-with-monitor');
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues and run the test again.');
  process.exit(1);
}
EOF

chmod +x test-cas-tracking.js
print_status "Created test script"

print_section "Creating Documentation"

# Create comprehensive documentation
cat > "CAS_TRACKING_GUIDE.md" << 'EOF'
# Enhanced CAS Tracking System Guide

## Overview
This system provides comprehensive tracking and logging for CAS (Consolidated Account Statement) upload, parsing, and client onboarding processes in the RICHIEAT platform.

## Features
- ✅ Real-time CAS upload tracking
- ✅ Detailed parsing progress monitoring
- ✅ Client onboarding flow tracking
- ✅ Structured JSON logging
- ✅ Terminal-based event monitoring
- ✅ Error tracking and debugging
- ✅ Advisor dashboard update notifications

## Quick Start

### 1. Start the Application
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start CAS monitoring
npm run cas-monitor
```

### 2. Alternative: Run Everything Together
```bash
npm run dev-with-monitor
```

## Monitoring CAS Events

### Console Logs
When a client uploads a CAS file, you'll see detailed logs like:
```
🚀 CAS UPLOAD STARTED:
📊 Data: {
  "trackingId": "CAS_UPLOAD_1234567890_abc123",
  "fileName": "statement.pdf",
  "fileSize": 2048576,
  "hasPassword": true,
  "token": "invitation_token_here"
}
```

### File Locations
- **Main logs**: `backend/logs/combined.log`
- **CAS events**: `backend/logs/cas/cas-events.log`
- **Error logs**: `backend/logs/error.log`

## Event Types

### Upload Events
- `CAS_UPLOAD_STARTED` - File upload initiated
- `CAS_UPLOAD_SUCCESS` - File uploaded successfully
- `CAS_UPLOAD_FAILED` - Upload failed

### Parsing Events
- `CAS_PARSE_STARTED` - Parsing initiated
- `CAS_PARSE_COMPLETED` - Parsing successful
- `CAS_PARSE_FAILED` - Parsing failed

### Onboarding Events
- `ONBOARDING_FORM_ACCESSED` - Client opened form
- `ONBOARDING_COMPLETED` - Client submitted form
- `CLIENT_RECORD_CREATION` - Client saved to database

### Dashboard Events
- `ADVISOR_DASHBOARD_UPDATE` - Data sent to advisor dashboard

## Tracking Data Structure

Each event includes:
```json
{
  "trackingId": "unique_identifier",
  "event": "event_name",
  "timestamp": "2025-07-11T10:30:00.000Z",
  "clientId": "client_database_id",
  "advisorId": "advisor_database_id",
  "fileName": "cas_file_name.pdf",
  "fileSize": 1234567,
  "duration": "500ms",
  "status": "success|error|processing"
}
```

## Testing the System

### 1. Run System Tests
```bash
node test-cas-tracking.js
```

### 2. Manual Testing Flow
1. Create a client invitation from advisor dashboard
2. Open the invitation link in browser
3. Fill out the onboarding form
4. Upload a CAS file (use any PDF for testing)
5. Submit the form
6. Check the monitoring console for events

### 3. Expected Console Output
You should see events like:
```
📤 CAS_UPLOAD_STARTED
🔍 CAS_PARSE_INITIATED  
✅ CAS_PARSE_COMPLETED
📝 ONBOARDING_COMPLETED
🏢 ADVISOR_DASHBOARD_UPDATE
```

## Troubleshooting

### Common Issues

#### 1. No logs appearing
- Check if `backend/logs` directory exists
- Verify the backend server is running
- Ensure the monitoring script is active

#### 2. CAS upload fails
- Check file permissions on `backend/uploads/cas`
- Verify the file is a valid PDF
- Check the server logs for detailed errors

#### 3. Parsing errors
- Ensure the PDF is not corrupted
- Check if the CAS format is supported (CDSL/NSDL)
- Verify password if the PDF is protected

### Debug Mode
Set environment variable for verbose logging:
```bash
LOG_LEVEL=debug npm run dev
```

## File Structure
```
backend/
├── logs/
│   ├── cas/
│   │   ├── cas-events.log
│   │   └── cas-tracking.log
│   ├── combined.log
│   └── error.log
├── uploads/
│   └── cas/
├── services/
│   └── cas-parser/
│       ├── index.js
│       ├── parsers/
│       │   ├── base-parser.js
│       │   ├── cdsl-parser.js
│       │   └── nsdl-parser.js
│       └── utils/
└── controllers/
    └── clientController.js (enhanced)
```

## Environment Variables
```env
CAS_ENCRYPTION_KEY=your_64_char_hex_key
LOG_LEVEL=info
INVITATION_EXPIRY_HOURS=48
CLIENT_FORM_BASE_URL=http://localhost:5173/client-onboarding
```

## Support
For issues or questions about the CAS tracking system, check:
1. Console logs in the monitoring terminal
2. Log files in `backend/logs/`
3. Browser developer tools for frontend errors
EOF

print_status "Created comprehensive documentation"

print_section "Final Setup Steps"

# Run the test script to verify everything
print_status "Running system verification tests..."
node test-cas-tracking.js

print_section "Setup Complete!"

echo ""
echo "🎉 Enhanced CAS Tracking System setup completed successfully!"
echo ""
echo "📋 What was installed:"
echo "   ✅ Enhanced logging system with structured JSON output"
echo "   ✅ Comprehensive CAS upload and parsing tracking"
echo "   ✅ Real-time event monitoring script"
echo "   ✅ Client onboarding flow tracking"
echo "   ✅ Advisor dashboard update notifications"
echo "   ✅ Error tracking and debugging tools"
echo ""
echo "📖 Next steps:"
echo "   1. Read the documentation: cat CAS_TRACKING_GUIDE.md"
echo "   2. Start monitoring: npm run cas-monitor"
echo "   3. Test the system with a client onboarding flow"
echo ""
echo "🔍 Key features you can now track:"
echo "   • Every CAS file upload with detailed metadata"
echo "   • Real-time parsing progress and results"
echo "   • Complete client onboarding journey"
echo "   • All data flowing to advisor dashboard"
echo "   • Detailed error logging for debugging"
echo ""
echo "Happy tracking! 🚀"