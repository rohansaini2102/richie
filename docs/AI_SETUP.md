# AI Service Setup Guide

## Overview
The RicheAI application uses Claude AI for generating intelligent financial recommendations in both debt analysis and goal-based planning features.

## Configuration Steps

### 1. Obtain Claude API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-api...`)

### 2. Set Environment Variables
Create a `.env` file in the backend directory (copy from `.env.example`):

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and add your Claude API key:

```
CLAUDE_API_KEY=sk-ant-api-your-actual-key-here
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### 3. Verify Configuration
Test the AI service configuration:

```bash
# Start the backend server
npm start

# In another terminal, test the AI service
curl http://localhost:5000/api/plans/test/ai-service
```

## Troubleshooting

### AI Report Not Working
If the AI report is not generating in goal-based planning:

1. **Check API Key**: Ensure `CLAUDE_API_KEY` is set correctly in `.env`
2. **Check Console Logs**: Look for error messages in backend console
3. **Test Endpoint**: Use the test endpoint to verify configuration
4. **Network Issues**: Ensure your server can reach `api.anthropic.com`

### Common Error Messages

- **"AI service not configured"**: Missing `CLAUDE_API_KEY` in environment
- **"Failed to generate recommendations"**: API call failed, check logs
- **"Failed to parse AI response"**: AI response format issue, fallback will be used

### Fallback Behavior
When AI service is unavailable, the system will:
1. Show cached recommendations if available
2. Display a basic fallback structure
3. Allow manual planning to continue

## API Rate Limits
- Default model: `claude-3-5-sonnet-20241022`
- Max tokens per request: 4000
- Timeout: 30 seconds
- Application rate limit: 30 seconds between AI analysis requests per client

## Caching Behavior
The application implements intelligent caching to prevent unnecessary API calls:
- **Frontend caching**: Prevents duplicate requests for same client data
- **Backend rate limiting**: 30-second cooldown between AI analysis requests
- **Data hash comparison**: Only triggers new analysis when financial data changes

## Security Notes
- Never commit `.env` file to version control
- Keep API keys secure and rotate regularly
- Use environment-specific keys for production