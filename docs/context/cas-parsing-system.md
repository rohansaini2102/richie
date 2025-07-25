# CAS Parsing System Overview

## Dual Parsing Architecture
RichieAI implements both backend and frontend CAS parsing capabilities for maximum flexibility.

## Backend CAS Parser

### Main Parser (backend/services/cas-parser/index.js)
- **Multi-format support**: CDSL, NSDL, CAMS, Karvy
- **Intelligent format detection**: Auto-detects CAS type from content
- **Password handling**: Supports encrypted PDF files
- **Error handling**: Comprehensive error recovery
- **Performance tracking**: Parsing time and success rate monitoring

### PDF Reader (backend/services/cas-parser/utils/pdf-reader-pdfjs.js)
- **334 lines** of advanced PDF processing
- **Multiple extraction methods**: pdf-parse with fallbacks
- **Password variants**: Tries different password formats
- **File validation**: Size, existence, and corruption checks
- **Performance optimization**: 50MB file size limit
- **Detailed logging**: Every step tracked with event IDs

### JSON Formatter (backend/services/cas-parser/utils/json-formatter.js)
- **525 lines** of data formatting logic
- **Standardized output**: Consistent JSON structure
- **Data validation**: Ensures data integrity
- **Type conversion**: Handles strings, numbers, dates
- **Error recovery**: Graceful handling of malformed data

### Supported Formats

#### CDSL (Central Depository Services Limited)
- **Detection patterns**: "CDSL", "Central Depository", "DP Name", "DP ID"
- **Data extraction**: Demat accounts, holdings, transactions
- **Account structure**: DP ID, BO ID, Client ID mapping

#### NSDL (National Securities Depository Limited)
- **Detection patterns**: "NSDL", "National Securities", "Demat Account"
- **Format support**: Standard NSDL CAS format
- **Data mapping**: Account details and holdings

#### CAMS (Computer Age Management Services)
- **Detection patterns**: "CAMS", "Computer Age", "Mutual Fund"
- **Focus**: Mutual fund statements
- **Data extraction**: Folios, schemes, transactions

#### Karvy (Karvy Fintech)
- **Detection patterns**: "Karvy", "Karvy Fintech"
- **Legacy support**: Older CAS formats
- **Data compatibility**: Standard extraction methods

## Frontend CAS Parser

### Browser-based Parser (frontend/src/utils/casParser.js)
- **672 lines** of client-side parsing logic
- **PDF.js integration**: Uses pdfjs-dist 3.11.174
- **No server upload**: Processing happens in browser
- **CDSL support**: Focus on most common format
- **Real-time processing**: Immediate feedback

### Key Features
- **File to ArrayBuffer**: Converts uploaded files
- **Text extraction**: Page-by-page PDF text extraction
- **Pattern matching**: Advanced regex for data extraction
- **Data structuring**: Creates standardized JSON output
- **Error handling**: User-friendly error messages

## OnboardingCAS Controller

### Structured Processing (backend/controllers/OnboardingCASController.js)
- **Event-driven architecture**: Every action logged
- **Temporary storage**: CAS data stored in invitation records
- **Auto-integration**: Parsed data merged with client records
- **Status tracking**: Upload, parse, complete workflow
- **Error recovery**: Handles parsing failures gracefully

### Methods
- `uploadCAS()`: File upload with validation
- `parseCAS()`: Parsing with format detection
- `getCASStatus()`: Progress tracking
- `completeOnboardingWithCAS()`: Final integration

## Data Structure

### Standardized Output Format
```json
{
  "investor": {
    "name": "string",
    "pan": "string",
    "address": "string",
    "email": "string",
    "mobile": "string"
  },
  "demat_accounts": [
    {
      "dp_id": "string",
      "dp_name": "string",
      "bo_id": "string",
      "client_id": "string",
      "holdings": {
        "equities": [],
        "demat_mutual_funds": [],
        "corporate_bonds": [],
        "government_securities": [],
        "aifs": []
      }
    }
  ],
  "mutual_funds": [
    {
      "amc": "string",
      "folio_number": "string",
      "schemes": []
    }
  ],
  "summary": {
    "total_value": "number",
    "accounts": {
      "demat": { "count": 0, "total_value": 0 },
      "mutual_funds": { "count": 0, "total_value": 0 }
    }
  },
  "meta": {
    "cas_type": "string",
    "generated_at": "datetime",
    "statement_period": { "from": "date", "to": "date" }
  }
}
```

## Testing Framework

### CAS Parser Test Suite (backend/test-cas-parsing.js)
- **450 lines** of comprehensive testing
- **6 test categories**: Initialization, PDF reading, type detection, sample files, error handling, performance
- **Performance benchmarks**: Parsing time and success rate
- **Sample file testing**: Real CAS file processing
- **Error simulation**: Invalid files and passwords
- **Detailed reporting**: Success rates and recommendations

### Test Categories
1. **Parser Initialization**: Verifies parser setup
2. **PDF Reading**: Tests PDF processing capabilities
3. **Type Detection**: Validates format recognition
4. **Sample Files**: Real-world file processing
5. **Error Handling**: Invalid scenarios
6. **Performance**: Speed and memory usage

## Logging and Monitoring

### CAS Event Logger (backend/utils/casEventLogger.js)
- **Specialized logging**: CAS-specific events
- **Event categorization**: Upload, parse, success, error
- **Performance tracking**: Timing and resource usage
- **Error correlation**: Links related events
- **Audit trail**: Complete operation history

### Event Types
- `CAS_UPLOAD_STARTED/SUCCESS/FAILED`
- `CAS_PARSE_STARTED/SUCCESS/FAILED`
- `CAS_FORMAT_DETECTED`
- `PDF_READ_STARTED/SUCCESS/FAILED`
- `JSON_FORMAT_SUCCESS/FAILED`

## Integration Points

### Client Onboarding Integration
- **Step 4**: CAS upload in onboarding process
- **Auto-population**: Parsed data fills client form
- **Validation**: Data quality checks
- **Manual override**: Users can edit parsed data

### API Endpoints
- `POST /clients/onboarding/:token/cas/upload` - File upload
- `POST /clients/onboarding/:token/cas/parse` - Parse uploaded file
- `GET /clients/onboarding/:token/cas/status` - Check progress
- `POST /clients/onboarding/:token/cas/upload-structured` - Enhanced upload
- `POST /clients/onboarding/:token/cas/parse-structured` - Enhanced parsing

## Error Handling

### Common Error Scenarios
- **Invalid PDF**: Corrupted or non-PDF files
- **Password protected**: Missing or incorrect passwords
- **Unknown format**: Unsupported CAS types
- **Parsing errors**: Malformed data in CAS
- **Network issues**: Upload failures

### Recovery Mechanisms
- **Multiple parsers**: Fallback parsing methods
- **Password variants**: Tries different password formats
- **Partial parsing**: Extracts available data even with errors
- **User feedback**: Clear error messages and suggestions
- **Retry logic**: Automatic retry for transient failures