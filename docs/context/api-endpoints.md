# API Endpoints Overview

## Base Configuration
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer tokens
- **Content-Type**: `application/json`
- **CORS**: Configured for development origins

## Authentication Endpoints
**Base Route**: `/api/auth`

### POST /auth/register
- **Purpose**: Advisor registration
- **Body**: Advisor details with SEBI information
- **Response**: JWT token + advisor profile
- **Validation**: Email uniqueness, SEBI number format
- **Rate Limit**: 5 requests per 15 minutes

### POST /auth/login
- **Purpose**: Advisor authentication
- **Body**: `{ email, password, rememberMe }`
- **Response**: JWT token + advisor profile
- **Security**: bcrypt password verification
- **Rate Limit**: 5 attempts per 15 minutes

### POST /auth/logout
- **Purpose**: Session termination
- **Auth**: Required
- **Response**: Success confirmation

### GET /auth/profile
- **Purpose**: Get current advisor profile
- **Auth**: Required
- **Response**: Advisor details (password excluded)

### PUT /auth/profile
- **Purpose**: Update advisor profile
- **Auth**: Required
- **Body**: Updated advisor fields
- **Response**: Updated profile

## Client Management Endpoints
**Base Route**: `/api/clients/manage`

### GET /clients/manage
- **Purpose**: List advisor's clients
- **Auth**: Required
- **Query Params**: `page`, `limit`, `search`, `status`
- **Response**: Paginated client list
- **Filter**: Only advisor's clients

### GET /clients/manage/:id
- **Purpose**: Get specific client details
- **Auth**: Required
- **Params**: `id` - Client ObjectId
- **Response**: Complete client profile
- **Security**: Advisor ownership verification

### PUT /clients/manage/:id
- **Purpose**: Update client information
- **Auth**: Required
- **Body**: Updated client fields
- **Response**: Updated client profile
- **Validation**: Step-wise validation

### DELETE /clients/manage/:id
- **Purpose**: Delete client (soft delete)
- **Auth**: Required
- **Response**: Deletion confirmation
- **Security**: Advisor ownership verification

## Client Invitations
**Base Route**: `/api/clients/manage/invitations`

### GET /clients/manage/invitations
- **Purpose**: List advisor's invitations
- **Auth**: Required
- **Response**: Invitation list with status
- **Filter**: Active invitations only

### POST /clients/manage/invitations
- **Purpose**: Send client invitation
- **Auth**: Required
- **Body**: `{ clientName, clientEmail }`
- **Response**: Invitation details + token
- **Side Effect**: Email sent to client
- **Rate Limit**: 10 invitations per hour

## Client Onboarding Endpoints
**Base Route**: `/api/clients/onboarding`

### GET /clients/onboarding/:token
- **Purpose**: Get onboarding form
- **Params**: `token` - Invitation token
- **Response**: Form data + client info
- **Validation**: Token expiry check
- **Security**: No auth required (token-based)

### POST /clients/onboarding/:token
- **Purpose**: Submit onboarding form
- **Params**: `token` - Invitation token
- **Body**: Complete client form data
- **Response**: Client creation confirmation
- **Side Effect**: Client record created

## CAS Processing Endpoints
**Base Route**: `/api/clients/onboarding/:token/cas`

### POST /clients/onboarding/:token/cas/upload
- **Purpose**: Upload CAS file (legacy)
- **Content-Type**: `multipart/form-data`
- **Body**: PDF file + optional password
- **Response**: Upload confirmation + tracking ID
- **File Limits**: 50MB max, PDF only
- **Storage**: Temporary file storage

### POST /clients/onboarding/:token/cas/parse
- **Purpose**: Parse uploaded CAS file (legacy)
- **Response**: Parsed CAS data in JSON format
- **Process**: Format detection → Parsing → JSON formatting
- **Error Handling**: Detailed error messages

### POST /clients/onboarding/:token/cas/upload-structured
- **Purpose**: Enhanced CAS upload
- **Features**: Better error handling, event logging
- **Response**: Structured upload response
- **Logging**: Comprehensive event tracking

