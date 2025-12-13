# Chatbot Setup Guide

This guide explains how to set up and use the AI-powered chatbot feature in the Travel Desk application.

## Features

The chatbot provides:
- **AI-powered responses** using Perplexity Pro (or fallback keyword matching)
- **Context-aware answers** about the Travel Desk application
- **Conversation history** for better context
- **Beautiful UI** with floating button and chat window
- **Dark theme support**
- **Responsive design** for mobile devices

## Prerequisites

1. Node.js and npm installed
2. Backend and frontend dependencies installed
3. (Optional) Perplexity Pro API key for AI-powered responses

## Installation

### 1. Install Backend Dependencies

Install dependencies by running:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create or update your `.env` file in the `backend` directory:

#### Option 1: Perplexity Pro (Recommended)
```env
# Perplexity Pro Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PERPLEXITY_MODEL=llama-3.1-sonar-large-128k-online
```

#### Option 2: Fallback (No API Key Required)
If you don't provide a Perplexity API key, the chatbot will automatically use a fallback keyword-based response system that still provides helpful answers about the application.

**Note:** The chatbot will automatically use Perplexity if an API key is provided, otherwise it falls back to keyword-based responses.

### 3. Get Perplexity Pro API Key

1. Go to [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. Sign in with your Perplexity Pro account
3. Generate an API key
4. Copy the key and add it to your `.env` file

**Available Perplexity Pro Models:**
- `llama-3.1-sonar-large-128k-online` (default, recommended)
- `llama-3.1-sonar-huge-128k-online` (more capable)
- `llama-3.1-sonar-small-128k-online` (faster, cheaper)

**Cost Note:** Check your Perplexity Pro subscription for API usage limits and pricing.

## How It Works

### Backend

1. **Chatbot Service** (`backend/src/services/chatbot.service.ts`):
   - Handles AI responses using Perplexity Pro API
   - Falls back to keyword-based responses if Perplexity is not configured
   - Includes application context for relevant answers
   - Automatically uses Perplexity if API key is provided

2. **Chatbot Route** (`backend/src/routes/chatbot-routes.ts`):
   - `POST /api/chatbot/chat` - Endpoint for sending messages
   - Requires authentication (uses `x-user-uuid` header)

### Frontend

1. **Chatbot Component** (`frontend/src/app/shared/components/chatbot/chatbot.component.ts`):
   - Floating button in bottom-right corner
   - Expandable chat window
   - Message history with timestamps
   - Loading indicators

2. **Chatbot Service** (`frontend/src/app/core/services/chatbot.service.ts`):
   - Communicates with backend API
   - Handles conversation history

3. **Integration**:
   - Added to `LayoutComponent` so it's available on all pages
   - Automatically uses authentication interceptor

## Usage

1. **Start the application**:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend (in another terminal)
   cd frontend
   npm start
   ```

2. **Access the chatbot**:
   - Log in to the application
   - Look for the floating chat button in the bottom-right corner
   - Click to open the chat window

3. **Ask questions**:
   - Type your question in the input field
   - Press Enter or click the send button
   - The chatbot will respond with helpful information about the Travel Desk application

## Example Questions

The chatbot can answer questions like:
- "How do I create a travel request?"
- "What can managers do in this application?"
- "How do I upload documents?"
- "What is the approval process?"
- "How do I process bookings?"
- "What are the different user roles?"

## Customization

### Change Perplexity Model

Edit `backend/src/config/env.ts` or set `PERPLEXITY_MODEL` in `.env`:
- `llama-3.1-sonar-large-128k-online` (default, recommended)
- `llama-3.1-sonar-huge-128k-online` (more capable)
- `llama-3.1-sonar-small-128k-online` (faster, cheaper)

### Modify Application Context

Edit the `APPLICATION_CONTEXT` constant in `backend/src/services/chatbot.service.ts` to add more information about your application.

### Customize UI

The chatbot component styles are in `frontend/src/app/shared/components/chatbot/chatbot.component.scss`. You can customize:
- Colors and gradients
- Size and position
- Animations
- Dark theme colors

## Troubleshooting

### Chatbot not responding
- Check that the backend is running
- Verify authentication (you must be logged in)
- Check browser console for errors
- Verify API endpoint in `environment.ts`

### Perplexity API errors
- Verify your API key is correct
- Check your Perplexity Pro account has active subscription
- Review backend console for detailed error messages
- The chatbot will fall back to keyword matching if Perplexity fails
- Ensure you have API access enabled in your Perplexity Pro account

### Chatbot not visible
- Ensure you're logged in (chatbot requires authentication)
- Check that `ChatbotComponent` is imported in `LayoutComponent`
- Verify no CSS conflicts are hiding the component

## Security Notes

- The chatbot endpoint requires authentication
- API keys should never be committed to version control
- Use environment variables for sensitive configuration
- The chatbot only has access to application context, not user data

## Future Enhancements

Potential improvements:
- Chat history persistence
- Multi-language support
- Voice input/output
- Integration with actual user data for personalized responses
- Analytics and usage tracking
