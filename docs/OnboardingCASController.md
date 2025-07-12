# OnboardingCASController Documentation

## Overview

The `OnboardingCASController` provides a structured approach to handling CAS (Consolidated Account Statement) file uploads and parsing during the client onboarding process. It includes enhanced logging, error handling, and temporary data storage.

## Features

- **Structured CAS Upload**: Handles file uploads with validation and temporary storage
- **Enhanced Logging**: Comprehensive event tracking with unique event IDs
- **Error Handling**: Robust error handling with detailed logging
- **Temporary Storage**: Stores CAS data temporarily in invitation records
- **Auto-Integration**: Automatically integrates CAS data with client records during onboarding
- **File Cleanup**: Automatic cleanup of temporary files after successful integration

## File Structure

```
backend/
├── controllers/
│   ├── OnboardingCASController.js    # Main controller
│   └── clientController.js           # Updated to use new controller
├── models/
│   └── ClientInvitation.js           # Updated with CAS fields
├── routes/
│   └── clients.js                    # Updated with new routes
└── test-onboarding-cas.js            # Test script
```

## API Endpoints

### 1. Upload CAS File (Structured)
```
POST /api/clients/onboarding/:token/cas/upload-structured
```

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `casFile`: PDF file
  - `casPassword`: (optional) Password for encrypted PDF

**Response:**
```json
{
  "success": true,
  "message": "CAS file uploaded successfully",
  "data": {
    "fileName": "example.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2025-01-07T10:30:00.000Z",
    "eventId": "EVT_0001_1704634200000",
    "investorPAN": "ABCDE1234F",
    "investorName": "John Doe",
    "totalValue": 500000
  }
}
```

### 2. Parse CAS File (Structured)
```
POST /api/clients/onboarding/:token/cas/parse-structured
```

**Request:**
- No body required (uses uploaded file)

**Response:**
```json
{
  "success": true,
  "message": "CAS file parsed successfully",
  "data": {
    "fileName": "example.pdf",
    "parsedAt": "2025-01-07T10:30:00.000Z",
    "eventId": "EVT_0002_1704634200000",
    "parsedData": {
      "investorInfo": { ... },
      "dematAccounts": [ ... ],
      "holdings": [ ... ],
      "mutualFunds": [ ... ],
      "summary": { ... }
    }
  }
}
```

### 3. Get CAS Status
```
GET /api/clients/onboarding/:token/cas/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "casStatus": "parsed",
    "casData": {
      "fileName": "example.pdf",
      "fileSize": 1024000,
      "uploadedAt": "2025-01-07T10:30:00.000Z",
      "parsedAt": "2025-01-07T10:30:00.000Z",
      "parsedData": { ... }
    }
  }
}
```

## Controller Methods

### Static Methods

#### 1. `uploadCAS(req, res)`
Handles CAS file upload during onboarding.

**Features:**
- Validates invitation token
- Stores file information temporarily
- Attempts basic data extraction for auto-fill
- Comprehensive logging

#### 2. `parseCAS(req, res)`
Parses the uploaded CAS file.

**Features:**
- Validates file existence
- Parses PDF content
- Stores parsed data temporarily
- Detailed error handling

#### 3. `getCASStatus(req, res)`
Retrieves current CAS processing status.

**Features:**
- Returns upload and parsing status
- Includes file metadata
- Safe for public access

#### 4. `completeOnboardingWithCAS(clientData, invitation)`
Integrates CAS data with client record during onboarding completion.

**Features:**
- Merges CAS data with client data
- Handles file cleanup
- Graceful error handling
- Comprehensive logging

## Database Schema Updates

### ClientInvitation Model
Added new fields for temporary CAS storage:

```javascript
// Temporary CAS data storage during onboarding
casUploadData: {
  fileName: String,
  filePath: String,
  fileSize: Number,
  password: String,
  uploadedAt: Date,
  eventId: String
},
casParsedData: {
  type: Object,
  default: null
}
```

## Logging

The controller uses the `casEventLogger` for comprehensive event tracking:

