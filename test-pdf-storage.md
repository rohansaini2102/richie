# PDF Storage System Test Guide

## Testing the Enhanced jsPDF with Database Storage

### Prerequisites
1. Backend server running on port 5000
2. Frontend server running on port 3000  
3. MongoDB Atlas connection working
4. Valid JWT token for authentication
5. At least one saved financial plan

### Test Workflow

#### 1. Generate and Store PDF
1. Navigate to Goal-Based Planning interface
2. Create or select a plan with goals
3. Save the plan (to get a `planId`)
4. Use the **"Save to Database"** button
5. Verify success message and PDF appears in "Stored Reports" section

#### 2. View Stored PDF
1. In "Stored Reports" section, click **View** icon
2. PDF should open in new browser tab
3. Verify content matches generated goals and recommendations

#### 3. Download Stored PDF
1. Click **Download** icon for any stored report
2. File should download with proper filename
3. Verify downloaded PDF opens correctly

#### 4. Delete Stored PDF
1. Click **Delete** icon (red trash icon)
2. Confirm deletion in dialog
3. PDF should disappear from list

#### 5. Version Management
1. Generate multiple PDFs with different goals
2. Each should increment version number (v1, v2, v3...)
3. All versions should be listed and accessible

### API Endpoints to Test

```bash
# Store PDF (POST)
POST /api/plans/:planId/pdf/store

# Get all stored PDFs (GET)  
GET /api/plans/:planId/pdf/all

# Get specific PDF by ID (GET)
GET /api/plans/:planId/pdf/report/:reportId

# Delete PDF (DELETE)
DELETE /api/plans/:planId/pdf/report/:reportId

# Get storage stats (GET)
GET /api/plans/:planId/pdf/stats
```

### Expected Database Changes
- `pdfReports` array in FinancialPlan documents should contain PDF data
- Each report should have metadata (version, fileSize, generatedAt, etc.)
- PDF binary data stored as Buffer in `pdfData` field

### Success Criteria
- ✅ PDF generation works (preview and download)
- ✅ PDF storage to database succeeds  
- ✅ Stored PDFs can be viewed and downloaded
- ✅ Version management works correctly
- ✅ PDF deletion removes from database
- ✅ No backend PDF generators remain active
- ✅ UI shows storage status and history

### Frontend Features Removed
- ❌ SimplePDFGenerator component 
- ❌ Backend PDF generation buttons
- ❌ `/plans/:planId/pdf` endpoint usage

### Frontend Features Added  
- ✅ Database storage capability
- ✅ PDF version history display
- ✅ Individual PDF management (view/download/delete)
- ✅ Storage statistics and metadata
- ✅ Error handling for storage operations