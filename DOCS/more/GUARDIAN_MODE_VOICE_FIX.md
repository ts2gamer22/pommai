# Guardian Mode Voice Display Fix

## Problem
Voices were not showing up in the guardian mode of the AI wizard. When users selected guardian mode (which sets `isForKids: true`), the voice selection step showed no available voices.

## Root Causes Identified

1. **Query Bug in `getKidsFriendlyVoices`**: The backend query had a bug where it was trying to call `.includes()` on a string field (`ageGroup`) instead of checking for equality.

2. **No Fallback Logic**: If no kid-friendly voices were found, the query returned an empty array instead of falling back to show all public voices.

3. **Missing Voice Tagging**: Default voices weren't being properly tagged as kid-friendly during seeding.

## Solutions Implemented

### 1. Fixed Backend Query (`convex/voices.ts`)
- Fixed the `getKidsFriendlyVoices` query to properly check `ageGroup` using equality checks instead of `.includes()`
- Added fallback logic: if no kid-friendly voices are found, return all public voices
- Added support for filter arguments (language, gender, ageGroup) to match the `getPublicVoices` query

### 2. Enhanced Voice Seeding (`convex/aiServices.ts`)
- Updated `syncDefaultVoices` to properly tag default ElevenLabs voices with "kids-friendly" and "child-safe" tags
- Set default voices' `ageGroup` to "child" to ensure they appear in guardian mode

### 3. Frontend Updates
- Updated `VoiceGallery` component to handle the updated query arguments properly
- Added `externalVoiceId` to the Voice interface to ensure proper voice ID passing
- Fixed `VoiceUploader` to properly tag voices as kid-friendly when created in guardian mode

### 4. Test Data Seeding
- Created a seed script (`scripts/seed-test-voices.ts`) to add test kid-friendly voices
- Successfully added 3 test voices: Friendly Robot, Storyteller Sarah, and Captain Adventure

## Testing Instructions

1. **Navigate to the wizard**: Go to `http://localhost:3000/dashboard` and start creating a new toy
2. **Select Guardian mode**: When prompted, choose guardian mode (this sets `isForKids: true`)
3. **Reach the Voice step**: Continue through the wizard until you reach the voice selection step
4. **Verify voices appear**: You should now see:
   - Test voices (Friendly Robot, Storyteller Sarah, Captain Adventure)
   - Any ElevenLabs default voices (if API key is configured)
   - All public voices as fallback if no kid-friendly voices exist

## Files Modified

- `apps/web/convex/voices.ts` - Fixed `getKidsFriendlyVoices` query
- `apps/web/src/components/voice/VoiceGallery.tsx` - Updated to handle new query args
- `apps/web/src/components/voice/VoiceUploader.tsx` - Added kid-friendly tagging
- `apps/web/src/components/dashboard/steps/VoiceStep.tsx` - Pass isForKids prop
- `apps/web/scripts/seed-test-voices.ts` - Created seed script for testing

## Next Steps

1. **Configure ElevenLabs API**: Set `ELEVENLABS_API_KEY` in `.env.local` to enable real voice synthesis
2. **Add More Voices**: Create more kid-friendly voices through the upload interface
3. **Voice Categorization**: Consider adding a voice category system (educational, storytelling, fun, etc.)
4. **Voice Ratings**: Implement a rating system for kid-friendly voices based on parent feedback