### Event Types
- `CAS_ONBOARDING_UPLOAD_STARTED`
- `CAS_ONBOARDING_UPLOAD_SUCCESS`
- `CAS_ONBOARDING_UPLOAD_FAILED`
- `CAS_ONBOARDING_BASIC_EXTRACTION_SUCCESS`
- `CAS_ONBOARDING_BASIC_EXTRACTION_FAILED`
- `CAS_ONBOARDING_PARSE_STARTED`
- `CAS_ONBOARDING_PARSE_SUCCESS`
- `CAS_ONBOARDING_PARSE_FAILED`
- `CAS_INTEGRATION_STARTED`
- `CAS_INTEGRATION_SUCCESS`
- `CAS_TEMP_FILE_CLEANUP`

### Log Data Structure
Each log entry includes:
- Event ID for tracking
- Timestamp
- Token information
- File metadata
- Error details (if applicable)
- Performance metrics

## Error Handling

### Common Error Scenarios
1. **Invalid/Expired Token**: Returns 404 with clear message
2. **No File Uploaded**: Returns 400 with guidance
3. **File Not Found**: Returns 404 with re-upload suggestion
4. **Parsing Errors**: Returns 400 with specific error details
5. **Integration Errors**: Logs warning but doesn't fail onboarding

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details"
}
```

## Security Features

1. **File Validation**: Only PDF files accepted
2. **File Size Limits**: 10MB maximum
3. **Token Validation**: All operations require valid invitation token
4. **Temporary Storage**: Files stored temporarily and cleaned up
5. **Password Handling**: Secure password storage and transmission

## Integration with Frontend

### API Service Methods
```javascript
// Upload CAS file using structured controller
uploadStructuredOnboardingCAS: async (token, formData)

// Parse CAS file using structured controller  
parseStructuredOnboardingCAS: async (token)
```

### Usage in ClientOnboardingForm
The frontend can use either the legacy endpoints or the new structured endpoints:

```javascript
// Legacy approach
const response = await clientAPI.uploadOnboardingCAS(token, formData);

// New structured approach
const response = await clientAPI.uploadStructuredOnboardingCAS(token, formData);
```

## Testing

### Test Script
Run the test script to verify controller functionality:

```bash
cd backend
node test-onboarding-cas.js
```

### Manual Testing
1. Create a client invitation
2. Access the onboarding form
3. Upload a CAS file
4. Verify parsing and integration
5. Check logs for event tracking

## Migration from Legacy System

The new controller runs alongside the existing CAS handling:

### Legacy Endpoints (Still Available)
- `POST /api/clients/onboarding/:token/cas/upload`
- `POST /api/clients/onboarding/:token/cas/parse`

### New Structured Endpoints
- `POST /api/clients/onboarding/:token/cas/upload-structured`
- `POST /api/clients/onboarding/:token/cas/parse-structured`
- `GET /api/clients/onboarding/:token/cas/status`

## Performance Considerations

1. **File Processing**: CAS parsing is CPU-intensive
2. **Memory Usage**: Large PDFs may require significant memory
3. **Storage**: Temporary files are cleaned up automatically
4. **Logging**: Comprehensive logging may impact performance in high-volume scenarios

## Future Enhancements

1. **Async Processing**: Move parsing to background jobs
2. **Caching**: Cache parsed data for repeated access
3. **Batch Processing**: Handle multiple CAS files simultaneously
4. **Advanced Validation**: Enhanced PDF structure validation
5. **Compression**: Compress temporary files to save storage

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (max 10MB)
   - Verify file is PDF format
   - Check disk space in upload directory

2. **Parsing Fails**
   - Verify PDF is not corrupted
   - Check if password is correct
   - Review logs for specific error details

3. **Integration Fails**
   - Check invitation token validity
   - Verify client record creation
   - Review database connection

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
LOG_LEVEL=debug
```

## Support

For issues or questions:
1. Check the logs in `backend/logs/cas/`
2. Review the event tracking data
3. Test with the provided test script
4. Verify database schema updates 