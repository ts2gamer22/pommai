<file_map>
C:/Users/Admin/Desktop/pommai
├── apps
│   ├── raspberry-pi
│   │   ├── src
│   │   │   ├── audio_stream_manager.py
│   │   │   ├── button_handler.py
│   │   │   ├── conversation_cache.py
│   │   │   ├── led_controller.py
│   │   │   ├── opus_audio_codec.py
│   │   │   ├── wake_word_detector.py
│   │   │   └── pommai_client.py
│   │   ├── config
│   │   │   └── pommai.service
│   │   ├── audio_responses
│   │   ├── tests
│   │   │   ├── test_audio.py
│   │   │   ├── test_button.py
│   │   │   ├── test_cache.py
│   │   │   ├── test_leds.py
│   │   │   ├── test_opus.py
│   │   │   └── test_wake_word.py
│   │   ├── .env.example
│   │   ├── README.md
│   │   └── requirements.txt
│   └── web
│       ├── convex
│       │   ├── _generated
│       │   │   ├── api.d.ts
│       │   │   ├── api.js
│       │   │   ├── dataModel.d.ts
│       │   │   ├── server.d.ts
│       │   │   └── server.js
│       │   ├── auth.config.ts
│       │   ├── auth.ts
│       │   ├── children.ts
│       │   ├── conversations.ts
│       │   ├── convex.config.ts
│       │   ├── http.ts
│       │   ├── knowledgeBase.ts
│       │   ├── messages.ts
│       │   ├── README.md
│       │   ├── schema.ts
│       │   ├── toys.ts
│       │   ├── voices.ts
│       │   └── tsconfig.json
│       ├── src
│       │   ├── app
│       │   │   ├── api
│       │   │   │   └── auth
│       │   │   │       └── [...all]
│       │   │   │           └── route.ts
│   │   │   ├── auth
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard
│   │   │   │   ├── chat
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── history
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── demo
│   │   │   │   └── page.tsx
│       │   │   ├── lib
│       │   │   │   └── pixel-retroui-setup.js
│       │   │   ├── pricing
│       │   │   │   └── page.tsx
│       │   │   ├── providers
│       │   │   │   └── ConvexClientProvider.tsx
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components
│       │   │   ├── chat
│       │   │   │   └── ChatInterface.tsx
│       │   │   ├── voice
│       │   │   │   ├── VoiceGallery.tsx
│       │   │   │   ├── VoicePreview.tsx
│       │   │   │   └── VoiceUploader.tsx
│       │   │   ├── dashboard
│       │   │   │   ├── steps
│       │   │   │   │   ├── CompletionStep.tsx
│       │   │   │   │   ├── DeviceStep.tsx
│       │   │   │   │   ├── ForKidsToggleStep.tsx
│       │   │   │   │   ├── KnowledgeStep.tsx
│       │   │   │   │   ├── PersonalityStep.tsx
│       │   │   │   │   ├── ReviewStep.tsx
│       │   │   │   │   ├── SafetyStep.tsx
│       │   │   │   │   ├── ToyProfileStep.tsx
│       │   │   │   │   ├── VoiceStep.tsx
│       │   │   │   │   └── WelcomeStep.tsx
│       │   │   │   ├── MyToysGrid.tsx
│       │   │   │   └── ToyWizard.tsx
│       │   │   ├── history
│       │   │   │   ├── ConversationViewer.tsx
│       │   │   │   ├── ConversationList.tsx
│       │   │   │   ├── ConversationAnalytics.tsx
│       │   │   │   └── ConversationDetails.tsx
│       │   │   ├── guardian
│       │   │   │   ├── GuardianDashboard.tsx
│       │   │   │   ├── SafetyControls.tsx
│       │   │   │   ├── LiveMonitoring.tsx
│       │   │   │   └── SafetyAnalytics.tsx
│       │   │   ├── ui
│       │   │   │   ├── accordion.tsx
│       │   │   │   ├── alert-dialog.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   ├── dropdown-menu.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── label.tsx
│       │   │   │   ├── progress.tsx
│       │   │   │   ├── radio-group.tsx
│       │   │   │   ├── select.tsx
│       │   │   │   ├── skeleton.tsx
│       │   │   │   ├── slider.tsx
│       │   │   │   ├── switch.tsx
│       │   │   │   ├── textarea.tsx
│       │   │   │   └── tooltip.tsx
│       │   │   ├── Accordion.tsx
│       │   │   ├── Bubble.tsx
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Dropdown.tsx
│       │   │   ├── index.ts
│       │   │   ├── Input.tsx
│       │   │   ├── Popup.tsx
│       │   │   ├── ProgressBar.tsx
│       │   │   ├── retroui.css
│       │   │   ├── Tabs.tsx
│       │   │   └── TextArea.tsx
│       │   ├── lib
│       │   │   ├── auth-client.ts
│       │   │   └── auth.ts
│       │   ├── stores
│       │   │   └── toyWizardStore.ts
│       │   ├── types
│       │   │   └── history.ts
│       │   └── middleware.ts
│       ├── .gitignore
│       ├── eslint.config.mjs
│       ├── next.config.ts
│       ├── package-lock.json
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── README.md
│       ├── tsconfig.json
│       └── vercel.json
├── DOCS
│   ├── context
│   │   ├── phase1context
│   │   │   ├── betterauthconvex.md
│   │   │   ├── nextjscontext.md
│   │   │   └── vercel.md
│   │   └── phase3context
│   │       ├── audio-streaming-protocol.md
│   │       ├── convex-integration-guide.md
│   │       ├── gpio-control.md
│   │       ├── offline-safety-rules.md
│   │       ├── opus-codec-config.md
│   │       ├── raspberry-pi-setup.md
│   │       ├── README.md
│   │       └── websocket-api.md
│   └── phase
│       ├── phase1.md
│       ├── phase2.md
│       └── phase3.md
├── packages
│   ├── config
│   │   └── tsconfig
│   │       └── base.json
│   ├── types
│   ├── ui
│   │   ├── src
│   │   │   ├── components
│   │   │   │   ├── Accordion.tsx
│   │   │   │   ├── Bubble.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Dropdown.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Popup.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── TextArea.tsx
│   │   │   ├── styles
│   │   │   │   └── retroui.css
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── utils
├── .gitignore
├── package.json
├── PLAN.md
├── pnpm-workspace.yaml
├── projectrule.md
├── projectstructure.md
└── turbo.json

