# Daily.co API Documentation for RicheAI

This directory contains comprehensive Daily.co API documentation organized for the RicheAI meeting system. Each file is optimized for Claude Code token limits while maintaining complete coverage.

## 📁 Documentation Structure

### JavaScript API
- **[daily-js-overview.md](./daily-js-overview.md)** - Core Daily.js API methods and setup
- **[daily-js-transcription-methods.md](./daily-js-transcription-methods.md)** - Transcription start/stop methods
- **[daily-js-events.md](./daily-js-events.md)** - Recording and transcription events

### React Integration  
- **[daily-react-complete.md](./daily-react-complete.md)** - Complete Daily React library documentation
- **[daily-react-transcription.md](./daily-react-transcription.md)** - React-specific transcription hooks

### REST API
- **[daily-rest-api-overview.md](./daily-rest-api-overview.md)** - Main REST API overview and room management
- **[daily-rest-transcription-api.md](./daily-rest-transcription-api.md)** - Transcription REST endpoints

### Guides
- **[daily-transcription-guide.md](./daily-transcription-guide.md)** - Comprehensive transcription implementation guide

## 🎯 Quick Reference

### For Frontend Development
- Start with `daily-react-complete.md` for React integration
- Use `daily-js-overview.md` for core API methods
- Reference `daily-js-events.md` for event handling

### For Backend Development  
- Start with `daily-rest-api-overview.md` for API basics
- Use `daily-rest-transcription-api.md` for transcription endpoints
- Reference authentication and rate limiting sections

### For Transcription Features
- Start with `daily-transcription-guide.md` for overview
- Use `daily-js-transcription-methods.md` for client-side methods
- Reference `daily-rest-transcription-api.md` for server-side control

## 🔧 Current RicheAI Integration

The documentation aligns with your current implementation:

### Backend (Node.js/Express)
- Meeting model: `backend/models/Meeting.js`
- Controller: `backend/controllers/meetingController.js`  
- Routes: `backend/routes/meetings.js`
- API service: `frontend/src/services/api.js`

### Frontend (React)
- Meeting page: `frontend/src/components/meetings/MeetingsPage.jsx`
- Video room: `frontend/src/components/meetings/MeetingRoom.jsx`
- Scheduler: `frontend/src/components/meetings/MeetingScheduler.jsx`
- Transcript viewer: `frontend/src/components/meetings/TranscriptViewer.jsx`

### Dependencies
- `@daily-co/daily-js` v0.81.0
- `@daily-co/daily-react` v0.23.1

## 📋 Key Features Documented

✅ **Meeting Management**
- Room creation and token generation
- Meeting lifecycle (scheduled → active → completed)
- Participant management and permissions

✅ **Video Conferencing**
- HD video calling with screen sharing
- Audio/video controls and device management
- Real-time participant state tracking

✅ **Transcription System**
- Real-time speech-to-text with Deepgram
- Speaker identification and statistics
- AI-powered meeting summaries
- WebVTT format transcript storage

✅ **React Integration**
- Complete hook ecosystem
- Performance optimization patterns
- TypeScript support and testing strategies

✅ **REST API**
- Complete endpoint documentation
- Authentication and rate limiting
- Error handling and best practices

## 🚀 Usage Examples

Each documentation file contains:
- Complete method signatures and parameters
- Request/response schemas
- Practical code examples
- Error handling patterns
- Performance optimization tips
- Integration with RicheAI architecture

## 🔍 Search and Navigation

Files are organized by functionality to minimize context switching:
- **daily-js-*** for JavaScript API
- **daily-react-*** for React integration  
- **daily-rest-*** for REST API
- **daily-transcription-*** for transcription features

Each file is under 2000 lines to maintain optimal Claude Code performance while providing comprehensive coverage.

---

*Generated for RicheAI meeting system - Last updated: $(date)*