### POST /clients/onboarding/:token/cas/parse-structured
- **Purpose**: Enhanced CAS parsing
- **Features**: Advanced parsing with validation
- **Response**: Validated and formatted data
- **Integration**: Auto-populates client form

### GET /clients/onboarding/:token/cas/status
- **Purpose**: Check CAS processing status
- **Response**: Current processing state
- **States**: `uploaded`, `parsing`, `completed`, `failed`

## Admin Endpoints
**Base Route**: `/api/admin`

### GET /admin/dashboard
- **Purpose**: Admin overview statistics
- **Auth**: Admin role required
- **Response**: System metrics
- **Data**: Advisor count, client count, processing stats

### GET /admin/advisors
- **Purpose**: List all advisors
- **Auth**: Admin role required
- **Response**: Advisor list with status
- **Filter**: Status-based filtering

### GET /admin/clients
- **Purpose**: Client overview (aggregated)
- **Auth**: Admin role required
- **Response**: Client statistics
- **Privacy**: No personal data exposed

## Planning Endpoints
**Base Route**: `/api/plans`

### POST /plans/goal-based
- **Purpose**: Create goal-based plan
- **Auth**: Required
- **Body**: Client goals + preferences
- **Response**: Generated plan
- **Integration**: Claude AI recommendations

### POST /plans/hybrid
- **Purpose**: Create hybrid plan
- **Auth**: Required
- **Body**: Multiple planning approaches
- **Response**: Comprehensive plan

### GET /plans/:id/pdf
- **Purpose**: Generate plan PDF
- **Auth**: Required
- **Response**: PDF file stream
- **Format**: Professional report format

## Middleware Stack

### Request Processing Order
1. **Morgan Logging**: HTTP request logging
2. **CORS**: Cross-origin request handling
3. **Body Parsing**: JSON and multipart parsing
4. **Rate Limiting**: Endpoint-specific limits
5. **Authentication**: JWT verification (where required)
6. **Validation**: Input validation and sanitization
7. **Route Handler**: Business logic
8. **Error Handling**: Centralized error processing
9. **Response Logging**: Success/error logging

### Authentication Middleware
- **Header**: `Authorization: Bearer <token>`
- **Verification**: JWT signature validation
- **User Context**: Adds `req.user` with advisor details
- **Error Handling**: 401 for invalid/expired tokens

### Validation Middleware
- **Express Validator**: Input validation
- **XSS Protection**: HTML entity encoding
- **SQL Injection**: MongoDB query sanitization
- **File Upload**: Type and size validation

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info",
  "code": "ERROR_CODE",
  "timestamp": "ISO datetime",
  "requestId": "unique-request-id"
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (auth required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **422**: Unprocessable Entity (business logic error)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

## Rate Limiting Configuration

### Authentication Endpoints
- **Window**: 15 minutes
- **Limit**: 5 requests
- **Scope**: Per IP address

### Client Invitations
- **Window**: 1 hour
- **Limit**: 10 invitations
- **Scope**: Per authenticated advisor

### CAS Upload
- **Window**: 1 hour
- **Limit**: 20 uploads
- **Scope**: Per invitation token

### General API
- **Window**: 15 minutes
- **Limit**: 100 requests
- **Scope**: Per IP address

## Request/Response Examples

### Login Request
```json
POST /api/auth/login
{
  "email": "advisor@example.com",
  "password": "securepassword",
  "rememberMe": true
}
```

### Login Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "advisor@example.com",
    "sebiRegNumber": "INA000001234"
  }
}
```

### CAS Upload Response
```json
{
  "success": true,
  "message": "CAS file uploaded successfully",
  "data": {
    "fileName": "cas_statement.pdf",
    "fileSize": 1048576,
    "uploadedAt": "2025-01-25T10:30:00.000Z",
    "trackingId": "CAS_1706180200_abc123",
    "eventId": "EVT_1706180200456"
  }
}
```

## Security Headers

### CORS Configuration
```javascript
{
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Helmet.js (Ready for Activation)
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection