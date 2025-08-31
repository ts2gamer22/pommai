Based on the provided codebase, here is a comprehensive list of all Convex schemas, functions, mutations, and actions, categorized for clarity.
Convex Schemas
The database schema is defined across two main files: convex/schema.ts and convex/agentSchema.ts.
Application-Specific Schemas
These schemas are central to the Pommai application's functionality.
toys: Stores all information about the AI toy configurations, including personality, voice, safety settings, and owner.
conversations: Holds metadata for each conversation session, such as start/end times, participants, and summary analytics.
messages: Contains individual messages within each conversation, including the content, role (user or toy), and safety analysis metadata.
knowledgeBases: Stores the custom knowledge for each toy, including backstory, family info, and custom facts.
voices: A library of available voices, both preset and custom-uploaded by users.
children: Stores profiles for children, managed by parents in Guardian Mode, including specific safety settings.
devices: Manages physical devices (like Raspberry Pi) linked to the platform.
toyAssignments: Links specific toys to devices and/or children.
moderationLogs: Records safety-related incidents and content moderation actions.
AI Agent Schemas
These schemas support the RAG (Retrieval-Augmented Generation) system from the @convex-dev/agent component.
toyAgents: Configures the AI agent for each toy, including the system prompt, model, and RAG settings.
knowledgeEmbeddings: Stores vector embeddings of the knowledge base content to enable semantic search for RAG.
BetterAuth Schemas
These tables are part of the @convex-dev/better-auth component and are used for user authentication and session management.
users: Stores user account information like email and name. The application extends this table.
sessions: Manages active user sessions.
accounts: Links user accounts to different authentication providers (e.g., email/password, social logins).
verifications: Stores tokens for processes like email verification.
Convex Functions (Queries, Mutations, & Actions)
Below are the server-side functions categorized by their module.
BetterAuth Functions
These functions are provided by the @convex-dev/better-auth component and are primarily located in convex/auth.ts.
Mutations:
createUser: Creates a new user in the system.
updateUser: Updates a user's profile information.
deleteUser: Deletes a user account.
createSession: Creates a new session upon successful login.
Queries:
isAuthenticated: Checks if a user is currently authenticated.
getCurrentUser: A query that retrieves the currently logged-in user's full profile by combining BetterAuth data with the application's users table.
Application-Specific Functions
agents.ts
Mutation:
createToyAgent: Creates and configures a new AI agent for a specific toy.
aiPipeline.ts
Action:
processVoiceInteraction: An action that orchestrates the entire AI pipeline, from transcribing audio to generating and saving a response.
aiServices.ts
Actions:
transcribeAudio: Calls an external service (like OpenAI Whisper) to convert audio data to text.
synthesizeSpeech: Calls an external service (like ElevenLabs) to convert text to speech.
generateResponse: Calls an external LLM service (like OpenRouter) to generate a chat response.
children.ts
Mutations:
createChild: Creates a new child profile under a parent's account.
updateChild: Updates an existing child's profile.
Queries:
listChildren: Lists all children associated with the current user.
getChild: Retrieves a specific child's profile.
conversations.ts
Mutations:
createConversation: Starts a new conversation session.
endConversation: Marks a conversation as ended and calculates its duration.
Queries:
getRecentConversations: Fetches the most recent conversations.
getConversationHistory: Retrieves a list of past conversations.
getConversationWithMessages: Fetches a single conversation along with all its messages.
getFilteredConversationHistory: Retrieves conversations based on various filters like date, sentiment, and search queries.
getConversationAnalytics: Computes and returns analytics data for conversations.
knowledgeBase.ts
Mutations:
upsertKnowledgeBase: Creates or updates the knowledge base for a toy.
addMemory: Adds a new memory to a toy's knowledge base.
removeMemory: Removes a memory.
addCustomFacts: Adds new custom facts.
updateFamilyInfo: Updates family-related information.
Queries:
getKnowledgeBase: Retrieves the knowledge base for a specific toy.
searchMemories: Searches for memories containing a specific keyword.
messages.ts
Mutation:
sendMessage: Saves a new message to a conversation.
flagMessage: Flags a message for moderation review.
Query:
getMessages: Retrieves all messages for a given conversation.
searchMessages: Searches for messages across conversations using filters.
Action:
generateAIResponse: Generates a response from the AI toy based on the conversation context.
rag.ts
Mutation:
addKnowledge: Adds new content to the knowledge base and generates vector embeddings for it.
Query:
search: Performs a vector search on the knowledge base to find relevant context for a query.
Action:
processKnowledgeBase: Processes and chunks documents before adding them to the knowledge base.
safety.ts
Actions:
checkContent: Checks text against a content safety service.
getSafeResponse: Generates a safe, redirecting response when inappropriate content is detected.
toys.ts
Mutations:
createToy: Creates a new AI toy configuration.
updateToy: Updates an existing toy's settings.
updateToyStatus: Changes a toy's status (active, paused, archived).
assignToyToDevice: Links a toy to a physical device.
removeToyFromDevice: Unlinks a toy from a device.
duplicateToy: Creates a copy of an existing toy.
deleteToy: Archives a toy (soft delete).
Queries:
getMyToys: Retrieves all toys created by the current user.
getGuardianToys: Fetches all toys the current user is managing in Guardian Mode.
getToy: Gets a single toy's configuration by its ID.
getUserToys: Retrieves toys for a specific user.
voices.ts
Mutations:
createCustomVoice: Adds a new custom voice to the library.
updateVoice: Updates the metadata of a custom voice.
deleteVoice: Deletes a custom voice.
incrementVoiceUsage: Increments the usage counter for a voice.
Queries:
getPublicVoices: Retrieves all publicly available voices.
getMyVoices: Fetches all voices uploaded by the current user.
getVoice: Gets a specific voice by its ID.
getKidsFriendlyVoices: Retrieves voices specifically marked as safe for children.
searchVoices: Searches for voices by name or tags.