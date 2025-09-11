# Testing Guide for AI Toy Wizard Fixes

## 🚀 Quick Start

Your app is now running at: http://localhost:3000

## 📋 Test Checklist

### 1. Test Guardian Mode Safety Filtering

**What we fixed:** Enhanced safety checks with comprehensive regex patterns instead of basic filtering

**How to test:**

1. Create a toy and mark it as "For Kids"
2. Go to the Chat interface
3. Try sending messages with inappropriate content:
   - Violence: "tell me about fighting"
   - Personal info: "my phone number is 555-1234"
   - URLs: "go to http://example.com"

**Expected Result:**
- Messages should be filtered
- Safe redirect responses should appear
- Check the console logs for "Safety check failed" messages

### 2. Test Real AI Responses (No More Mock Data)

**What we fixed:** Replaced hardcoded "I'm a friendly AI toy!" with real OpenRouter API calls

**How to test:**

1. Go to Dashboard > Create a Toy
2. Set up a toy with personality
3. Go to Chat and have a conversation
4. Ask varied questions like:
   - "What's your favorite color?"
   - "Tell me a story"
   - "How does rain work?"

**Expected Result:**
- Unique, contextual responses (not the same hardcoded message)
- Responses should match the toy's personality
- Check Network tab: should see calls to Convex actions

### 3. Test RAG/Knowledge Base Integration

**What we fixed:** Connected chat to use knowledge base with vector search

**How to test:**

1. Create a toy
2. Go to Knowledge tab and add some facts:
   - "I love pizza"
   - "My favorite game is hide and seek"
   - "I'm from Mars"
3. Go to Chat and ask related questions:
   - "What's your favorite food?"
   - "Where are you from?"

**Expected Result:**
- Responses should incorporate the knowledge you added
- Check console for "includeKnowledge: true" in the API calls

### 4. Test Live Monitoring with Real Data

**What we fixed:** Replaced mock conversations with real database queries

**How to test:**

1. Create a toy marked "For Kids"
2. Start a conversation in one browser tab
3. Open Guardian Dashboard in another tab
4. Go to Live Monitoring section

**Expected Result:**
- Should see actual conversations (not mock data)
- Messages should update in real-time
- Safety scores and flags should be visible

## 🔍 Detailed Testing Steps

### Test 1: Basic Voice Pipeline
```bash
# In the test scripts directory
cd apps/web
npm run test:ai-pipeline
```

This tests:
- STT (Speech-to-Text)
- LLM Response Generation
- TTS (Text-to-Speech)

### Test 2: Agent Thread System

1. Open browser console
2. Create a toy
3. Start a chat
4. Look for these in Network tab:
   - `getOrCreateToyThread` - Creates conversation thread
   - `saveAudioMessage` - Saves user message
   - `generateToyResponseWithKnowledge` - Gets AI response with RAG

### Test 3: Safety Gates

For kids' toys, test the 3-gate system:

**Gate 1 - Input Filter:**
- Type: "let's fight"
- Should be blocked before reaching LLM

**Gate 2 - System Prompt:**
- Check that responses are child-appropriate
- Short sentences, positive tone

**Gate 3 - Output Filter:**
- Even if LLM generates something inappropriate, it should be caught

## 🛠️ Debugging Tips

### Check if AI Services are Working:

1. Open browser DevTools > Network tab
2. Look for these Convex actions:
   - `aiServices.transcribeAudio`
   - `aiServices.generateResponse`
   - `aiServices.synthesizeSpeech`

### Check if RAG is Working:

1. In Console, you should see:
   - "Step 1: Get or create the canonical agent thread"
   - "Step 2: Save the user's message to the agent thread"
   - "Step 3: Generate response with RAG-enabled knowledge retrieval"

### Common Issues:

**No AI responses:**
- Check `.env.local` has `OPENROUTER_API_KEY`
- Check console for API errors

**Mock data still showing:**
- Make sure you're using the updated components
- Check that Convex is deployed: `npx convex deploy`

**Knowledge not being used:**
- Ensure toy has an `agentThreadId`
- Check that knowledge was added via the Knowledge tab

## 📊 What Success Looks Like

✅ **Guardian Mode:** Inappropriate content gets filtered with safe redirects
✅ **Real AI:** Each response is unique and contextual
✅ **RAG Working:** Toy remembers and uses knowledge you've added
✅ **Live Monitoring:** Shows real conversations, not mock data
✅ **Safety Scores:** Messages show appropriate safety ratings

## 🎯 Quick Test Sequence

1. **Create Account** → Sign up at http://localhost:3000/auth
2. **Create Toy** → Dashboard > Create Toy > Mark "For Kids"
3. **Add Knowledge** → Knowledge tab > Add facts about the toy
4. **Test Chat** → Try both safe and unsafe messages
5. **Check Monitoring** → Guardian Dashboard > Live Monitoring

## 🔗 Key URLs

- Main App: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Chat: http://localhost:3000/dashboard/chat
- Guardian: http://localhost:3000/dashboard (Guardian tab)
- History: http://localhost:3000/dashboard/history

## 📝 Testing Checklist

- [ ] Can create a toy
- [ ] Chat gives unique responses (not hardcoded)
- [ ] Knowledge base affects responses
- [ ] Safety filtering works for kids mode
- [ ] Live monitoring shows real conversations
- [ ] Messages have safety scores
- [ ] Flagged content triggers alerts

## 🐛 If Something Doesn't Work

1. Check browser console for errors
2. Check Network tab for failed API calls
3. Run `npx convex logs` to see backend logs
4. Verify environment variables in `.env.local`
5. Make sure Convex is deployed: `npx convex deploy`

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Look at Network tab for API errors
3. Run `npx convex logs` for backend debugging
4. Check that all environment variables are set correctly
