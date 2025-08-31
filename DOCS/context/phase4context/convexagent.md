(Files content cropped to 300k characters, download full ingest to see more)
================================================
FILE: README.md
================================================
# Convex Agent Component

[![npm version](https://badge.fury.io/js/@convex-dev%2fagent.svg)](https://badge.fury.io/js/@convex-dev%2fagent)

Convex provides powerful building blocks for building agentic AI applications,
leveraging Components and existing Convex features.

With Convex, you can separate your long-running agentic workflows from your UI,
without the user losing reactivity and interactivity.

```sh
npm i @convex-dev/agent
```

<!-- START: Include on https://convex.dev/components -->

AI Agents, built on Convex.
[Check out the docs here](https://docs.convex.dev/agents).

The Agent component is a core building block for building AI agents. It manages
threads and messages, around which you Agents can cooperate in static or dynamic
workflows.

- [Agents](./docs/getting-started.mdx) provide an abstraction for using LLMs to
  represent units of use-case-specific prompting with associated models,
  prompts, [Tool Calls](./docs/tools.mdx), and behavior in relation to other
  Agents, functions, APIs, and more.
- [Threads](./docs/threads.mdx) persist [messages](./docs/messages.mdx) and can
  be shared by multiple users and agents (including
  [human agents](./docs/human-agents.mdx)).
- Streaming text and objects using deltas over websockets so all clients stay in
  sync efficiently, without http streaming. Enables streaming from async
  functions.
- [Conversation context](./docs/context.mdx) is automatically included in each
  LLM call, including built-in hybrid vector/text search for messages in the
  thread and opt-in search for messages from other threads (for the same
  specified user).
- [RAG](./docs/rag.mdx) techniques are supported for prompt augmentation from
  other sources, either up front in the prompt or as tool calls. Integrates with
  the [RAG Component](https://www.convex.dev/components/rag), or DIY.
- [Workflows](./docs/workflows.mdx) allow building multi-step operations that
  can span agents, users, durably and reliably.
- [Files](./docs/files.mdx) are supported in thread history with automatic
  saving to [file storage](https://docs.convex.dev/file-storage) and
  ref-counting.
- [Debugging](./docs/debugging.mdx) is enabled by callbacks, the
  [agent playground](./docs/playground.mdx) where you can inspect all metadata
  and iterate on prompts and context settings, and inspection in the dashboard.
- [Usage tracking](./docs/usage-tracking.mdx) is easy to set up, enabling usage
  attribution per-provider, per-model, per-user, per-agent, for billing & more.
- [Rate limiting](./docs/rate-limiting.mdx), powered by the
  [Rate Limiter Component](https://www.convex.dev/components/rate-limiter),
  helps control the rate at which users can interact with agents and keep you
  from exceeding your LLM provider's limits.

[Read the associated Stack post here](https://stack.convex.dev/ai-agents).

[![Powerful AI Apps Made Easy with the Agent Component](https://thumbs.video-to-markdown.com/b323ac24.jpg)](https://youtu.be/tUKMPUlOCHY)
**Read the [docs](https://docs.convex.dev/agents) for more details.**

Play with the [example](./example/):

```sh
git clone https://github.com/get-convex/agent.git
cd agent
npm run setup
npm run example
```

Found a bug? Feature request?
[File it here](https://github.com/get-convex/agent/issues).

<!-- END: Include on https://convex.dev/components -->

[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/get-convex/agent)



================================================
FILE: CHANGELOG.md
================================================
# Changelog

## 0.1.18

- definePlaygroundAPI uses the new interface functions
- Add generic types on UIMessages (credit: ethan-huo)
- Deleting returns the order range (credit: ethan-huo)
- Allow specifying a custom `ctx` type for use in tools created with `createTool`
- Fix resolution of `definePlaygroundApi`
- Fix: ReactNative can do optimistic updates even if it has crypto defined
- Fix: getMessageByIds correctly serializes non-user messages
- Fix: usage handler won't be overwritten with undefined.

## 0.1.17

- Importing `definePlaygroundAPI` from @convex-dev/agent directly
- Supports adding a file to the message history from an httpAction
- Fix: enforce storageOptions "none" in streamText (credit: fvaldes33)

## 0.1.16

- It's possible to call many agent functions directly from a workflow.
- Support calling generate/stream with the same `promptMessageId` multiple times
  and have it continue the generation, e.g. when maxSteps is 1.
- `asTextAction` and `asObjectAction` now return `order` and `warnings`.
- generating embeddings asynchronously is more efficient
- Deprecated: dropped long-deprecated args like `isTool`, and some
  `storageOptions.save*` options that have been replaced with alternatives.
- Breaking: `.id` on `toUIMessages` is now always the message's `_id`, not any
  custom id provided from the AI SDK. Shouldn't affect ~anyone.
- Fix embedding/vector argument to search messages
- Fix handling of `undefined` in streaming text
- Return the last agent name to the playground UI
- Validate the playground backend less frantically
- Allow passing null for userId arguments

## 0.1.15

- Agents can be dynamically created for the playground
- You can abort streaming messages by ID or message `order`
- You can request that `syncStreams` return aborted streamed messages, if you
  want to show those in your UI.
- They will have `msg.streaming === false` if they were aborted.
- Factored out functions so you don't have to have an agent to call:
  `saveMessages`, `getThreadMetadata`, `createThread`, `fetchContextMessages`,
  `listMessages`, `syncStreams`
- Improved the `ctx` type for the raw request handler and exposed more types
- Add `agentName` to `UIMessage`
- Saving messages returns the `order` of the last message saved.
- Fix: stream deletion is idempotent and cleanup is canceled if it's already
  deleted.

## 0.1.14

- Show reasoning before text in UI messages
- List un-named agents in the playground
- Expose delete functions for messages & threads on the Agent class
- Expose updating messages on the Agent class
- Expose the types for ThreadQuery, StreamArgs, and SyncStreamsReturnValue
- Fix thread title text search
- Fix loading state of pagination (peer bump)
- Fix user messages going from pending-> failed when using prompt with
  generateText repeatedly in a thread.

## 0.1.13

- Allow updating a thread's userId
- Auth is available in the `createTool` ctx.
- Add text search on thread titles.
- Add RAG example & docs

## 0.1.12

- Pass the final model & provider when storing messages, in case it was
  overriden at the thread/callsite level.

## 0.1.11

- Supports passing both a promptMessageId and messages, so you can pass context
  messages while also generating the propt message ahead of time in a mutation.
- Now includes an example of RAG using the Memory component.

## 0.1.10

- Fix object serialization
- Sources will be populated to non-tool results
- Deleting files will return the files actually deleted
- Agents without names will warn if used in the playground
- More graceful deletion of streams

## 0.1.9

- You can abort a stream asynchronously and have it stop writing deltas
  smoothly.
- The timeout for streaming deltas with no sign of life has been increased to 10
  minutes.
- Delete stream deltas automatically 5 min after the stream finishes.
- Fix: deleting threads asynchronously will clean up deltas.
- Fix: update the reasoning in the top-level message when streaming

## 0.1.8

- Support images in localhost by loading them locally and passing them to the
  LLM as raw data. (author: @julionav)
- Add `updateMessage` to the raw components.agent.messages API for patching
  existing message contents, status, and error details. (author: @julionav)
- Add extensions to support NodeNext bundling
- Fix: paginating over all users now works for more than one page
- Fix: streams are now deleted when deleting threads / user data

## 0.1.7

- Image and file handling! It now auto-saves large input messages, and has an
  API to save and get metadata about files, as well as automatic reference
  counting for files being used in messages, so you can vacuum unused files.
  Check out [examples/files-images](./examples/files-images), which also
  includes an example generating an image and saving it in messages one-shot.
- Adds a `rawRequestResponseHandler` argument to the Agent that is a good spot
  to log or save all raw request/responses if you're trying to debug model
  behavior, headers, etc.
- Centralizes the example model usage so you can swap openai for openrouter /
  grok in one place.
- StorageOptions now takes a better argument name
  `saveMessages?: "all" | "none" | "promptAndOutput";`, deprecating
  `save{All,Any}InputMessages` and `saveOutputMessages`.
- Add `rawRequestResponseHandler` to the Agent definition, so you can log the
  raw request and response from the LLM.

### Deprecated

- The `files` field is deprecated in favor of `fileIds` in the message metadata.
  This wasn't really used before but it was possible folks discovered how to set
  it.

### Breaking

- The `steps` table is now gone. It will still be around in your backend, where
  you can inspect or clear it if you want, but it will not be written to, and
  the low-level APIs around saving steps alongside messages are gone. To get
  debug information, you can use the `rawRequestResponseHandler` and dump the
  request and response to your own debug table. Maybe conditional on some
  environment variable so you can turn it on/off for debugging.

## 0.1.6

- Fix pagination for the Agent messages when loading more
- Allow using useSmoothText in Next.js
- Fix: re-export `ToolCtx` in `@convex-dev/agent/react`

## 0.1.5

- APIs to get and update thread metadata on the agent / thread objects.
- Support generating embeddings asynchronously to save messages in mutations.
- Allow embedding generation to be done lazily by default.
- Build the project so it's compatible with composite and verbatim module syntax
- `useSmoothText` is even smoother
- Fix handling of file messages to include `filename` and `data` field instead
  of `file`.
- Fix bundling of api.d.ts to fix the `AgentComponent` type being `any`.
- More examples in the examples/ directory, that you can access from the root
  example
- Improve scripts for running the examples. See README.
- Starting to unify model definitions for examples so you only have to change it
  in one place to e.g. use grok.
- Better import hygiene for folks using `verbatimModuleSyntax`.

## 0.1.4

- Automatically pulls in the thread's userId when no userId is specified.
- Fixes bugs around duplicate content when streaming / using toUIMessages.
- `useSmoothText` is now even smoother with a stream rate that auto-adjusts.
- Defaults streaming chunks to sentence instead of word.

### Breaking

- The `userId` associated with the thread will automatically be associated with
  messages and tool calls, if no userId is passed at thread continuation or
  call-site. This is likely what you want, but in case you didn't, consider not
  setting a default userId for the thread and passing it in only when continuing
  the thread.
- The `searchMessage` and `textSearch` functions now take the more explicit
  parameter `searchAllMessagesForUserId` instead of `userId`.

## 0.1.3

- Allows you to pass `promptMessageId` to `agent.streamText`. This parameter
  allows you to create a message ahead of time and then generate the response
  separately, responding to that message.

## 0.1.2

- Added text delta streaming with `useThreadMessages` and
  `useStreamingThreadMessages` React hooks. See examples/chat-streaming for
  example usage.
- Also includes a `useSmoothText` hook and `optimisticallySendMessage` to get
  smooth streaming UI and immediate feedback when a user sends a msg.
- Adds a UIMessage type that is an AI SDK UIMessage with some extra fields for
  convenience, e.g. a stable key, order/stepOrder, streaming status.
- Allow listing threads without an associated userId in the playground.
- make stepOrder always increasing, for more predictable sorting of failed +
  non-failed messages.
- A reference to the agent is now passed to tool calls using the `createTool`
  utility.
- In more places, we aren't storing the AI SDK `id` unless explicitly passed in,
  and favoring the built-in Convex ID instead.
- The examples/ folder will become a better resource with more specific
  examples. For now, there's an index page when running the examples, that
  points to the text streaming and weather demos.
- There's now `listMessages` `saveMessage`, and `asSaveMessagesMutation` on the
  Agent. `listMessages` is compliant with the normal pagination API.

### Breaking

- `components.agent.messages.listMessagesByThreadId` is now `asc`ending by
  default! It'll have a type error to help you out. While you're at it, you can
  use the new `.listMessages` on the agent itself!
- `addStep` now returns the messages it created instead of a step. This is not
  likely to be called by clients directly. It's mostly used internally.
- `toUIMessages` has been moved to the `@convex-dev/agent/react` import
  entrypoint.

## 0.1.1

- The file api has been improved to allow for upserting files more correctly.
  You can use it to track images and files in messages, and have a cron that
  queries for images that can be safely deleted. When adding it to a message,
  call `addFile`, `useExistingFile`, or `copyFile` to get the `fileId` and add
  it to the message metadata. When the message is deleted, it will delete the
  file (if it has the last reference to it).
- Added an example for passing in images to LLMs.
- Embeddings of length 1408 are now supported.

## 0.1.0

- UI Playground, to host locally or embed into your app.
  - On the left panel it has a dropdown to select a users, then lists the user's
    treads
  - In the middle you can see the thread's messages and tool calls, as well as
    send new messages in the thread:
    - Configurable context & message saving options
    - Play with the system prompt for rapid prototyping.
  - On the right you can see the selected message's details, as well as fetch
    contextual messages to investigate what messages would get fetched for that
    message, with configurable ContextOptions.
  - Use the [hosted version](https://get-convex.github.io/agent/) or run it
    locally with `npx @convex-dev/agent-playground` - uses Vite internally for
    now.
  - API key management (to authenticate into the UI Playground)
- The `order` and `stepOrder` is now well defined: each call to something like
  `generateText` will be on the next "order" and each message generated from it
  will have increasing "subOrder" indexes.
- Adds a function to turn MessageDoc[] into UIMessage[].
- Eliminates an index to reduce storage cost per-message.
- The README is a better resource.

### Breaking

- `agent.fetchContextMessages` now returns `MessageDoc` instead of a
  `CoreMessage` objects.
- `isTool` configuration for context has been changed to `excludeToolMessages` -
  where `false`/`undefined` is the default and includes tool messages, and
  `true` will only return user/assistant messages.
- Reorganization of API (split `agent.messages.*` into `agent.threads.*`,
  `agent.messages.*`, `agent.files.*`, and `agent.users.*`.
- Parameters like `parentMessageId` have generally been renamed to
  `promptMessageId` or `beforeMessageId` or `upToAndIncludingMessageId` to
  better clarify their use for things like using an existing message as a prompt
  or searching context from before a message, or fetching messages up to and
  including a given message. The `generate*` / `stream*` functions can take a
  `promptMessageId` instead of a `prompt` / `messages` arg now.
- Calls to steps and objects now take a parentMessageId instead of messageId
  parameter, as this is the true meaning of parent message (the message being
  responded to).

### Deprecated

- The `steps` table is going away, to be replaced with a callback where you can
  dump your own comprehensive debug information if/when you want to. As such,
  the `stepId` field isn't returned on messages.
- The `parentMessageId` field is no longer exposed. Its purpose is now filled by
  the order & stepOrder fields: each message with the same order is a child of
  the message at stepOrder 0.

## 0.0.16

- Fixes a bug with providing out-of-order tool messages in the prompt context.
  (author: @apostolisCodpal)

## 0.0.15

- You can pass tools at the agent definition, thread definition, or per-message
  call, making it easier to define tools at runtime with runtime context.

- README improvements

### Breaking Changes

- `getEmbeddings` has been renamed to `generateEmbeddings`

### Deprecated

- Passing `ConfigOptions` and `StorageOptions` should now be passed as separate
  parameters via `configOptions` and `storageOptions`. e.g. for `generateText`
  `{ prompt }, { contextOptions: { recentMessages: 10 } }` instead of
  `{ prompt, recentMessages: 10 }`

## 0.0.14

- There is now a usageHandler you can specify on the Agent definition, thread,
  or per-message that can log or save token usage history.

- The model and provider are being stored on the messages table, along with
  usage, warnings, and other fields previously hidden away in the steps table.

### Bug fixes

- The agent name is now correctly propagating to the messages table for non-user
  messages.

### Deprecated

- parentThreadIds is deprecated, as it wasn't merging histories and the desire
  to do so should have a message as its parent to make the history behavior
  clear.



================================================
FILE: CONTRIBUTING.md
================================================
# Developing guide

## Running locally

```sh
npm run setup
npm run dev
```

## Testing

```sh
npm run clean
npm run build
npm run test
npm run typecheck
npm run lint
```

## Deploying

### Building a one-off package

```sh
npm run clean
npm run build
npm pack
```

### Deploying a new version

Patch release:

```sh
npm run release
```

#### Alpha release

The same as above, but it requires extra flags so the release is only installed
with `@alpha`:

```sh
npm run alpha
```

# Idea/ feature backlog:

- Convenience function to create a thread by copying an existing thread (fork)
- Add a "failed" message when an error is thrown in generate/stream call.
- Add a "failed" message when a stream is aborted.
- Enable saving a message as part of the same `order` as a given message.
  - Validate that you can save a tool response, and use that as promptMessageId
    and have the response assistant message be on the same order & after the
    tool call message stepOrder.
  - Return the order from `saveMessage` so it can be used for idempotency &
    appending, if not already returned
  - Return more message metadata from `generateText` & `streamText` - all
    message info, not just prompt id
- Support new AI SDK version (and LanguageModelProviderV2)
- Add a `contextHandler` option to the Agent component, that can be used to see
  and modify the context passed to the LLM before it's called.
  - take in { searchMessages, recentMessages, systemMessage, promptMessage }
  - returns single message[]? - can add / prune / modify or { searchMessages,
    recentMessages, systemMessage, promptMessage } or something else?
- When aborting a stream, save the in-progress message as failed with the
  contents so far, and replace the abort.
- Allow aborting normal generateText
- Add a placeholder aborted message, check for that when adding step (conflict
  in step order)
- Improve the demo to show more of the features & have nicer UI
  - Add an example of aborting a stream.
  - Add an example of using tracing / telemetry.
- When adding messages, increment order for each user message
- Refactor agent code to more helper functions, and break up `client/index.ts`
  into more files.
- Add a `deleteMessageOrder` function that takes a message id, and deletes all
  messages at that message's order.
- Add an example of using MCP with the Agent.
- Automatically turn big text content into a file when saving a message and keep
  as a fileId. Re-hydrate it when reading out for generation.
- Finish deprecating save{All,Any}InputMessages in favor of saveInputMessages &
  other changes
- When a generateText finishes with a tool call, return a `continue` fn that can
  be used to save the tool call response(s) and continue the generation at the
  same order.
- Add a configurable storage provider - consistent API Maybe they have to pass
  in an equivalent of `components.agent.{messages,threads}`

## Playground feature wishlist (contributions welcome!)

- List all threads instead of user dropdown.
  - If a user is logged in, use their userId instead of the apiKey for auth &
    return only their threads.
- Show threads that aren't associated with a user as "no user" in the dropdown.
- Add a "fork thread" button in the right message detail sidebar.
- Add a "retry" button to regenerate a response while tuning the prompt/context.
- Show the contextual messages with their rank in vector & text search, to get a
  sense of what is being found via text vs. vector vs. recency search.
- Show the agent's default context & storage options.
- Show tools and allow calling them directly.
- Generate objects from the UI, not just text.
- Archive messages
- Configure which tools are available when doing one-off messaging.
- Trace older messages for what exact context they used.



================================================
FILE: eslint.config.js
================================================
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { files: ["src/**/*.{js,mjs,cjs,ts,tsx}"] },
  {
    ignores: ["dist/**", "eslint.config.js", "setup.cjs", "**/_generated/"],
  },
  {
    languageOptions: {
      globals: globals.worker,
      parser: tseslint.parser,

      parserOptions: {
        project: true,
        tsconfigRootDir: ".",
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "src/react/**/*.{jsx,tsx}",
      "src/react/**/*.js",
      "src/react/**/*.ts",
    ],
    plugins: { react: reactPlugin, "react-hooks": reactHooks },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs["recommended"].rules,
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "eslint-comments/no-unused-disable": "off",

      // allow (_arg: number) => {} and const _foo = 1;
      "no-unused-vars": "off",
      "no-unused-private-class-members": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];



================================================
FILE: LICENSE
================================================
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1.  Definitions.

    "License" shall mean the terms and conditions for use, reproduction,
    and distribution as defined by Sections 1 through 9 of this document.

    "Licensor" shall mean the copyright owner or entity authorized by
    the copyright owner that is granting the License.

    "Legal Entity" shall mean the union of the acting entity and all
    other entities that control, are controlled by, or are under common
    control with that entity. For the purposes of this definition,
    "control" means (i) the power, direct or indirect, to cause the
    direction or management of such entity, whether by contract or
    otherwise, or (ii) ownership of fifty percent (50%) or more of the
    outstanding shares, or (iii) beneficial ownership of such entity.

    "You" (or "Your") shall mean an individual or Legal Entity
    exercising permissions granted by this License.

    "Source" form shall mean the preferred form for making modifications,
    including but not limited to software source code, documentation
    source, and configuration files.

    "Object" form shall mean any form resulting from mechanical
    transformation or translation of a Source form, including but
    not limited to compiled object code, generated documentation,
    and conversions to other media types.

    "Work" shall mean the work of authorship, whether in Source or
    Object form, made available under the License, as indicated by a
    copyright notice that is included in or attached to the work
    (an example is provided in the Appendix below).

    "Derivative Works" shall mean any work, whether in Source or Object
    form, that is based on (or derived from) the Work and for which the
    editorial revisions, annotations, elaborations, or other modifications
    represent, as a whole, an original work of authorship. For the purposes
    of this License, Derivative Works shall not include works that remain
    separable from, or merely link (or bind by name) to the interfaces of,
    the Work and Derivative Works thereof.

    "Contribution" shall mean any work of authorship, including
    the original version of the Work and any modifications or additions
    to that Work or Derivative Works thereof, that is intentionally
    submitted to Licensor for inclusion in the Work by the copyright owner
    or by an individual or Legal Entity authorized to submit on behalf of
    the copyright owner. For the purposes of this definition, "submitted"
    means any form of electronic, verbal, or written communication sent
    to the Licensor or its representatives, including but not limited to
    communication on electronic mailing lists, source code control systems,
    and issue tracking systems that are managed by, or on behalf of, the
    Licensor for the purpose of discussing and improving the Work, but
    excluding communication that is conspicuously marked or otherwise
    designated in writing by the copyright owner as "Not a Contribution."

    "Contributor" shall mean Licensor and any individual or Legal Entity
    on behalf of whom a Contribution has been received by Licensor and
    subsequently incorporated within the Work.

2.  Grant of Copyright License. Subject to the terms and conditions of
    this License, each Contributor hereby grants to You a perpetual,
    worldwide, non-exclusive, no-charge, royalty-free, irrevocable
    copyright license to reproduce, prepare Derivative Works of,
    publicly display, publicly perform, sublicense, and distribute the
    Work and such Derivative Works in Source or Object form.

3.  Grant of Patent License. Subject to the terms and conditions of
    this License, each Contributor hereby grants to You a perpetual,
    worldwide, non-exclusive, no-charge, royalty-free, irrevocable
    (except as stated in this section) patent license to make, have made,
    use, offer to sell, sell, import, and otherwise transfer the Work,
    where such license applies only to those patent claims licensable
    by such Contributor that are necessarily infringed by their
    Contribution(s) alone or by combination of their Contribution(s)
    with the Work to which such Contribution(s) was submitted. If You
    institute patent litigation against any entity (including a
    cross-claim or counterclaim in a lawsuit) alleging that the Work
    or a Contribution incorporated within the Work constitutes direct
    or contributory patent infringement, then any patent licenses
    granted to You under this License for that Work shall terminate
    as of the date such litigation is filed.

4.  Redistribution. You may reproduce and distribute copies of the
    Work or Derivative Works thereof in any medium, with or without
    modifications, and in Source or Object form, provided that You
    meet the following conditions:

    (a) You must give any other recipients of the Work or
    Derivative Works a copy of this License; and

    (b) You must cause any modified files to carry prominent notices
    stating that You changed the files; and

    (c) You must retain, in the Source form of any Derivative Works
    that You distribute, all copyright, patent, trademark, and
    attribution notices from the Source form of the Work,
    excluding those notices that do not pertain to any part of
    the Derivative Works; and

    (d) If the Work includes a "NOTICE" text file as part of its
    distribution, then any Derivative Works that You distribute must
    include a readable copy of the attribution notices contained
    within such NOTICE file, excluding those notices that do not
    pertain to any part of the Derivative Works, in at least one
    of the following places: within a NOTICE text file distributed
    as part of the Derivative Works; within the Source form or
    documentation, if provided along with the Derivative Works; or,
    within a display generated by the Derivative Works, if and
    wherever such third-party notices normally appear. The contents
    of the NOTICE file are for informational purposes only and
    do not modify the License. You may add Your own attribution
    notices within Derivative Works that You distribute, alongside
    or as an addendum to the NOTICE text from the Work, provided
    that such additional attribution notices cannot be construed
    as modifying the License.

    You may add Your own copyright statement to Your modifications and
    may provide additional or different license terms and conditions
    for use, reproduction, or distribution of Your modifications, or
    for any such Derivative Works as a whole, provided Your use,
    reproduction, and distribution of the Work otherwise complies with
    the conditions stated in this License.

5.  Submission of Contributions. Unless You explicitly state otherwise,
    any Contribution intentionally submitted for inclusion in the Work
    by You to the Licensor shall be under the terms and conditions of
    this License, without any additional terms or conditions.
    Notwithstanding the above, nothing herein shall supersede or modify
    the terms of any separate license agreement you may have executed
    with Licensor regarding such Contributions.

6.  Trademarks. This License does not grant permission to use the trade
    names, trademarks, service marks, or product names of the Licensor,
    except as required for reasonable and customary use in describing the
    origin of the Work and reproducing the content of the NOTICE file.

7.  Disclaimer of Warranty. Unless required by applicable law or
    agreed to in writing, Licensor provides the Work (and each
    Contributor provides its Contributions) on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
    implied, including, without limitation, any warranties or conditions
    of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
    PARTICULAR PURPOSE. You are solely responsible for determining the
    appropriateness of using or redistributing the Work and assume any
    risks associated with Your exercise of permissions under this License.

8.  Limitation of Liability. In no event and under no legal theory,
    whether in tort (including negligence), contract, or otherwise,
    unless required by applicable law (such as deliberate and grossly
    negligent acts) or agreed to in writing, shall any Contributor be
    liable to You for damages, including any direct, indirect, special,
    incidental, or consequential damages of any character arising as a
    result of this License or out of the use or inability to use the
    Work (including but not limited to damages for loss of goodwill,
    work stoppage, computer failure or malfunction, or any and all
    other commercial damages or losses), even if such Contributor
    has been advised of the possibility of such damages.

9.  Accepting Warranty or Additional Liability. While redistributing
    the Work or Derivative Works thereof, You may choose to offer,
    and charge a fee for, acceptance of support, warranty, indemnity,
    or other liability obligations and/or rights consistent with this
    License. However, in accepting such obligations, You may act only
    on Your own behalf and on Your sole responsibility, not on behalf
    of any other Contributor, and only if You agree to indemnify,
    defend, and hold each Contributor harmless for any liability
    incurred by, or claims asserted against, such Contributor by reason
    of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.



================================================
FILE: package.json
================================================
{
  "name": "@convex-dev/agent",
  "description": "A agent component for Convex.",
  "repository": "github:get-convex/agent",
  "homepage": "https://github.com/get-convex/agent#readme",
  "bugs": {
    "email": "support@convex.dev",
    "url": "https://github.com/get-convex/agent/issues"
  },
  "version": "0.1.18",
  "license": "Apache-2.0",
  "keywords": [
    "convex",
    "ai",
    "agent",
    "component"
  ],
  "type": "module",
  "scripts": {
    "example": "cd example && npm run dev",
    "dev": "run-p -r 'example' 'build:watch'",
    "prepare": "npm run build",
    "setup": "node setup.cjs --init",
    "dashboard": "cd example && npx convex dashboard",
    "build:watch": "npx chokidar 'tsconfig*.json' 'src/**/*.ts' -c 'npm run build' --initial",
    "build": "tsc --project ./tsconfig.build.json && npm run copy:dts && echo '{\\n  \"type\": \"module\"\\n}' > dist/package.json",
    "copy:dts": "rsync -a --include='*/' --include='*.d.ts' --exclude='*' src/ dist/ || cpy 'src/**/*.d.ts' 'dist/' --parents",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist tsconfig.build.tsbuildinfo",
    "alpha": "npm run clean && npm run build && run-p test lint typecheck && npm version prerelease --preid alpha && npm publish --tag alpha && git push --tags",
    "release": "npm run clean && npm run build && run-p test lint typecheck && npm version patch && npm publish && git push --tags && git push",
    "test": "vitest run --typecheck --config ./src/vitest.config.ts",
    "test:watch": "vitest --typecheck --config ./src/vitest.config.ts",
    "test:debug": "vitest --inspect-brk --no-file-parallelism --config ./src/vitest.config.ts",
    "test:coverage": "vitest run --coverage --coverage.reporter=text",
    "lint": "eslint src",
    "version": "pbcopy <<<$npm_package_version; vim CHANGELOG.md && git add CHANGELOG.md"
  },
  "files": [
    "dist",
    "src"
  ],
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "@convex-dev/component-source": "./src/client/index.ts",
      "types": "./dist/client/index.d.ts",
      "default": "./dist/client/index.js"
    },
    "./validators": {
      "@convex-dev/component-source": "./src/validators.ts",
      "types": "./dist/validators.d.ts",
      "default": "./dist/validators.js"
    },
    "./react": {
      "@convex-dev/component-source": "./src/react/index.ts",
      "types": "./dist/react/index.d.ts",
      "default": "./dist/react/index.js"
    },
    "./convex.config": {
      "@convex-dev/component-source": "./src/component/convex.config.ts",
      "types": "./dist/component/convex.config.d.ts",
      "default": "./dist/component/convex.config.js"
    }
  },
  "peerDependencies": {
    "ai": "^4.3.16",
    "convex": "^1.23.0",
    "convex-helpers": "^0.1.100",
    "react": "^18.3.1 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "^0.17.4",
    "@edge-runtime/vm": "^5.0.0",
    "@eslint/js": "^9.9.1",
    "@types/node": "^20.19.9",
    "@types/react": "^19.1.1",
    "chokidar-cli": "^3.0.0",
    "convex": "^1.24.8",
    "convex-helpers": "0.1.100",
    "convex-test": "^0.0.37",
    "cpy-cli": "^5.0.0",
    "eslint": "^9.24.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "globals": "^15.15.0",
    "npm-run-all2": "^8.0.4",
    "pkg-pr-new": "^0.0.53",
    "prettier": "3.2.5",
    "readline": "^1.3.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.29.1",
    "vite": "^6.3.5",
    "vitest": "^3.1.1",
    "zod": "^3.25.56"
  },
  "main": "./dist/client/index.js",
  "types": "./dist/client/index.d.ts",
  "module": "./dist/client/index.js"
}



================================================
FILE: renovate.json
================================================
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:best-practices"],
  "schedule": ["* 0-4 * * 1"],
  "timezone": "America/Los_Angeles",
  "prConcurrentLimit": 1,
  "packageRules": [
    {
      "groupName": "All dependencies",
      "matchUpdateTypes": ["minor", "patch", "pin", "digest"],
      "automerge": true
    },
    {
      "groupName": "All dependencies",
      "matchUpdateTypes": ["major"],
      "automerge": false
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true
    }
  ]
}



================================================
FILE: setup.cjs
================================================
#!/usr/bin/env node

// "setup": "npm i && npm run build && cd example && npm i",
const { join } = require("path");
const { execSync, spawn } = require("child_process");
const readline = require("readline");

// Check if --init flag is passed
const initFlag = process.argv.includes("--init");

console.log("Installing dependencies for the Agent component...");
execSync("npm install", { cwd: __dirname, stdio: "inherit" });
console.log("✅\n");
console.log("Building the Agent component...");
execSync("npm run build", { cwd: __dirname, stdio: "inherit" });
console.log("✅\n");
console.log("Installing dependencies for the playground...");
execSync("npm install", {
  cwd: join(__dirname, "./playground"),
  stdio: "inherit",
});
console.log("✅\n");
console.log("Installing dependencies for the example...");
execSync("npm install", {
  cwd: join(__dirname, "./example"),
  stdio: "inherit",
});
console.log("✅\n");

if (initFlag) {
  console.log("🚀 Starting interactive setup...\n");

  const exampleDir = join(__dirname, "./example");

  try {
    console.log("Checking backend configuration...");
    execSync("npm run dev:backend -- --once", {
      cwd: exampleDir,
      stdio: "pipe",
    });
    console.log("✅ Backend setup complete! No API key needed.\n");
  } catch (error) {
    const errorOutput =
      ((error.stdout && error.stdout.toString()) || "") +
      ((error.stderr && error.stderr.toString()) || "");

    if (
      errorOutput.includes("OPENAI_API_KEY") ||
      errorOutput.includes("GROQ_API_KEY") ||
      errorOutput.includes("OPENROUTER_API_KEY")
    ) {
      console.log("🔑 LLM API key required. Let's set one up...\n");

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const askQuestion = (question) => {
        return new Promise((resolve) => {
          rl.question(question, resolve);
        });
      };

      const setupApiKey = async () => {
        let apiKey = "";
        let envVarName = "";

        // Ask for OpenAI first
        const wantsOpenAI = await askQuestion(
          "Do you have an OpenAI API key? (y/n): ",
        );
        if (wantsOpenAI.toLowerCase().startsWith("y")) {
          apiKey = await askQuestion("Enter your OpenAI API key: ");
          envVarName = "OPENAI_API_KEY";
        } else {
          // Ask for Groq
          const wantsGroq = await askQuestion(
            "Do you have a Groq API key? (y/n): ",
          );
          if (wantsGroq.toLowerCase().startsWith("y")) {
            apiKey = await askQuestion("Enter your Groq API key: ");
            envVarName = "GROQ_API_KEY";
          } else {
            // Default to OpenRouter
            apiKey = await askQuestion("Enter your OpenRouter API key: ");
            envVarName = "OPENROUTER_API_KEY";
          }
        }

        rl.close();

        if (!apiKey.trim()) {
          console.log("❌ No API key provided. Setup cancelled.");
          process.exit(1);
        }

        // check .env.local - if CONVEX_DEPLOYMENT starts with "local", we need to start a process
        const fs = require("fs");
        const envContent = fs.readFileSync(
          join(exampleDir, ".env.local"),
          "utf8",
        );
        const isLocal = !!envContent
          .split("\n")
          .find((line) => line.startsWith("CONVEX_DEPLOYMENT=local"));
        let convexProcess;
        if (!isLocal) {
          setEnvironmentVariable(exampleDir, envVarName, apiKey);
          return;
        }
        console.log(
          "🔧 Starting Convex dev server to set environment variables...",
        );
        convexProcess = spawn("npx", ["convex", "dev"], {
          cwd: exampleDir,
          stdio: ["inherit", "inherit", "pipe"],
        });

        let readyFound = false;

        const setupTimeout = setTimeout(() => {
          if (!readyFound) {
            console.log(
              "⏰ Timeout waiting for Convex to be ready. Continuing anyway...",
            );
            convexProcess.kill();
            setEnvironmentVariable(exampleDir, envVarName, apiKey);
          }
        }, 30_000);

        convexProcess.stderr.on("data", (data) => {
          const output = data.toString();
          if (output.includes("ready") && !readyFound) {
            readyFound = true;
            clearTimeout(setupTimeout);
            console.log("✅ Convex is ready!");

            setEnvironmentVariable(exampleDir, envVarName, apiKey);

            // Stop the convex dev process
            convexProcess.kill();
            console.log("🎉 Setup complete! You can now run: npm run dev");
          }
        });

        convexProcess.on("exit", (code) => {
          if (!readyFound && code !== 0) {
            console.log(
              "❌ Convex dev process failed. Please try running the setup again.",
            );
            process.exit(1);
          }
        });
      };

      (async () => {
        try {
          await setupApiKey();
        } catch (promptError) {
          rl.close();
          console.log("❌ Setup cancelled:", promptError.message);
          process.exit(1);
        }
      })();
    } else {
      console.log("❌ Backend setup failed with an unexpected error:");
      console.log(error);
      process.exit(1);
    }
  }
} else {
  console.log("Now run: npm run dev");
}

function setEnvironmentVariable(cwd, name, value) {
  try {
    console.log(`Setting ${name}...`);
    execSync(`npx convex env set ${name} "${value}"`, {
      cwd: cwd,
      stdio: "inherit"
    });
    console.log("✅ Environment variable set successfully!");
    console.log("🎉 Setup complete! You can now run: npm run dev");
  } catch (error) {
    console.log("❌ Failed to set environment variable:", error.message);
    process.exit(1);
  }
}



================================================
FILE: tsconfig.build.json
================================================
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts", "src/**/*.js", "src/**/*.d.ts"],
  "exclude": ["src/**/*.test.*", "src/vitest.config.ts"],
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "./dist"
  }
}



================================================
FILE: tsconfig.json
================================================
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "jsx": "react-jsx",

    "target": "ESNext",
    "lib": ["ES2021", "dom", "dom.iterable"],
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    // We enforce stricter module resolution for Node16 compatibility
    // But when building we use Bundler & ESNext for ESM
    "module": "Node16",
    "moduleResolution": "NodeNext",
    // See these docs to get this working:
    //https://github.com/xixixao/convex-typescript-plugin/
    // "plugins": [{ "name": "@xixixao/convex-typescript-plugin" }],
    "paths": {
      "@convex-dev/agent": ["./src/client/index.ts"]
    },

    "composite": true,
    "rootDir": "./src",
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  },
  "include": ["./src/**/*"]
}



================================================
FILE: .prettierrc.json
================================================
{
  "proseWrap": "always",
  "trailingComma": "all"
}



================================================
FILE: docs/context.mdx
================================================
---
title: LLM Context
sidebar_label: "LLM Context"
sidebar_position: 600
description: "Customizing the context provided to the Agent's LLM"
---

By default, the Agent will provide context based on the message history of the
thread. This context is used to generate the next message.

The context can include recent messages, as well as messages found via text and
/or vector search.

You can also use [RAG](./rag.mdx) to add extra context to your prompt.

## Customizing the context

You can customize the context provided to the agent when generating messages
with custom `contextOptions`. These can be set as defaults on the `Agent`, or
provided at the call-site for `generateText` or others.

```ts
const result = await agent.generateText(
  ctx,
  { threadId },
  { prompt },
  {
    // Values shown are the defaults.
    contextOptions: {
      // Whether to exclude tool messages in the context.
      excludeToolMessages: true,
      // How many recent messages to include. These are added after the search
      // messages, and do not count against the search limit.
      recentMessages: 100,
      // Options for searching messages via text and/or vector search.
      searchOptions: {
        limit: 10, // The maximum number of messages to fetch.
        textSearch: false, // Whether to use text search to find messages.
        vectorSearch: false, // Whether to use vector search to find messages.
        // Note, this is after the limit is applied.
        // E.g. this will quadruple the number of messages fetched.
        // (two before, and one after each message found in the search)
        messageRange: { before: 2, after: 1 },
      },
      // Whether to search across other threads for relevant messages.
      // By default, only the current thread is searched.
      searchOtherThreads: false,
    },
  },
);
```

## Search for messages

This is what the agent does automatically, but it can be useful to do manually,
e.g. to find custom context to include.

If you provide a `beforeMessageId`, it will only fetch messages from before that
message.

```ts
import type { MessageDoc } from "@convex-dev/agent";

const messages: MessageDoc[] = await agent.fetchContextMessages(ctx, {
  threadId,
  messages: [{ role: "user", content: prompt }],
  userId, // Optional, unless `searchOtherThreads` is true.
  contextOptions, // Optional, defaults are used if not provided.
});
```

## Searching other threads

If you set `searchOtherThreads` to `true`, the agent will search across all
threads belonging to the provided `userId`. This can be useful to have multiple
conversations that the Agent can reference.

The search will use a hybrid of text and vector search.

## Passing in messages as context

You can pass in messages as context to the Agent's LLM, for instance to
implement [Retrieval-Augmented Generation](./rag.mdx). The final messages sent
to the LLM will be:

1. The system prompt, if one is provided or the agent has `instructions`
2. The messages found via contextOptions
3. The `messages` argument passed into `generateText` or other function calls.
4. If a `prompt` argument was provided, a final
   `{ role: "user", content: prompt }` message.

This allows you to pass in messages that are not part of the thread history and
will not be saved automatically, but that the LLM will receive as context.

## Manage embeddings manually

The `textEmbedding` argument to the Agent constructor allows you to specify a
text embedding model.

If you set this, the agent will automatically generate embeddings for messages
and use them for vector search.

When you change models or decide to start or stop using embeddings for vector
search, you can manage the embeddings manually.

Generate embeddings for a set of messages.

```ts
const embeddings = await supportAgent.generateEmbeddings([
  { role: "user", content: "What is love?" },
]);
```

Get and update embeddings, e.g. for a migration to a new model.

```ts
const messages = await ctx.runQuery(components.agent.vector.index.paginate, {
  vectorDimension: 1536,
  targetModel: "gpt-4o-mini",
  cursor: null,
  limit: 10,
});
```

Updating the embedding by ID.

```ts
const messages = await ctx.runQuery(components.agent.vector.index.updateBatch, {
  vectors: [{ model: "gpt-4o-mini", vector: embedding, id: msg.embeddingId }],
});
```

Note: If the dimension changes, you need to delete the old and insert the new.

Delete embeddings

```ts
await ctx.runMutation(components.agent.vector.index.deleteBatch, {
  ids: [embeddingId1, embeddingId2],
});
```

Insert embeddings

```ts
const ids = await ctx.runMutation(components.agent.vector.index.insertBatch, {
  vectorDimension: 1536,
  vectors: [
    {
      model: "gpt-4o-mini",
      table: "messages",
      userId: "123",
      threadId: "123",
      vector: embedding,
      // Optional, if you want to update the message with the embeddingId
      messageId: messageId,
    },
  ],
});
```



================================================
FILE: docs/debugging.mdx
================================================
---
title: Debugging
sidebar_label: "Debugging"
sidebar_position: 1100
description: "Debugging the Agent component"
---

Generally the [Playground](./playground.mdx) gives a lot of information about
what's happening, but when that is insufficient, you have other options.

## Logging the raw request and response from LLM calls

You can provide a `rawRequestResponseHandler` to the agent to log the raw
request and response from the LLM.

You could use this to log the request and response to a table, or use console
logs with
[Log Streaming](https://docs.convex.dev/production/integrations/log-streams/) to
allow debugging and searching through Axiom or another logging service.

```ts
const supportAgent = new Agent(components.agent, {
  ...
  rawRequestResponseHandler: async (ctx, { request, response }) => {
    console.log("request", request);
    console.log("response", response);
  },
});
```

## Inspecting the database in the dashboard

You can go to the Data tab in the dashboard and select the agent component above
the table list to see the Agent data. The organization of the tables matches the
[schema](../src/component/schema.ts). The most useful tables are:

- `threads` has one row per thread
- `messages` has a separate row for each CoreMessage - e.g. a user message,
  assistant tool call, tool result, assistant message, etc. The most important
  fields are `agentName` for which agent it's associated with, `status`, `order`
  and `stepOrder` which are used to order the messages, and `message` which is
  roughly what is passed to the LLM.
- `streamingMessages` has an entry for each streamed message, until it's cleaned
  up. You can take the ID to look at the associated `streamDeltas` table.
- `files` captures the files tracked by the Agent from content that was sent in
  a message that got stored in File Storage.

## Troubleshooting

### Circular dependencies

Having the return value of workflows depend on other Convex functions can lead
to circular dependencies due to the `internal.foo.bar` way of specifying
functions. The way to fix this is to explicitly type the return value of the
workflow. When in doubt, add return types to more `handler` functions, like
this:

```diff
 export const supportAgentWorkflow = workflow.define({
   args: { prompt: v.string(), userId: v.string(), threadId: v.string() },
+  handler: async (step, { prompt, userId, threadId }): Promise<string> => {
     // ...
   },
 });

 // And regular functions too:
 export const myFunction = action({
   args: { prompt: v.string() },
+  handler: async (ctx, { prompt }): Promise<string> => {
     // ...
   },
 });
```



================================================
FILE: docs/files.mdx
================================================
---
title: Files and Images in Agent messages
sidebar_label: "Files"
sidebar_position: 1000
description: "Working with images and files in the Agent component"
---

You can add images and files for the LLM to reference in the messages.

NOTE: Sending URLs to LLMs is much easier with the cloud backend, since it has
publicly available storage URLs. To develop locally you can use `ngrok` or
similar to proxy the traffic.

Example code:

- [files/autoSave.ts](../example/convex/files/autoSave.ts) has a simple example
  of how to use the automatic file saving.
- [files/addFile.ts](../example/convex/files/addFile.ts) has an example of how
  to save the file, submit a question, and generate a response in separate
  steps.
- [files/generateImage.ts](../example/convex/files/generateImage.ts) has an
  example of how to generate an image and save it in an assistant message.
- [FilesImages.tsx](../example/ui/files/FilesImages.tsx) has client-side code.

## Running the example

```sh
git clone https://github.com/get-convex/agent.git
cd agent
npm run setup
npm run example
```

## Sending an image by uploading first and generating asynchronously

The standard approach is to:

1. Upload the file to the database (`uploadFile` action). Note: this can be in a
   regular action or in an httpAction, depending on what's more convenient.
2. Send a message to the thread (`submitFileQuestion` action)
3. Send the file to the LLM to generate / stream text asynchronously
   (`generateResponse` action)
4. Query for the messages from the thread (`listThreadMessages` query)

Rationale:

It's better to submit a message in a mutation vs. an action because you can use
an optimistic update on the client side to show the sent message immediately and
have it disappear exactly when the message comes down in the query.

However, you can't save to file storage from a mutation, so the file needs to
already exist (hence the fileId).

You can then asynchronously generate the response (with retries / etc) without
the client waiting.

### 1: Saving the file

```ts
import { storeFile } from "@convex-dev/agent";
import { components } from "./_generated/api";

const { file } = await storeFile(
  ctx,
  components.agent,
  new Blob([bytes], { type: mimeType }),
  filename,
  sha256,
);
const { fileId, url, storageId } = file;
```

### 2: Sending the message

```ts
// in your mutation
const { filePart, imagePart } = await getFile(ctx, components.agent, fileId);
const { messageId } = await fileAgent.saveMessage(ctx, {
  threadId,
  message: {
    role: "user",
    content: [
      imagePart ?? filePart, // if it's an image, prefer that kind.
      { type: "text", text: "What is this image?" },
    ],
  },
  metadata: { fileIds: [fileId] }, // IMPORTANT: this tracks the file usage.
});
```

### 3: Generating the response & querying the responses

This is done in the same way as text inputs.

```ts
// in an action
await thread.generateText({ promptMessageId: messageId });
```

```ts
// in a query
const messages = await agent.listMessages(ctx, { threadId, paginationOpts });
```

## Inline saving approach

You can also pass in an image / file direction when generating text, if you're
in an action. Any image or file passed in the `message` argument will
automatically be saved in file storage if it's larger than 64k, and a fileId
will be saved to the message.

Example:

```ts
await thread.generateText({
  message: {
    role: "user",
    content: [
      { type: "image", image: imageBytes, mimeType: "image/png" },
      { type: "text", text: "What is this image?" },
    ],
  },
});
```

## Under the hood

Saving to the files has 3 components:

1. Saving to file storage (in your app, not in the component's storage). This
   means you can access it directly with the `storageId` and generate URLs.
2. Saving a reference (the storageId) to the file in the component. This will
   automatically keep track of how many messages are referencing the file, so
   you can vacuum files that are no longer used (see
   [files/vacuum.ts](../example/convex/files/vacuum.ts)).
3. Inserting a URL in place of the data in the message sent to the LLM, along
   with the mimeType and other metadata provided. It will be inferred if not
   provided in
   [`guessMimeType`](https://github.com/get-convex/agent/blob/main/src/mapping.ts#L227).

### Can I just store the file myself an pass in a URL?

Yes! You can always pass a URL in the place of an image or file to the LLM.

```ts
const storageId = await ctx.storage.store(blob);
const url = await ctx.storage.getUrl(storageId);

await thread.generateText({
  message: {
    role: "user",
    content: [
      { type: "image", data: url, mimeType: blob.type },
      { type: "text", text: "What is this image?" },
    ],
  },
});
```

## Generating images

There's an example in
[files/generateImage.ts](../example/convex/files/generateImage.ts) that takes a
prompt, generates an image with OpenAI's dall-e 2, then saves the image to a
thread.

You can try it out with:

```sh
npx convex run files:generateImage:replyWithImage '{prompt: "make a picture of a cat" }'
```



================================================
FILE: docs/getting-started.mdx
================================================
---
title: "Getting Started with Agent"
sidebar_label: "Getting Started"
sidebar_position: 100
description: "Setting up the agent component"
---

To install the agent component, you'll need an existing Convex project. New to
Convex? Go through the [tutorial](https://docs.convex.dev/tutorial/).

Run `npm create convex` or follow any of the
[quickstarts](https://docs.convex.dev/home) to set one up.

## Installation

Install the component package:

```ts
npm install @convex-dev/agent
```

Create a `convex.config.ts` file in your app's `convex/` folder and install the
component by calling `use`:

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);

export default app;
```

Then run `npx convex dev` to generate code for the component. This needs to
successfully run once before you start defining Agents.

## Defining your first Agent

```ts
import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
  name: "My Agent",
  chat: openai.chat("gpt-4o-mini"),
});
```

Using it:

```ts
import { action } from "./_generated/server";
import { v } from "convex/values";

export const helloWorld = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    // const userId = await getAuthUserId(ctx);
    const { thread } = await agent.createThread(ctx, { userId });
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
```

If you get type errors about `components.agent`, ensure you've run
`npx convex dev` to generate code for the component.

That's it! Next check out creating [Threads](./threads.mdx) and
[Messages](./messages.mdx).

### Customizing the agent

The agent by default only needs a `chat` model to be configured. However, for
vector search, you'll need a `textEmbedding` model. A `name` is helpful to
attribute each message to a specific agent. Other options are defaults that can
be over-ridden at each LLM call-site.

```ts
import { tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "./_generated/api";

// Define an agent similarly to the AI SDK
const supportAgent = new Agent(components.agent, {
  // The chat completions model to use for the agent.
  chat: openai.chat("gpt-4o-mini"),
  // The default system prompt if not over-ridden.
  instructions: "You are a helpful assistant.",
  tools: {
    // Convex tool
    myConvexTool: createTool({
      description: "My Convex tool",
      args: z.object({...}),
      // Note: annotate the return type of the handler to avoid type cycles.
      handler: async (ctx, args): Promise<string> => {
        return "Hello, world!";
      },
    }),
    // Standard AI SDK tool
    myTool: tool({ description, parameters, execute: () => {}}),
  },
  // Embedding model to power vector search of message history (RAG).
  textEmbedding: openai.embedding("text-embedding-3-small"),
  // Used for fetching context messages. See https://docs.convex.dev/agents/context
  contextOptions,
  // Used for storing messages. See https://docs.convex.dev/agents/messages
  storageOptions,
  // Used for limiting the number of steps when tool calls are involved.
  // NOTE: if you want tool calls to happen automatically with a single call,
  // you need to set this to something greater than 1 (the default).
  maxSteps: 1,
  // Used for limiting the number of retries when a tool call fails. Default: 3.
  maxRetries: 3,
  // Used for tracking token usage. See https://docs.convex.dev/agents/usage-tracking
  usageHandler: async (ctx, { model, usage }) => {
    // ... log, save usage to your database, etc.
  },
});
```



================================================
FILE: docs/human-agents.mdx
================================================
---
title: Human Agents
sidebar_label: "Human Agents"
sidebar_position: 900
description: "Saving messages from a human as an agent"
---

The Agent component generally takes a prompt from a human or agent, and uses an
LLM to generate a response.

However, there are cases where you want to generate the reply from a human
acting as an agent, such as for customer support.

For full code, check out [chat/human.ts](../example/convex/chat/human.ts)

## Saving a user message without generating a reply

You can save a message from a user without generating a reply by using the
`saveMessage` function.

```ts
import { saveMessage } from "@convex-dev/agent";
import { components } from "./_generated/api";

await saveMessage(ctx, components.agent, {
  threadId,
  prompt: "The user message",
});
```

## Saving a message from a human as an agent

Similarly, you can save a message from a human as an agent in the same way,
using the `message` field to specify the role and agent name:

```ts
import { saveMessage } from "@convex-dev/agent";
import { components } from "./_generated/api";

await saveMessage(ctx, components.agent, {
  threadId,
  agentName: "Alex",
  message: { role: "assistant", content: "The human reply" },
});
```

## Storing additional metadata about human agents

You can store additional metadata about human agents by using the `saveMessage`
function, and adding the `metadata` field.

```ts
await saveMessage(ctx, components.agent, {
  threadId,
  agentName: "Alex",
  message: { role: "assistant", content: "The human reply" },
  metadata: {
    provider: "human",
    providerMetadata: {
      human: {
        /* ... */
      },
    },
  },
});
```

## Deciding who responds next

You can choose whether the LLM or human responds next in a few ways:

1. Explicitly store in the database whether the user or LLM is assigned to the
   thread.
2. Using a call to a cheap and fast LLM to decide if the user question requires
   a human response.
3. Using vector embeddings of the user question and message history to make the
   decision, based on a corpus of sample questions and what questions are better
   handled by humans.
4. Have the LLM generate an object response that includes a field indicating
   whether the user question requires a human response.
5. Providing a tool to the LLM to decide if the user question requires a human
   response. The human response is then the tool response message.

## Human responses as tool calls

You can have the LLM generate a tool call to a human agent to provide context to
answer the user question by providing a tool that doesn't have a handler. Note:
this generally happens when the LLM still intends to answer the question, but
needs human intervention to do so, such as confirmation of a fact.

```ts
import { tool } from "ai";
import { z } from "zod";

const askHuman = tool({
  description: "Ask a human a question",
  parameters: z.object({
    question: z.string().describe("The question to ask the human"),
  }),
});

export const ask = action({
  args: { question: v.string(), threadId: v.string() },
  handler: async (ctx, { question, threadId }) => {
    const result = await agent.generateText(
      ctx,
      { threadId },
      {
        prompt: question,
        tools: { askHuman },
      },
    );
    const supportRequests = result.toolCalls
      .filter((tc) => tc.toolName === "askHuman")
      .map(({ toolCallId, args: { question } }) => ({
        toolCallId,
        question,
      }));
    if (supportRequests.length > 0) {
      // Do something so the support agent knows they need to respond,
      // e.g. save a message to their inbox
      // await ctx.runMutation(internal.example.sendToSupport, {
      //   threadId,
      //   supportRequests,
      // });
    }
  },
});

export const humanResponseAsToolCall = internalAction({
  args: {
    humanName: v.string(),
    response: v.string(),
    toolCallId: v.string(),
    threadId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await agent.saveMessage(ctx, {
      threadId: args.threadId,
      message: {
        role: "tool",
        content: [
          {
            type: "tool-result",
            result: args.response,
            toolCallId: args.toolCallId,
            toolName: "askHuman",
          },
        ],
      },
      metadata: {
        provider: "human",
        providerMetadata: {
          human: { name: args.humanName },
        },
      },
    });
    // Continue generating a response from the LLM
    await agent.generateText(
      ctx,
      { threadId: args.threadId },
      {
        promptMessageId: args.messageId,
      },
    );
  },
});
```



================================================
FILE: docs/messages.mdx
================================================
---
title: Messages
sidebar_label: "Messages"
sidebar_position: 300
description: "Sending and receiving messages with an agent"
---

The Agent component stores message and [thread](./threads.mdx) history to enable
conversations between humans and agents.

To see how humans can act as agents, see [Human Agents](./human-agents.mdx).

## Generating a message

To generate a message, you provide a prompt (as a string or a list of messages)
to be used as context to generate one or more messages via an LLM, using calls
like `streamText` or `generateObject`.

The message history will be provided by default as context. See
[LLM Context](./context.mdx) for details on configuring the context provided.

The arguments to `generateText` and others are the same as the AI SDK, except
you don't have to provide a model. By default it will use the agent's chat
model.

Note: `authorizeThreadAccess` referenced below is a function you would write to
authenticate and authorize the user to access the thread. You can see an example
implementation in [threads.ts](../example/convex/threads.ts).

See [chat/basic.ts](../example/convex/chat/basic.ts) or
[chat/streaming.ts](../example/convex/chat/streaming.ts) for live code examples.

### Basic approach (synchronous)

```ts
export const generateReplyToPrompt = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // await authorizeThreadAccess(ctx, threadId);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
```

Note: best practice is to not rely on returning data from the action.Instead,
query for the thread messages via the `useThreadMessages` hook and receive the
new message automatically. See below.

### Saving the prompt then generating response(s) asynchronously

While the above approach is simple, generating responses asynchronously provide
a few benefits:

- You can set up optimistic UI updates on mutations that are transactional, so
  the message will be shown optimistically on the client until the message is
  saved and present in your message query.
- You can save the message in the same mutation (transaction) as other writes to
  the database. This message can the be used and re-used in an action with
  retries, without duplicating the prompt message in the history. See
  [workflows](./workflows.mdx) for more details.
- Thanks to the transactional nature of mutations, the client can safely retry
  mutations for days until they run exactly once. Actions can transiently fail.

Any clients listing the messages will automatically get the new messages as they
are created asynchronously.

To generate responses asynchronously, you need to first save the message, then
pass the `messageId` as `promptMessageId` to generate / stream text.

```ts
import { components, internal } from "./_generated/api";
import { saveMessage } from "@convex-dev/agent";
import { internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";

// Step 1: Save a user message, and kick off an async response.
export const sendMessage = mutation({
  args: { threadId: v.id("threads"), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const userId = await getUserId(ctx);
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      userId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.example.generateResponseAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

// Step 2: Generate a response to a user message.
export const generateResponseAsync = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await agent.generateText(ctx, { threadId }, { promptMessageId });
  },
});

// This is a common enough need that there's a utility to save you some typing.
// Equivalent to the above.
export const generateResponseAsync = agent.asTextAction();
```

Note: when calling `agent.saveMessage`, embeddings are generated automatically
when you save messages from an action and you have a text embedding model set.
However, if you're saving messages in a mutation, where calling an LLM is not
possible, it will generate them automatically when `generateText` receives a
`promptMessageId` that lacks an embedding and you have a text embedding model
configured. This is useful for workflows where you want to save messages in a
mutation, but not generate them. In these cases, pass `skipEmbeddings: true` to
`agent.saveMessage` to avoid the warning. If you're calling `saveMessage`
directly, you need to provide the embedding yourself, so `skipEmbeddings` is not
a parameter.

### Streaming

Streaming follows the same pattern as the basic approach, but with a few
differences, depending on the type of streaming you're doing.

The easiest way to stream is to pass `{ saveStreamDeltas: true }` to
`streamText`. This will save chunks of the response as deltas as they're
generated, so all clients can subscribe to the stream and get live-updating text
via normal Convex queries. See below for details on how to retrieve and display
the stream.

```ts
const { thread } = await storyAgent.continueThread(ctx, { threadId });
const result = await thread.streamText({ prompt }, { saveStreamDeltas: true });
// We need to make sure the stream is finished - by awaiting each chunk or
// using this call to consume it all.
await result.consumeStream();
```

This can be done in an async function, where http streaming to a client is not
possible. Under the hood it will chunk up the response and debounce saving the
deltas to prevent excessive bandwidth usage. You can pass more options to
`saveStreamDeltas` to configure the chunking and debouncing.

```ts
  { saveStreamDeltas: { chunking: "line", throttleMs: 1000 } },
```

- `chunking` can be "word", "line", a regex, or a custom function.
- `throttleMs` is how frequently the deltas are saved. This will send multiple
  chunks per delta, writes sequentially, and will not write faster than the
  throttleMs
  ([single-flighted](https://stack.convex.dev/throttling-requests-by-single-flighting)
  ).

You can also consume the stream in all the ways you can with the underlying AI
SDK - for instance iterating over the content, or using
[`result.toDataStreamResponse()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-data-stream-response).

```ts
const result = await thread.streamText({ prompt });
// Note: if you do this, don't also call `.consumeStream()`.
for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

See below for how to retrieve the stream deltas to a client.

### Generating an object

Similar to the AI SDK, you can generate or stream an object. The same arguments
apply, except you don't have to provide a model. It will use the agent's default
chat model.

```ts
import { z } from "zod";

const result = await thread.generateObject({
  prompt: "Generate a plan based on the conversation so far",
  schema: z.object({...}),
});
```

## Retrieving messages

For streaming, it will save deltas to the database, so all clients querying for
messages will get the stream.

See [chat/basic.ts](../example/convex/chat/basic.ts) for the server-side code,
and [chat/streaming.ts](../example/convex/chat/streaming.ts) for the streaming
example.

You have a function that both allows paginating over messages. To support
streaming, you can also take in a `streamArgs` object and return the `streams`
result from `syncStreams`.

```ts
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { listMessages } from "@convex-dev/agent";
import { components } from "./_generated/api";

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, paginationOpts }) => {
    // await authorizeThreadAccess(ctx, threadId);

    const paginated = await listMessages(ctx, components.agent, {
      threadId,
      paginationOpts,
    });

    // Here you could filter out / modify the documents
    return paginated;
  },
});
```

### Retrieving streamed deltas

To retrieve the stream deltas, you only have to make a few changes to the query:

```diff
 import { paginationOptsValidator } from "convex/server";
-import { listMessages } from "@convex-dev/agent";
+import { vStreamArgs, listMessages, syncStreams } from "@convex-dev/agent";
 import { components } from "./_generated/api";

 export const listThreadMessages = query({
   args: {
     threadId: v.string(),
     paginationOpts: paginationOptsValidator,
+    streamArgs: vStreamArgs,
   },
   handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
     // await authorizeThreadAccess(ctx, threadId);

     const paginated = await listMessages(ctx, components.agent, {
       threadId,
       paginationOpts
     });
+    const streams = await syncStreams(ctx, components.agent, {
+      threadId,
+      streamArgs
+    });

     // Here you could filter out / modify the documents & stream deltas.
-    return paginated;
+    return { ...paginated, streams };
   },
 });
```

You can then use the instructions below along with the `useSmoothText` hook to
show the streaming text in a UI.

## Showing messages in React

See [ChatStreaming.tsx](../example/ui/chat/ChatStreaming.tsx) for a streaming
example, or [ChatBasic.tsx](../example/ui/chat/ChatBasic.tsx) for a
non-streaming example.

### `useThreadMessages` hook

The crux is to use the `useThreadMessages` hook. For streaming, pass in
`stream: true` to the hook.

```tsx
import { api } from "../convex/_generated/api";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";

function MyComponent({ threadId }: { threadId: string }) {
  const messages = useThreadMessages(
    api.chat.streaming.listMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );
  return (
    <div>
      {toUIMessages(messages.results ?? []).map((message) => (
        <div key={message.key}>{message.content}</div>
      ))}
    </div>
  );
}
```

### `toUIMessages` helper

```ts
import { toUIMessages, type UIMessage } from "@convex-dev/agent/react";
```

`toUIMessages` is a helper function that transforms messages into AI SDK
"UIMessage"s. This is a convenient data model for displaying messages:

- `parts` is an array of parts (e.g. "text", "file", "image", "toolCall",
  "toolResult")
- `content` is a string of the message content.
- `role` is the role of the message (e.g. "user", "assistant", "system").

The helper also adds some additional fields:

- `key` is a unique identifier for the message.
- `order` is the order of the message in the thread.
- `stepOrder` is the step order of the message in the thread.
- `status` is the status of the message (or "streaming").
- `agentName` is the name of the agent that generated the message.

To reference these, ensure you're importing `UIMessage` from
`@convex-dev/agent/react`.

### Text smoothing with the `useSmoothText` hook

The `useSmoothText` hook is a simple hook that smooths the text as it changes.
It can work with any text, but is especially handy for streaming text.

```ts
import { useSmoothText } from "@convex-dev/agent/react";

// in the component
const [visibleText] = useSmoothText(message.content);
```

You can configure the initial characters per second. It will adapt over time to
match the average speed of the text coming in.

By default it won't stream the first text it receives unless you pass in
`startStreaming: true`. To start streaming immediately when you have a mix of
streaming and non-streaming messages, do:

```ts
import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";

function Message({ message }: { message: UIMessage }) {
  const [visibleText] = useSmoothText(message.content, {
    startStreaming: message.status === "streaming",
  });
  return <div>{visibleText}</div>;
}
```

### Optimistic updates for sending messages

The `optimisticallySendMessage` function is a helper function for sending a
message, so you can optimistically show a message in the message list until the
mutation has completed on the server.

Pass in the query that you're using to list messages, and it will insert the
ephemeral message at the top of the list.

```ts
const sendMessage = useMutation(
  api.streaming.streamStoryAsynchronously,
).withOptimisticUpdate(
  optimisticallySendMessage(api.streaming.listThreadMessages),
);
```

If your arguments don't include `{ threadId, prompt }` then you can use it as a
helper function in your optimistic update:

```ts
import { optimisticallySendMessage } from "@convex-dev/agent/react";

const sendMessage = useMutation(
  api.chatStreaming.streamStoryAsynchronously,
).withOptimisticUpdate(
  (store, args) => {
    optimisticallySendMessage(api.chatStreaming.listThreadMessages)(store, {
      threadId:
      prompt: /* change your args into the user prompt. */,
    })
  }
);
```

## Saving messages manually

By default, the Agent will save messages to the database automatically when you
provide them as a prompt, as well as all generated messages.

You can save messages to the database manually using `saveMessage` or
`saveMessages`.

```ts
const { messageId } = await agent.saveMessage(ctx, {
  threadId,
  userId,
  prompt,
  metadata,
});
```

You can pass a `prompt` or a full `message` (`CoreMessage` type)

```ts
const { lastMessageId, messageIds} = await agent.saveMessages(ctx, {
  threadId, userId,
  messages: [{ role, content }],
  metadata: [{ reasoning, usage, ... }] // See MessageWithMetadata type
});
```

If you are saving the message in a mutation and you have a text embedding model
set, pass `skipEmbeddings: true`. The embeddings for the message will be
generated lazily if the message is used as a prompt. Or you can provide an
embedding upfront if it's available, or later explicitly generate them using
`agent.generateEmbeddings`.

The `metadata` argument is optional and allows you to provide more details, such
as `sources`, `reasoningDetails`, `usage`, `warnings`, `error`, etc.

## Configuring the storage of messages

Generally the defaults are fine, but if you want to pass in multiple messages
and have them all saved (vs. just the last one), or avoid saving any input or
output messages, you can pass in a `storageOptions` object, either to the Agent
constructor or per-message.

The use-case for passing in multiple messages but not saving them is if you want
to include some extra messages for context to the LLM, but only the last message
is the user's actual request. e.g.
`messages = [...messagesFromRag, messageFromUser]`. The default is to save the
prompt and all output messages.

```ts
const result = await thread.generateText({ messages }, {
  storageOptions: {
    saveMessages: "all" | "none" | "promptAndOutput";
  },
});
```

## Message ordering

Each message has `order` and `stepOrder` fields, which are incrementing integers
specific to a thread.

When `saveMessage` or `generateText` is called, the message is added to the
thread's next `order` with a `stepOrder` of 0.

As response message(s) are generated in response to that message, they are added
at the same `order` with the next `stepOrder`.

To associate a response message with a previous message, you can pass in the
`promptMessageId` to `generateText` and others.

Note: if the `promptMessageId` is not the latest message in the thread, the
context for the message generation will not include any messages following the
`promptMessageId`.

## Deleting messages

You can delete messages by their `_id` (returned from `saveMessage` or
`generateText`) or `order` / `stepOrder`.

By ID:

```ts
await agent.deleteMessage(ctx, { messageId });
// batch delete
await agent.deleteMessages(ctx, { messageIds });
```

By order (start is inclusive, end is exclusive):

```ts
// Delete all messages with the same order as a given message:
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: message.order,
  endOrder: message.order + 1,
});
// Delete all messages with order 1 or 2.
await agent.deleteMessageRange(ctx, { threadId, startOrder: 1, endOrder: 3 });
// Delete all messages with order 1 and stepOrder 2-4
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: 1,
  startStepOrder: 2,
  endOrder: 2,
  endStepOrder: 5,
});
```

## Other utilities:

```ts
import { ... } from "@convex-dev/agent";
```

- `serializeDataOrUrl` is a utility function that serializes an AI SDK
  `DataContent` or `URL` to a Convex-serializable format.
- `filterOutOrphanedToolMessages` is a utility function that filters out tool
  call messages that don't have a corresponding tool result message.
- `extractText` is a utility function that extracts text from a
  `CoreMessage`-like object.

### Validators and types

There are types to validate and provide types for various values

```ts
import { ... } from "@convex-dev/agent";
```

- `vMessage` is a validator for a `CoreMessage`-like object (with a `role` and
  `content` field e.g.).
- `MessageDoc` and `vMessageDoc` are the types for a message (which includes a
  `.message` field with the `vMessage` type).
- `Thread` is the type of a thread returned from `continueThread` or
  `createThread`.
- `ThreadDoc` and `vThreadDoc` are the types for thread metadata.
- `AgentComponent` is the type of the installed component (e.g.
  `components.agent`).
- `ToolCtx` is the `ctx` type for calls to `createTool` tools.



================================================
FILE: docs/playground.mdx
================================================
---
title: Playground
sidebar_label: "Playground"
sidebar_position: 400
description: "A simple way to test, debug, and develop with the agent"
---

The Playground UI is a simple way to test, debug, and develop with the agent.

![Playground UI Screenshot](https://get-convex.github.io/agent/screenshot.png)

- Pick a user to list their threads.
- Browse the user's threads.
- List the selected thread's messages, along with tool call details.
- Show message metadata details.
- Experiment with contextual message lookup, adjusting context options.
- Send a message to the thread, with configurable saving options.
- It uses api keys to communicate securely with the backend.

There is also a [hosted version here](https://get-convex.github.io/agent/).

## Setup

**Note**: You must already have a Convex project set up with the Agent. See the
[docs](./getting-started.mdx) for setup instructions.

In your agent Convex project, make a file `convex/playground.ts` with:

```ts
import { definePlaygroundAPI } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { weatherAgent, fashionAgent } from "./example";

/**
 * Here we expose the API so the frontend can access it.
 * Authorization is handled by passing up an apiKey that can be generated
 * on the dashboard or via CLI via:
 * npx convex run --component agent apiKeys:issue
 */
export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [weatherAgent, fashionAgent],
});
```

From in your project's repo, issue yourself an API key:

```sh
npx convex run --component agent apiKeys:issue '{name:"..."}'
```

Note: to generate multiple keys, give a different name to each key. To revoke
and reissue a key, pass the same name.

Then visit the [hosted version](https://get-convex.github.io/agent/).

It will ask for your Convex deployment URL, which can be found in `.env.local`.
It will also ask for your API key that you generated above. If you used a
different path for `convex/playground.ts` you can enter it. E.g. if you had
`convex/foo/bar.ts` where you exported the playground API, you'd put in
`foo/bar`.

## Running it locally

You can run the playground locally with:

```sh
npx @convex-dev/agent-playground
```

It uses the `VITE_CONVEX_URL` env variable, usually pulling it from .env.local.



================================================
FILE: docs/rag.mdx
================================================
---
title: RAG (Retrieval-Augmented Generation) with the Agent component
sidebar_label: "RAG"
sidebar_position: 700
description: "Examples of how to use RAG with the Convex Agent component"
---

The Agent component has built-in capabilities to search message history with
hybrid text & vector search. You can also use the RAG component to use other
data to search for context.

## What is RAG?

Retrieval-Augmented Generation (RAG) is a technique that allows an LLM to search
through custom knowledge bases to answer questions.

RAG combines the power of Large Language Models (LLMs) with knowledge retrieval.
Instead of relying solely on the model's training data, RAG allows your AI to:

- Search through custom documents and knowledge bases
- Retrieve relevant context for answering questions
- Provide more accurate, up-to-date, and domain-specific responses
- Cite sources and explain what information was used

## RAG Component

<div className="center-image" style={{ maxWidth: "560px" }}>
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/dGmtAmdAaFs?si=ce-M8pt6EWDZ8tfd"
    title="RAG Component YouTube Video"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>

The RAG component is a Convex component that allows you to add data that you can
search. It breaks up the data into chunks and generates embeddings to use for
vector search. See the [RAG component docs](https://convex.dev/components/rag)
for details, but here are some key features:

- **Namespaces:** Use namespaces for user-specific or team-specific data to
  isolate search domains.
- **Add Content**: Add or replace text content by key.
- **Semantic Search**: Vector-based search using configurable embedding models
- **Custom Filtering:** Define filters on each document for efficient vector
  search.
- **Chunk Context**: Get surrounding chunks for better context.
- **Importance Weighting**: Weight content by providing a 0 to 1 "importance" to
  affect per-document vector search results.
- **Chunking flexibility:** Bring your own document chunking, or use the
  default.
- **Graceful Migrations**: Migrate content or whole namespaces without
  disruption.

import { ComponentCardList } from "@site/src/components/ComponentCard";

<ComponentCardList
  items={[
    {
      title: "RAG (Retrieval-Augmented Generation)",
      description:
        "Search documents for relevant content to prompt an LLM using embeddings.",
      href: "https://www.convex.dev/components/rag",
    },
  ]}
/>

## RAG Approaches

This directory contains two different approaches to implementing RAG:

### 1. Prompt-based RAG

A straightforward implementation where the system automatically searches for
relevant context for a user query.

- The message history will only include the original user prompt and the
  response, not the context.
- Looks up the context and injects it into the user's prompt.
- Works well if you know the user's question will _always_ benefit from extra
  context.

For example code, see [ragAsPrompt.ts](../example/convex/rag/ragAsPrompt.ts) for
the overall code. The simplest version is:

```ts
const { thread } = await agent.continueThread(ctx, { threadId });
const context = await rag.search(ctx, {
  namespace: "global",
  query: userPrompt,
  limit: 10,
});

const result = await thread.generateText({
  prompt: `# Context:\n\n ${context.text}\n\n---\n\n# Question:\n\n"""${userPrompt}\n"""`,
});
```

### 2. Tool-based RAG

The LLM can intelligently decide when to search for context or add new
information by providing a tool to search for context.

- The message history will include the original user prompt and message history.
- After a tool call and response, the message history will include the tool call
  and response for the LLM to reference.
- The LLM can decide when to search for context or add new information.
- This works well if you want the Agent to be able to dynamically search.

See [ragAsTools.ts](../example/convex/rag/ragAsTools.ts) for the code. The
simplest version is:

```ts
searchContext: createTool({
  description: "Search for context related to this user prompt",
  args: z.object({ query: z.string().describe("Describe the context you're looking for") }),
  handler: async (ctx, { query }) => {
    const context = await rag.search(ctx, { namespace: userId, query });
    return context.text;
  },
}),
```

## Key Differences

| Feature            | Basic RAG                    | Tool-based RAG                         |
| ------------------ | ---------------------------- | -------------------------------------- |
| **Context Search** | Always searches              | AI decides when to search              |
| **Adding Context** | Manual via separate function | AI can add context during conversation |
| **Flexibility**    | Simple, predictable          | Intelligent, adaptive                  |
| **Use Case**       | FAQ systems, document search | Dynamic knowledge management           |
| **Predictability** | Defined by code              | AI may query too much or little        |

## Ingesting content

On the whole, the RAG component works with text. However, you can turn other
files into text, either using parsing tools or asking an LLM to do it.

### Parsing images

Image parsing does oddly well with LLMs. You can use `generateText` to describe
and transcribe the image, and then use that description to search for relevant
context. And by storing the associated image, you can then pass the original
file around once you've retrieved it via searching.

[See an example here](https://github.com/get-convex/rag/blob/main/example/convex/getText.ts#L28-L42).

```ts
const description = await thread.generateText({
  message: {
    role: "user",
    content: [{ type: "image", data: url, mimeType: blob.type }],
  },
});
```

### Parsing PDFs

For PDF parsing, I suggest using Pdf.js in the browser.

**Why not server-side?**

Opening up the pdf can use hundreds of MB of memory, and requires downloading a
big pdfjs bundle - so big it's usually fetched dynamically in practice. You
probably wouldn't want to load that bundle on every function call server-side,
and you're more limited on memory usage in serverless environments. If the
browser already has the file, it's a pretty good environment to do the heavy
lifting in (and free!).

There's an example in
[the RAG demo](https://github.com/get-convex/rag/blob/main/example/src/pdfUtils.ts#L14),
[used in the UI here](https://github.com/get-convex/rag/blob/main/example/src/components/UploadSection.tsx#L51),
[with Pdf.js served statically](https://github.com/get-convex/rag/blob/main/example/public/pdf-worker/).

If you really want to do it server-side and don't worry about cost or latency,
you can pass it to an LLM, but note it takes a long time for big files.

[See an example here](https://github.com/get-convex/rag/blob/main/example/convex/getText.ts#L50-L65).

### Parsing text files

Generally you can use text files directly, for code or markdown or anything
with a natural structure an LLM can understand.

However, to get good embeddings, you can once again use an LLM to translate the
text into a more structured format.

[See an example here](https://github.com/get-convex/rag/blob/main/example/convex/getText.ts#L68-L89).

## Examples in Action

To see these examples in action, check out the
[RAG example](https://github.com/get-convex/rag/blob/main/example/convex/example.ts).

- Adding text, pdf, and image content to the RAG component
- Searching and generating text based on the context.
- Introspecting the context produced by searching.
- Browsing the chunks of documents produced.
- Try out searching globally, per-user, or with custom filters.

Run the example with:

```bash
git clone https://github.com/get-convex/rag.git
cd rag
npm run setup
npm run example
```



================================================
FILE: docs/rate-limiting.mdx
================================================
---
title: Rate Limiting
sidebar_label: "Rate Limiting"
sidebar_position: 1200
description: "Control the rate of requests to your AI agent"
---

Rate limiting is a way to control the rate of requests to your AI agent,
preventing abuse and managing API budgets.

To demonstrate using the
[Rate Limiter component](https://www.convex.dev/components/rate-limiter), there
is an example implementation you can run yourself.

It rate limits the number of messages a user can send in a given time period, as
well as the total token usage for a user. When a limit is exceeded, the client
can reactively tell the user how long to wait (even if they exceeded the limit
in another browser tab!).

For general usage tracking, see [Usage Tracking](./usage-tracking.mdx).

## Overview

The rate limiting example demonstrates two types of rate limiting:

1. **Message Rate Limiting**: Prevents users from sending messages too
   frequently
2. **Token Usage Rate Limiting**: Controls AI model token consumption over time

## Running the Example

```sh
git clone https://github.com/get-convex/agent.git
cd agent
npm run setup
npm run example
```

Try sending multiple questions quickly to see the rate limiting in action!

## Rate Limiting Strategy

Below we'll go through each configuration. You can also see the full example
implementation in
[rateLimiting.ts](../example/convex/rate_limiting/rateLimiting.ts).

```ts
import { MINUTE, RateLimiter, SECOND } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessage: {
    kind: "fixed window",
    period: 5 * SECOND,
    rate: 1,
    capacity: 2,
  },
  globalSendMessage: { kind: "token bucket", period: MINUTE, rate: 1_000 },
  tokenUsagePerUser: {
    kind: "token bucket",
    period: MINUTE,
    rate: 2000,
    capacity: 10000,
  },
  globalTokenUsage: { kind: "token bucket", period: MINUTE, rate: 100_000 },
});
```

### 1. Fixed Window Rate Limiting for Messages

```ts
// export const rateLimiter = new RateLimiter(components.rateLimiter, {
sendMessage: { kind: "fixed window", period: 5 * SECOND, rate: 1, capacity: 2 }
```

- Allows 1 message every 5 seconds per user.
- Prevents spam and rapid-fire requests.
- Allows up to a 2 message burst to be sent within 5 seconds via `capacity`, if
  they had usage leftover from the previous 5 seconds.

Global limit:

```ts
globalSendMessage: { kind: "token bucket", period: MINUTE, rate: 1_000 },
```

- Allows 1000 messages per minute globally, to stay under the API limit.
- As a token bucket, it will continuously accrue tokens at the rate of 1000
  tokens per minute until it caps out at 1000. All available tokens can be used
  in quick succession.

### 2. Token Bucket Rate Limiting for Token Usage

```ts
tokenUsage: { kind: "token bucket", period: MINUTE, rate: 1_000 }
globalTokenUsage: { kind: "token bucket", period: MINUTE, rate: 100_000 },
```

- Allows 1000 tokens per minute per user (a userId is provided as the key), and
  100k tokens per minute globally.
- Provides burst capacity while controlling overall usage. If it hasn't been
  used in a while, you can consume all tokens at once. However, you'd then need
  need to wait for tokens to gradually accrue before making more requests.
- Having a per-user limit is useful to prevent single users from hogging all of
  the token bandwidth you have available with your LLM provider, while a global
  limit helps stay under the API limit without throwing an error midway through
  a potentially long multi-step request.

## How It Works

### Step 1: Pre-flight Rate Limit Checks

Before processing a question, the system:

1. Checks if the user can send another message (frequency limit)
2. Estimates token usage for the question
3. Verifies the user has sufficient token allowance
4. Throws an error if either limit would be exceeded
5. If the rate limits aren't exceeded, the LLM request is made.

See [rateLimiting.ts](../example/convex/rate_limiting/rateLimiting.ts) for the
full implementation.

```ts
// In the mutation that would start generating a message.
await rateLimiter.limit(ctx, "sendMessage", { key: userId, throws: true });
// Also check global limit.
await rateLimiter.limit(ctx, "globalSendMessage", { throws: true });

// A heuristic based on the previous token usage in the thread + the question.
const count = await estimateTokens(ctx, args.threadId, args.question);
// Check token usage, but don't consume the tokens yet.
await rateLimiter.check(ctx, "tokenUsage", {
  key: userId,
  count: estimateTokens(args.question),
  throws: true,
});
// Also check global limit.
await rateLimiter.check(ctx, "globalTokenUsage", {
  count,
  reserve: true,
  throws: true,
});
```

If there is not enough allowance, the rate limiter will throw an error that the
client can catch and prompt the user to wait a bit before trying again.

The difference between `limit` and `check` is that `limit` will consume the
tokens immediately, while `check` will only check if the limit would be
exceeded. We actually mark the tokens as used once the request is complete with
the total usage.

### Step 2: Post-generation Usage Tracking

While rate limiting message sending frequency is a good way to prevent many
messages being sent in a short period of time, each message could generate a
very long response or use a lot of context tokens. For this we also track token
usage as its own rate limit.

After the AI generates a response, we mark the tokens as used using the total
usage. We use `reserve: true` to allow a (temporary) negative balance, in case
the generation used more tokens than estimated. A "reservation" here means
allocating tokens beyond what is allowed. Typically this is done ahead of time,
to "reserve" capacity for a big request that can be scheduled in advance. In
this case, we're marking capacity that has already been consumed. This prevents
future requests from starting until the "debt" is paid off.

```ts
await rateLimiter.limit(ctx, "tokenUsage", {
  key: userId,
  count: usage.totalTokens,
  reserve: true, // because of this, it will never fail
});
```

The "trick" here is that, while a user can make a request that exceeds the limit
for a single request, they then have to wait longer to accrue the tokens for
another request. So averaged over time they can't consume more than the rate
limit.

This balances pragmatism of trying to prevent requests ahead of time with an
estimate, while also rate limiting the actual usage.

## Client-side Handling

See [RateLimiting.tsx](../example/ui/rate_limiting/RateLimiting.tsx) for the
client-side code.

While the client isn't the final authority on whether a request should be
allowed, it can still show a waiting message while the rate limit is being
checked, and an error message when the rate limit is exceeded. This prevents the
user from making attempts that are likely to fail.

It makes use of the `useRateLimit` hook to check the rate limits. See the full
[Rate Limiting docs here](https://www.convex.dev/components/rate-limiter).

```ts
import { useRateLimit } from "@convex-dev/rate-limiter/react";
//...
const { status } = useRateLimit(api.example.getRateLimit);
```

In `convex/example.ts` we expose `getRateLimit`:

```ts
export const { getRateLimit, getServerTime } = rateLimiter.hookAPI<DataModel>(
  "sendMessage",
  { key: (ctx) => getAuthUserId(ctx) },
);
```

Showing a waiting message while the rate limit is being checked:

```ts
{status && !status.ok && (
    <div className="text-xs text-gray-500 text-center">
    <p>Message sending rate limit exceeded.</p>
    <p>
        Try again after <Countdown ts={status.retryAt} />
    </p>
    </div>
)}
```

Showing an error message when the rate limit is exceeded:

```ts
import { isRateLimitError } from "@convex-dev/rate-limiter";

// in a button handler
await submitQuestion({ question, threadId }).catch((e) => {
  if (isRateLimitError(e)) {
    toast({
      title: "Rate limit exceeded",
      description: `Rate limit exceeded for ${e.data.name}.
          Try again after ${getRelativeTime(Date.now() + e.data.retryAfter)}`,
    });
  }
});
```

## Token Estimation

The example includes a simple token estimation function:

```ts
import { QueryCtx } from "./_generated/server";
import { fetchContextMessages } from "@convex-dev/agent";
import { components } from "./_generated/api";

// This is a rough estimate of the tokens that will be used.
// It's not perfect, but it's a good enough estimate for a pre-generation check.
export async function estimateTokens(
  ctx: QueryCtx,
  threadId: string | undefined,
  question: string,
) {
  // Assume roughly 4 characters per token
  const promptTokens = question.length / 4;
  // Assume a longer non-zero reply
  const estimatedOutputTokens = promptTokens * 3 + 1;
  const latestMessages = await fetchContextMessages(ctx, components.agent, {
    threadId,
    messages: [{ role: "user" as const, content: question }],
    contextOptions: { recentMessages: 2 },
  });
  // Our new usage will roughly be the previous tokens + the question.
  // The previous tokens include the tokens for the full message history and
  // output tokens, which will be part of our new history.
  const lastUsageMessage = latestMessages
    .reverse()
    .find((message) => message.usage);
  const lastPromptTokens = lastUsageMessage?.usage?.totalTokens ?? 1;
  return lastPromptTokens + promptTokens + estimatedOutputTokens;
}
```



================================================
FILE: docs/threads.mdx
================================================
---
title: Threads
sidebar_label: "Threads"
sidebar_position: 200
description: "Group messages together in a conversation history"
---

Threads are a way to group messages together in a linear history. All messages
saved in the Agent component are associated with a thread. When a message is
generated based on a prompt, it saves the user message and generated agent
message(s) automatically.

Threads can be associated with a user, and messages can each individually be
associated with a user. By default, messages are associated with the thread's
user.

## Creating a thread

You can create a thread in a mutation or action. If you create it in an action,
it will also return a `thread` (see below) and you can start calling LLMs and
generating messages. If you specify a userId, the thread will be associated with
that user and messages will be saved to the user's history.

```ts
const agent = new Agent(components.agent, { chat: chatModel });
//...
const { threadId } = await agent.createThread(ctx);
```

You may also pass in metadata to set on the thread:

```ts
const userId = await getAuthUserId(ctx);
const { threadId } = await agent.createThread(ctx, {
  userId,
  title: "My thread",
  summary: "This is a summary of the thread",
});
```

Metadata may be provided as context to the agent automatically in the future,
but for now it's a convenience that helps organize threads in the
[Playground](./playground.mdx).

## Continuing a thread

You can continue a thread from an action in order to send more messages. Any
agent can continue a thread created by any other agent.

```ts
export const generateReplyToPrompt = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // await authorizeThreadAccess(ctx, threadId);
    const { thread } = await agent.continueThread(ctx, { threadId });
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
```

The `thread` from `continueThread` or `createThread` (available in actions only)
is a `Thread` object, which has convenience methods that are thread-specific:

- `thread.getMetadata()` to get the `userId`, `title`, `summary` etc.
- `thread.updateMetadata({ patch: { title, summary, userId} })` to update the
  metadata
- `thread.generateText({ prompt, ... })` - equivalent to
  `agent.generateText(ctx, { threadId }, { prompt, ... })`
- `thread.streamText({ prompt, ... })` - equivalent to
  `agent.streamText(ctx, { threadId }, { prompt, ... })`
- `thread.generateObject({ prompt, ... })` - equivalent to
  `agent.generateObject(ctx, { threadId }, { prompt, ... })`
- `thread.streamObject({ prompt, ... })` - equivalent to
  `agent.streamObject(ctx, { threadId }, { prompt, ... })`

See [Messages docs](./messages.mdx) for more details on generating messages.

### Overriding behavior with `agent.continueThread`

You can override a few things when using `agent.continueThread`:

```ts
const { thread } = await agent.continueThread(ctx, {
  threadId,
  userId, // Associates generated messages with this user.
  tools, // Replaces the agent's default tools
  usageHandler, // Replaces the agent's default usage handler
});

await thread.generateText({ prompt }); // Uses the thread-specific options.
```

## Deleting threads

You can delete threads by their `threadId`.

Asynchronously (from a mutation or action):

```ts
await agent.deleteThreadAsync(ctx, { threadId });
```

Synchronously in batches (from an action):

```ts
await agent.deleteThreadSync(ctx, { threadId });
```

You can also delete all threads by a user by their `userId`.

```ts
await agent.deleteThreadsByUserId(ctx, { userId });
```

## Getting all threads owned by a user

```ts
const threads = await ctx.runQuery(
  components.agent.threads.listThreadsByUserId,
  { userId, paginationOpts: args.paginationOpts },
);
```

## Deleting all threads and messages associated with a user

Asynchronously (from a mutation or action):

```ts
await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, {
  userId,
});
```

Synchronously (from an action):

```ts
await ctx.runMutation(components.agent.users.deleteAllForUserId, { userId });
```

## Getting messages in a thread

See [messages.mdx](./messages.mdx) for more details.

```ts
import { listMessages } from "@convex-dev/agent";

const messages = await listMessages(ctx, components.agent, {
  threadId,
  excludeToolMessages: true,
  paginationOpts: { cursor: null, numItems: 10 }, // null means start from the beginning
});
```

## Creating a thread without an Agent

Note: if you're in an environment where you don't have access to the Agent, then
you can create the thread more manually:

```ts
const { _id: threadId } = await ctx.runMutation(
  components.agent.threads.createThread,
  { userId, title, summary },
);
```



================================================
FILE: docs/tools.mdx
================================================
---
title: Tools
sidebar_label: "Tools"
sidebar_position: 500
description: "Using tool calls with the Agent component"
---

The Agent component supports tool calls, which are a way to allow an LLM to call
out to external services or functions. This can be useful for:

- Retrieving data from the database
- Writing or updating data in the database
- Searching the web for more context
- Calling an external API
- Requesting that a user takes an action before proceeding (human-in-the-loop)

## Defining tools

You can provide tools at different times:

- Agent constructor: (`new Agent(components.agent, { tools: {...} })`)
- Creating a thread: `createThread(ctx, { tools: {...} })`
- Continuing a thread: `continueThread(ctx, { tools: {...} })`
- On thread functions: `thread.generateText({ tools: {...} })`
- Outside of a thread: `supportAgent.generateText(ctx, {}, { tools: {...} })`

Specifying tools at each layer will overwrite the defaults. The tools will be
`args.tools ?? thread.tools ?? agent.options.tools`. This allows you to create
tools in a context that is convenient.

## Using tools

The Agent component will automatically handle tool calls if you pass `maxSteps`
to the `generateText` or `streamText` functions.

The tool call and result will be stored as messages in the thread associated
with the source message. See [Messages](./messages.mdx) for more details.

## Creating a tool with a Convex context

There are two ways to create a tool that has access to the Convex context.

1. Use the `createTool` function, which is a wrapper around the AI SDK's `tool`
   function.

```ts
export const ideaSearch = createTool({
  description: "Search for ideas in the database",
  args: z.object({ query: z.string().describe("The query to search for") }),
  handler: async (ctx, args, options): Promise<Array<Idea>> => {
    // ctx has agent, userId, threadId, messageId
    // as well as ActionCtx properties like auth, storage, runMutation, and runAction
    const ideas = await ctx.runQuery(api.ideas.searchIdeas, {
      query: args.query,
    });
    console.log("found ideas", ideas);
    return ideas;
  },
});
```

2. Define tools at runtime in a context with the variables you want to use.

```ts
async function createTool(ctx: ActionCtx, teamId: Id<"teams">) {
  const myTool = tool({
    description: "My tool",
    parameters: z.object({...}).describe("The arguments for the tool"),
    execute: async (args, options) => {
      return await ctx.runQuery(internal.foo.bar, args);
    },
  });
}
```

In both cases, the args and options match the underlying AI SDK's `tool`
function.

Note: it's highly recommended to use zod with `.describe` to provide details
about each parameter. This will be used to provide a description of the tool to
the LLM.

### Adding custom context to tools

It's often useful to have extra metadata in the context of a tool.

By default, the context passed to a tool is a `ToolCtx` with:

- `agent` - the Agent instance calling it
- `userId` - the user ID associated with the call, if any
- `threadId` - the thread ID, if any
- `messageId` - the message ID of the prompt message passed to generate/stream.
- Everything in `ActionCtx`, such as `auth`, `storage`, `runQuery`, etc.
  Note: in scheduled functions, workflows, etc, the auth user will be `null`.

To add more fields to the context, you can pass a custom context to the call,
such as `agent.generateText({ ...ctx, orgId: "123" })`.

You can enforce the type of the context by passing a type when constructing the
Agent.

```ts
const myAgent = new Agent<{ orgId: string }>(...);
```

Then, in your tools, you can use the `orgId` field.

```ts
type MyCtx = ToolCtx & { orgId: string };

const myTool = createTool({
  args: z.object({ ... }),
  description: "...",
  handler: async (ctx: MyCtx, args) => {
    // use ctx.orgId
  },
});
```



================================================
FILE: docs/usage-tracking.mdx
================================================
---
title: Usage Tracking
sidebar_label: "Usage Tracking"
sidebar_position: 1300
description: "Tracking token usage of the Agent component"
---

You can provide a `usageHandler` to the agent to track token usage. See an
example in [this demo](../example/convex/usage_tracking/usageHandler.ts) that
captures usage to a table, then scans it to generate per-user invoices.

You can provide a `usageHandler` to the agent, per-thread, or per-message.

```ts
const supportAgent = new Agent(components.agent, {
  ...
  usageHandler: async (ctx, args) => {
    const {
      // Who used the tokens
      userId, threadId, agentName,
      // What LLM was used
      model, provider,
      // How many tokens were used (extra info is available in providerMetadata)
      usage, providerMetadata
    } = args;
    // ... log, save usage to your database, etc.
  },
});
```

Tip: Define the `usageHandler` within a function where you have more variables
available to attribute the usage to a different user, team, project, etc.

## Storing usage in a table

To track usage for e.g. billing, you can define a table in your schema and
insert usage into it for later processing.

```ts
export const usageHandler: UsageHandler = async (ctx, args) => {
  if (!args.userId) {
    console.debug("Not tracking usage for anonymous user");
    return;
  }
  await ctx.runMutation(internal.example.insertRawUsage, {
    userId: args.userId,
    agentName: args.agentName,
    model: args.model,
    provider: args.provider,
    usage: args.usage,
    providerMetadata: args.providerMetadata,
  });
};

export const insertRawUsage = internalMutation({
  args: {
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getBillingPeriod(Date.now());
    return await ctx.db.insert("rawUsage", {
      ...args,
      billingPeriod,
    });
  },
});

function getBillingPeriod(at: number) {
  const now = new Date(at);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth());
  return startOfMonth.toISOString().split("T")[0];
}
```

With an associated schema in `convex/schema.ts`:

```ts
export const schema = defineSchema({
  rawUsage: defineTable({
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),

    // stats
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),

    // In this case, we're setting it to the first day of the current month,
    // using UTC time for the month boundaries.
    // You could alternatively store it as a timestamp number.
    // You can then fetch all the usage at the end of the billing period
    // and calculate the total cost.
    billingPeriod: v.string(), // When the usage period ended
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),

  invoices: defineTable({
    userId: v.string(),
    billingPeriod: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
    ),
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),
  // ... other tables
});
```

## Generating invoices via a cron job

You can use a cron job to generate invoices at the end of the billing period.

See [usage_tracking/invoicing.ts](../example/convex/usage_tracking/invoicing.ts)
for an example of how to generate invoices.

You can then add it to `convex/crons.ts`:

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Generate invoices for the previous month
crons.monthly(
  "generateInvoices",
  // Wait a day after the new month starts to generate invoices
  { day: 2, hourUTC: 0, minuteUTC: 0 },
  internal.usage.generateInvoices,
  {},
);

export default crons;
```



================================================
FILE: docs/workflows.mdx
================================================
---
title: Workflows
sidebar_label: "Workflows"
sidebar_position: 800
description: "Defining long-lived workflows for the Agent component"
---

Agentic Workflows can be decomposed into two elements:

1. Prompting an LLM (including message history, context, etc.).
2. Deciding what to do with the LLM's response.

We generally call them workflows when there are multiple steps involved, they
involve dynamically deciding what to do next, are long-lived, or have a mix of
business logic and LLM calls.

Tool calls and MCP come into play when the LLM's response is a specific request
for an action to take. The list of available tools and result of the calls are
used in the prompt to the LLM.

One especially powerful form of Workflows are those that can be modeled as
[durable functions](https://stack.convex.dev/durable-workflows-and-strong-guarantees)
that can be long-lived, survive server restarts, and have strong guarantees
around retrying, idempotency, and completing.

The simplest version of this could be doing a couple pre-defined steps, such as
first getting the weather forecast, then getting fashion advice based on the
weather. For a code example, see
[workflows/chaining.ts](../example/convex/workflows/chaining.ts).

```ts
export const getAdvice = action({
  args: { location: v.string(), threadId: v.string() },
  handler: async (ctx, { location, threadId }) => {
    // This uses tool calls to get the weather forecast.
    await weatherAgent.generateText(
      ctx,
      { threadId },
      { prompt: `What is the weather in ${location}?` },
    );
    // This includes previous message history from the thread automatically and
    // uses tool calls to get user-specific fashion advice.
    await fashionAgent.generateText(
      ctx,
      { threadId },
      { prompt: `What should I wear based on the weather?` },
    );
    // We don't need to return anything, since the messages are saved
    // automatically and clients will get the response via subscriptions.
  },
});
```

## Building reliable workflows

One common pitfall when working with LLMs is their unreliability. API providers
have outages, and LLMs can be flaky. To build reliable workflows, you often need
three properties:

1. Reliable retries
2. Load balancing
3. Durability and idempotency for multi-step workflows

Thankfully there are Convex components to leverage for these properties.

### Retries

By default, Convex mutations have these properties by default. However, calling
LLMs require side-effects and using the network calls, which necessitates using
actions. If you are only worried about retries, you can use the
[Action Retrier](https://convex.dev/components/retrier) component.

However, keep reading, as the [Workpool](https://convex.dev/components/workpool)
and [Workflow](https://convex.dev/components/workflow) components provide more
robust solutions, including retries.

### Load balancing

With long-running actions in a serverless environment, you may consume a lot of
resources. And with tasks like ingesting data for RAG or other spiky workloads,
there's a risk of running out of resources. To mitigate this, you can use the
[Workpool](https://convex.dev/components/workpool) component. You can set a
limit on the number of concurrent workers and add work asynchronously, with
configurable retries and a callback to handle eventual success / failure.

However, if you also want to manage multi-step workflows, you should use the
[Workflow](https://convex.dev/components/workflow) component, which also
provides retries and load balancing out of the box.

### Durability and idempotency for multi-step workflows

When doing multi-step workflows that can fail mid-way, you need to ensure that
the workflow can be resumed from where it left off, without duplicating work.
The [Workflow](https://convex.dev/components/workflow) builds on the
[Workpool](https://convex.dev/components/workpool) to provide durable execution
of long running functions with retries and delays.

Each step in the workflow is run, with the result recorded. Even if the server
fails mid-way, it will resume with the latest incomplete step, with configurable
retry settings.

## Using the Workflow component for long-lived durable workflows

The [Workflow component](https://convex.dev/components/workflow) is a great way
to build long-lived, durable workflows. It handles retries and guarantees of
eventually completing, surviving server restarts, and more. Read more about
durable workflows in
[this Stack post](https://stack.convex.dev/durable-workflows-and-strong-guarantees).

To use the agent alongside workflows, you can run individual idempotent steps
that the workflow can run, each with configurable retries, with guarantees that
the workflow will eventually complete. Even if the server crashes mid-workflow,
the workflow will pick up from where it left off and run the next step. If a
step fails and isn't caught by the workflow, the workflow's onComplete handler
will get the error result.

### Exposing the agent as Convex actions

You can expose the agent's capabilities as Convex functions to be used as steps
in a workflow.

To create a thread as a standalone mutation, similar to `agent.createThread`:

```ts
export const createThread = supportAgent.createThreadMutation();
```

For an action that generates text in a thread, similar to `thread.generateText`:

```ts
export const getSupport = supportAgent.asTextAction({
  maxSteps: 10,
});
```

You can also expose a standalone action that generates an object.

```ts
export const getStructuredSupport = supportAgent.asObjectAction({
  schema: z.object({
    analysis: z.string().describe("A detailed analysis of the user's request."),
    suggestion: z.string().describe("A suggested action to take."),
  }),
});
```

To save messages explicitly as a mutation, similar to `agent.saveMessages`:

```ts
export const saveMessages = supportAgent.asSaveMessagesMutation();
```

This is useful for idempotency, as you can first create the user's message, then
generate a response in an unreliable action with retries, passing in the
existing messageId instead of a prompt.

### Using the agent actions within a workflow

You can use the [Workflow component](https://convex.dev/components/workflow) to
run agent flows. It handles retries and guarantees of eventually completing,
surviving server restarts, and more. Read more about durable workflows
[in this Stack post](https://stack.convex.dev/durable-workflows-and-strong-guarantees).

```ts
const workflow = new WorkflowManager(components.workflow);

export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (step, { prompt, userId }) => {
    const { threadId } = await step.runMutation(internal.example.createThread, {
      userId,
      title: "Support Request",
    });
    const suggestion = await step.runAction(internal.example.getSupport, {
      threadId,
      userId,
      prompt,
    });
    const { object } = await step.runAction(
      internal.example.getStructuredSupport,
      {
        userId,
        message: suggestion,
      },
    );
    await step.runMutation(internal.example.sendUserMessage, {
      userId,
      message: object.suggestion,
    });
  },
});
```

See the code in
[workflows/chaining.ts](../example/convex/workflows/chaining.ts).

## Complex workflow patterns

While there is only an example of a simple workflow here, there are many complex
patterns that can be built with the Agent component:

- Dynamic routing to agents based on an LLM call or vector search
- Fanning out to LLM calls, then combining the results
- Orchestrating multiple agents
- Cycles of Reasoning and Acting (ReAct)
- Modeling a network of agents messaging each other
- Workflows that can be paused and resumed

import { ComponentCardList } from "@site/src/components/ComponentCard";

<ComponentCardList
  items={[
    {
      title: "Action Retrier",
      description:
        "Add reliability to unreliable external service calls. Retry idempotent calls with exponential backoff until success.",
      href: "https://www.convex.dev/components/retrier",
    },
    {
      title: "Workpool",
      description:
        "Builds on the Action Retrier to provide parallelism limits and retries to manage large numbers of external requests efficiently.",
      href: "https://www.convex.dev/components/workpool",
    },
    {
      title: "Workflow",
      description:
        "Builds on the Workpool to provide durable execution of long running functions with retries and delays.",
      href: "https://www.convex.dev/components/workflow",
    },
  ]}
/>



================================================
FILE: example/README.md
================================================
# Agent Example

This is an example app that uses the `@convex-dev/agent` package.

See the [Agent docs](https://docs.convex.dev/agents) for documentation.

The backend usage is in `convex/`, with folders to organize usecases.
The frontend usage is in `ui/`.

The example exercises many usecases, with the underlying code organized
into folders by category.

The main difference from your app will be:

- What models you use (currently uses `modelsForDemo.ts`)
- Usage handling - currently configures agents to use `usageHandler.ts`
- How you handle auth - currently has an example `authorizeThreadAccess` function.

## Running the example

```bash
git clone https://github.com/get-convex/agent.git
cd agent
npm run setup
npm run dev
```



================================================
FILE: example/components.json
================================================
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "ui/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}



================================================
FILE: example/eslint.config.js
================================================
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "eslint.config.js",
      "convex/_generated",
      "postcss.config.js",
      "tailwind.config.js",
      "vite.config.ts",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: [
          "./tsconfig.node.json",
          "./tsconfig.app.json",
          "./convex/tsconfig.json",
        ],
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // All of these overrides ease getting into
      // TypeScript, and can be removed for stricter
      // linting down the line.

      // Only warn on unused variables, and ignore variables starting with `_`
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],

      // Allow escaping the compiler
      "@typescript-eslint/ban-ts-comment": "error",

      // Allow explicit `any`s
      "@typescript-eslint/no-explicit-any": "off",

      // START: Allow implicit `any`s
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // END: Allow implicit `any`s

      // Allow async functions without await
      // for consistency (esp. Convex `handler`s)
      "@typescript-eslint/require-await": "off",
    },
  },
);



================================================
FILE: example/index.html
================================================
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/convex.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/ui/index.css" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Convex Agent Examples" />
    <meta
      name="twitter:description"
      content="Showcasing @convex-dev/agent features."
    />
    <title>Convex Agent Examples</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/ui/main.tsx"></script>
  </body>
</html>



================================================
FILE: example/package.json
================================================
{
  "name": "agent-example",
  "private": true,
  "type": "module",
  "version": "0.0.0",
  "scripts": {
    "setup": "cd .. && node setup.cjs && cd example && npm run dev:backend -- --once",
    "example": "npm run dev",
    "dev": "run-p dev:frontend dev:backend",
    "dev:backend": "convex dev --live-component-sources --typecheck-components",
    "dev:frontend": "vite",
    "predev": "npx convex dev --until-success",
    "logs": "convex logs",
    "lint": "tsc -p convex && eslint convex"
  },
  "dependencies": {
    "@ai-sdk/groq": "^1.2.9",
    "@ai-sdk/openai": "^1.3.9",
    "@convex-dev/agent": "file:..",
    "@convex-dev/agent-playground": "file:../playground",
    "@convex-dev/rag": "^0.3.0",
    "@convex-dev/rate-limiter": "^0.2.12",
    "@convex-dev/workflow": "^0.2.6-alpha.1",
    "@hookform/resolvers": "^5.0.1",
    "@openrouter/ai-sdk-provider": "^0.7.1",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "convex": "file:../node_modules/convex",
    "dayjs": "^1.11.13",
    "lucide-react": "^0.487.0",
    "openai": "^5.9.0",
    "react": "file:../node_modules/react",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.55.0",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^7.5.0",
    "tailwind-merge": "^3.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.21.0",
    "@langchain/textsplitters": "^0.1.0",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.1",
    "@vitejs/plugin-react": "^4.3.4",
    "@xixixao/convex-typescript-plugin": "^0.0.1",
    "autoprefixer": "^10.4.21",
    "dotenv": "^16.4.7",
    "eslint": "^9.24.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^15.15.0",
    "npm-run-all2": "5.0.0",
    "postcss": "^8.5.3",
    "prettier": "^3.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.29.1",
    "vite": "^6.2.5"
  }
}



================================================
FILE: example/postcss.config.cjs
================================================
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};



================================================
FILE: example/tailwind.config.js
================================================
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./ui/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};



================================================
FILE: example/tsconfig.app.json
================================================
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,

    /* This should only be used in this example. Real apps should not attempt
     * to compile TypeScript because differences between tsconfig.json files can
     * cause the code to be compiled differently.
     */
    // "customConditions": ["@convex-dev/component-source"],

    /* Import paths */
    "paths": {
      "@/*": ["./ui/*"]
    }
  },
  "include": ["ui"]
}



================================================
FILE: example/tsconfig.json
================================================
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["ui/*"],
      "@example/*": ["../examples/*"]
    }
  }
}



================================================
FILE: example/tsconfig.node.json
================================================
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* This should only be used in this example. Real apps should not attempt
     * to compile TypeScript because differences between tsconfig.json files can
     * cause the code to be compiled differently.
     */
    "customConditions": ["@convex-dev/component-source"],
    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}



================================================
FILE: example/vite.config.ts
================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./ui"),
    },
  },
});



================================================
FILE: example/.prettierrc
================================================
{}



================================================
FILE: example/convex/convex.config.ts
================================================
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import rag from "@convex-dev/rag/convex.config";

const app = defineApp();
app.use(agent);
app.use(workflow);
app.use(rateLimiter);
app.use(rag);

export default app;



================================================
FILE: example/convex/crons.ts
================================================
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// See the docs at https://docs.convex.dev/agents/files
crons.interval(
  "deleteUnusedFiles",
  { hours: 1 },
  internal.files.vacuum.deleteUnusedFiles,
  {},
);

export default crons;



================================================
FILE: example/convex/http.ts
================================================
import { httpRouter } from "convex/server";
import { streamOverHttp } from "./chat/streaming";
import { corsRouter } from "convex-helpers/server/cors";

const http = httpRouter();

const cors = corsRouter(http, {
  allowCredentials: true,
  allowedHeaders: ["Authorization", "Content-Type"],
  exposedHeaders: ["Content-Type", "Content-Length", "X-Message-Id"],
});

cors.route({
  path: "/streamText",
  method: "POST",
  handler: streamOverHttp,
});

// Convex expects the router to be the default export of `convex/http.js`.
export default http;



================================================
FILE: example/convex/modelsForDemo.ts
================================================
import { openrouter, LanguageModelV1 } from "@openrouter/ai-sdk-provider";
import type { EmbeddingModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

let chat: LanguageModelV1;
let textEmbedding: EmbeddingModel<string>;

if (process.env.OPENAI_API_KEY) {
  chat = openai.chat("gpt-4o-mini");
  textEmbedding = openai.textEmbeddingModel("text-embedding-3-small");
} else if (process.env.GROQ_API_KEY) {
  chat = groq.languageModel("meta-llama/llama-4-scout-17b-16e-instruct");
} else if (process.env.OPENROUTER_API_KEY) {
  chat = openrouter.chat("openai/gpt-4o-mini");
} else {
  throw new Error(
    "Run `npx convex env set GROQ_API_KEY=<your-api-key>` or `npx convex env set OPENAI_API_KEY=<your-api-key>` or `npx convex env set OPENROUTER_API_KEY=<your-api-key>` from the example directory to set the API key.",
  );
}

// If you want to use different models for examples, you can change them here.
export { chat, textEmbedding };



================================================
FILE: example/convex/playground.ts
================================================
// See the docs at https://docs.convex.dev/agents/playground
import { definePlaygroundAPI } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { weatherAgent } from "./agents/weather";
import { fashionAgent } from "./agents/fashion";
import { storyAgent } from "./agents/story";
import { agent as basicAgent } from "./agents/simple";
import { fileAgent } from "./files/addFile";
import { rateLimitedAgent } from "./rate_limiting/rateLimiting";

/**
 * Here we expose the API so the frontend can access it.
 * Authorization is handled by passing up an apiKey that can be generated
 * on the dashboard or via CLI via:
 * ```
 * npx convex run --component agent apiKeys:issue
 * ```
 */
export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  agents: async (ctx, { userId, threadId }) => [
    weatherAgent,
    fashionAgent,
    basicAgent,
    storyAgent,
    fileAgent,
    rateLimitedAgent,
  ],
});



================================================
FILE: example/convex/schema.ts
================================================
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import ragTables from "./rag/tables.js";
import usageTables from "./usage_tracking/tables.js";

export default defineSchema({
  ...ragTables,
  ...usageTables,
});



================================================
FILE: example/convex/setup.test.ts
================================================
/// <reference types="vite/client" />
import { test } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
export const modules = import.meta.glob("./**/*.*s");

// Sorry about everything
import componentSchema from "../node_modules/@convex-dev/agent/src/component/schema.js";
export { componentSchema };
export const componentModules = import.meta.glob(
  "../node_modules/@convex-dev/agent/src/component/**/*.ts",
);
import rateLimiterSchema from "../node_modules/@convex-dev/rate-limiter/src/component/schema.js";
const rateLimiterModules = import.meta.glob(
  "../node_modules/@convex-dev/rate-limiter/src/component/**/*.ts",
);

export function initConvexTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("agent", componentSchema, componentModules);
  t.registerComponent("rateLimiter", rateLimiterSchema, rateLimiterModules);
  return t;
}

test("setup", () => {});



================================================
FILE: example/convex/threads.ts
================================================
// See the docs at https://docs.convex.dev/agents/threads
import { components } from "./_generated/api";

import { v } from "convex/values";
import {
  action,
  ActionCtx,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server.js";
import { paginationOptsValidator } from "convex/server";
import {
  createThread,
  getThreadMetadata,
  saveMessage,
  vMessage,
} from "@convex-dev/agent";
import { getAuthUserId } from "./utils";
import { agent } from "./agents/simple";
import z from "zod";

export const listThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId, paginationOpts: args.paginationOpts },
    );
    return threads;
  },
});

export const createNewThread = mutation({
  args: { title: v.optional(v.string()), initialMessage: v.optional(vMessage) },
  handler: async (ctx, { title, initialMessage }) => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, {
      userId,
      title,
    });
    if (initialMessage) {
      await saveMessage(ctx, components.agent, {
        threadId,
        message: initialMessage,
      });
    }
    return threadId;
  },
});

export const getThreadDetails = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { title, summary } = await getThreadMetadata(ctx, components.agent, {
      threadId,
    });
    return { title, summary };
  },
});

export const updateThreadTitle = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await agent.continueThread(ctx, { threadId });
    const {
      object: { title, summary },
    } = await thread.generateObject(
      {
        mode: "json",
        schemaDescription:
          "Generate a title and summary for the thread. The title should be a single sentence that captures the main topic of the thread. The summary should be a short description of the thread that could be used to describe it to someone who hasn't read it.",
        schema: z.object({
          title: z.string().describe("The new title for the thread"),
          summary: z.string().describe("The new summary for the thread"),
        }),
        prompt: "Generate a title and summary for this thread.",
      },
      { storageOptions: { saveMessages: "none" } },
    );
    await thread.updateMetadata({ title, summary });
  },
});

export async function authorizeThreadAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  threadId: string,
  requireUser?: boolean,
) {
  const userId = await getAuthUserId(ctx);
  if (requireUser && !userId) {
    throw new Error("Unauthorized: user is required");
  }
  const { userId: threadUserId } = await getThreadMetadata(
    ctx,
    components.agent,
    { threadId },
  );
  if (requireUser && threadUserId !== userId) {
    throw new Error("Unauthorized: user does not match thread user");
  }
}



================================================
FILE: example/convex/tsconfig.json
================================================
{
  /* This TypeScript project config describes the environment that
   * Convex functions run in and is used to typecheck them.
   * You can modify it, but some settings required to use Convex.
   */
  "compilerOptions": {
    /* These settings are not required by Convex and can be modified. */
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,

    /* These compiler options are required by Convex */
    "target": "ESNext",
    "lib": ["ES2021", "dom", "ESNext.Array"],
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    // See these docs to get this working:
    //https://github.com/xixixao/convex-typescript-plugin/
    // "plugins": [{ "name": "@xixixao/convex-typescript-plugin" }],
    "noEmit": true,
    "paths": {
      "@example/*": ["../../examples/*"]
    }

    /* This should only be used in this example. Real apps should not attempt
     * to compile TypeScript because differences between tsconfig.json files can
     * cause the code to be compiled differently.
     */
    // "customConditions": ["@convex-dev/component-source"]
  },
  "include": ["./**/*"],
  "exclude": ["./_generated"]
}



================================================
FILE: example/convex/utils.ts
================================================
import { ActionCtx, QueryCtx } from "./_generated/server";

export async function getAuthUserId(_ctx: QueryCtx | ActionCtx) {
  return "test user";
}



================================================
FILE: example/convex/_generated/api.js
================================================
/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import { anyApi, componentsGeneric } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api = anyApi;
export const internal = anyApi;
export const components = componentsGeneric();



================================================
FILE: example/convex/_generated/dataModel.d.ts
================================================
/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DataModelFromSchemaDefinition,
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
} from "convex/server";
import type { GenericId } from "convex/values";
import schema from "../schema.js";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;



================================================
FILE: example/convex/_generated/server.d.ts
================================================
/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  ActionBuilder,
  AnyComponents,
  HttpActionBuilder,
  MutationBuilder,
  QueryBuilder,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
  FunctionReference,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

type GenericCtx =
  | GenericActionCtx<DataModel>
  | GenericMutationCtx<DataModel>
  | GenericQueryCtx<DataModel>;

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export declare const query: QueryBuilder<DataModel, "public">;

/**
 * Define a query that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to read from your Convex database. It will not be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export declare const internalQuery: QueryBuilder<DataModel, "internal">;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export declare const mutation: MutationBuilder<DataModel, "public">;

/**
 * Define a mutation that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to modify your Convex database. It will not be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export declare const internalMutation: MutationBuilder<DataModel, "internal">;

/**
 * Define an action in this Convex app's public API.
 *
 * An action is a function which can execute any JavaScript code, including non-deterministic
 * code and code with side-effects, like calling third-party services.
 * They can be run in Convex's JavaScript environment or in Node.js using the "use node" directive.
 * They can interact with the database indirectly by calling queries and mutations using the {@link ActionCtx}.
 *
 * @param func - The action. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped action. Include this as an `export` to name it and make it accessible.
 */
export declare const action: ActionBuilder<DataModel, "public">;

/**
 * Define an action that is only accessible from other Convex functions (but not from the client).
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Include this as an `export` to name it and make it accessible.
 */
export declare const internalAction: ActionBuilder<DataModel, "internal">;

/**
 * Define an HTTP action.
 *
 * This function will be used to respond to HTTP requests received by a Convex
 * deployment if the requests matches the path and method where this action
 * is routed. Be sure to route your action in `convex/http.js`.
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Import this function from `convex/http.js` and route it to hook it up.
 */
export declare const httpAction: HttpActionBuilder;

/**
 * A set of services for use within Convex query functions.
 *
 * The query context is passed as the first argument to any Convex query
 * function run on the server.
 *
 * This differs from the {@link MutationCtx} because all of the services are
 * read-only.
 */
export type QueryCtx = GenericQueryCtx<DataModel>;

/**
 * A set of services for use within Convex mutation functions.
 *
 * The mutation context is passed as the first argument to any Convex mutation
 * function run on the server.
 */
export type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * A set of services for use within Convex action functions.
 *
 * The action context is passed as the first argument to any Convex action
 * function run on the server.
 */
export type ActionCtx = GenericActionCtx<DataModel>;

/**
 * An interface to read from the database within Convex query functions.
 *
 * The two entry points are {@link DatabaseReader.get}, which fetches a single
 * document by its {@link Id}, or {@link DatabaseReader.query}, which starts
 * building a query.
 */
export type DatabaseReader = GenericDatabaseReader<DataModel>;

/**
 * An interface to read from and write to the database within Convex mutation
 * functions.
 *
 * Convex guarantees that all writes within a single mutation are
 * executed atomically, so you never have to worry about partial writes leaving
 * your data in an inconsistent state. See [the Convex Guide](https://docs.convex.dev/understanding/convex-fundamentals/functions#atomicity-and-optimistic-concurrency-control)
 * for the guarantees Convex provides your functions.
 */
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;



================================================
FILE: example/convex/_generated/server.js
================================================
/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  actionGeneric,
  httpActionGeneric,
  queryGeneric,
  mutationGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  componentsGeneric,
} from "convex/server";

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export const query = queryGeneric;

/**
 * Define a query that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to read from your Convex database. It will not be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export const internalQuery = internalQueryGeneric;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export const mutation = mutationGeneric;

/**
 * Define a mutation that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to modify your Convex database. It will not be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export const internalMutation = internalMutationGeneric;

/**
 * Define an action in this Convex app's public API.
 *
 * An action is a function which can execute any JavaScript code, including non-deterministic
 * code and code with side-effects, like calling third-party services.
 * They can be run in Convex's JavaScript environment or in Node.js using the "use node" directive.
 * They can interact with the database indirectly by calling queries and mutations using the {@link ActionCtx}.
 *
 * @param func - The action. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped action. Include this as an `export` to name it and make it accessible.
 */
export const action = actionGeneric;

/**
 * Define an action that is only accessible from other Convex functions (but not from the client).
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Include this as an `export` to name it and make it accessible.
 */
export const internalAction = internalActionGeneric;

/**
 * Define a Convex HTTP action.
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument, and a `Request` object
 * as its second.
 * @returns The wrapped endpoint function. Route a URL path to this function in `convex/http.js`.
 */
export const httpAction = httpActionGeneric;



================================================
FILE: example/convex/agents/fashion.ts
================================================
// See the docs at https://docs.convex.dev/agents/getting-started
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { z } from "zod";
import { usageHandler } from "../usage_tracking/usageHandler";
import { chat, textEmbedding } from "../modelsForDemo";

export const fashionAgent = new Agent(components.agent, {
  name: "Fashion Agent",
  chat,
  instructions:
    "You give fashion advice for a place a user is visiting, based on the weather.",
  tools: {
    getUserPreferences: createTool({
      description: "Get clothing preferences for a user",
      args: z.object({
        search: z.string().describe("Which preferences are requested"),
      }),
      handler: async (ctx, args) => {
        console.log("getting user preferences", args);
        return {
          userId: ctx.userId,
          threadId: ctx.threadId,
          search: args.search,
          information: `The user likes to look stylish`,
        };
      },
    }),
  },
  maxSteps: 5,
  // optional:
  textEmbedding,
  usageHandler,
});



================================================
FILE: example/convex/agents/simple.ts
================================================
// See the docs at https://docs.convex.dev/agents/getting-started
import { chat, textEmbedding } from "../modelsForDemo";
import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { usageHandler } from "../usage_tracking/usageHandler";

// Define an agent similarly to the AI SDK
export const agent = new Agent(components.agent, {
  name: "Basic Agent",
  chat: chat,
  instructions:
    "You are a concise assistant who responds with emojis " +
    "and abbreviations like lmao, lol, iirc, afaik, etc. where appropriate.",
  // optional:
  textEmbedding,
  usageHandler,
});



================================================
FILE: example/convex/agents/story.ts
================================================
// See the docs at https://docs.convex.dev/agents/getting-started
import { Agent } from "@convex-dev/agent";
import { chat, textEmbedding } from "../modelsForDemo";
import { components } from "../_generated/api";
import { usageHandler } from "../usage_tracking/usageHandler";

// Define an agent similarly to the AI SDK
export const storyAgent = new Agent(components.agent, {
  name: "Story Agent",
  chat,
  textEmbedding,
  instructions: "You tell stories with twist endings. ~ 200 words.",
  usageHandler,
});



================================================
FILE: example/convex/agents/weather.ts
================================================
// See the docs at https://docs.convex.dev/agents/getting-started
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { getGeocoding, getWeather } from "../tools/weather";
import { usageHandler } from "../usage_tracking/usageHandler";
import { chat, textEmbedding } from "../modelsForDemo";

// Define an agent similarly to the AI SDK
export const weatherAgent = new Agent(components.agent, {
  name: "Weather Agent",
  chat,
  textEmbedding,
  instructions:
    "You describe the weather for a location as if you were a TV weather reporter.",
  tools: {
    getWeather,
    getGeocoding,
  },
  maxSteps: 3,
  usageHandler,
});



================================================
FILE: example/convex/chat/basic.ts
================================================
// See the docs at https://docs.convex.dev/agents/messages
import { components, internal } from "../_generated/api";
import { action, internalAction, mutation, query } from "../_generated/server";
import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { agent } from "../agents/simple";
import { authorizeThreadAccess } from "../threads";
import { paginationOptsValidator } from "convex/server";

/**
 * OPTION 1 (BASIC):
 * Generating via a single action call
 */

export const generateTextInAnAction = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});

/**
 * OPTION 2 (RECOMMENDED):
 * Generating via a mutation & async action
 * This enables optimistic updates on the client.
 */

// Save a user message, and kick off an async response.
export const sendMessage = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.chat.basic.generateResponse, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

// Generate a response to a user message.
// Any clients listing the messages will automatically get the new message.
export const generateResponse = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    await agent.generateText(ctx, { threadId }, { promptMessageId });
  },
});

// Equivalent:
// export const generateResponse = agent.asTextAction();

/**
 * Query & subscribe to messages & threads
 */

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { threadId, paginationOpts } = args;
    await authorizeThreadAccess(ctx, threadId);
    const messages = await agent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });
    // You could add more fields here, join with other tables, etc.
    return messages;
  },
});



================================================
FILE: example/convex/chat/human.ts
================================================
// See the docs at https://docs.convex.dev/agents/human-agents
import {
  saveMessage,
  listMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import {
  action,
  internalAction,
  internalMutation,
  mutation,
  query,
} from "../_generated/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { authorizeThreadAccess } from "../threads";
import { z } from "zod";
import { tool } from "ai";
import { agent } from "../agents/simple";

/**
 * ===============================
 * OPTION 1: Sending messages as an "assistant" role
 * ===============================
 */

/**
 * Sending a message from a human agent.
 * This does not kick off an LLM response.
 * This is an internal mutation that can be called from other functions.
 * To have a logged in support agent send it, you could use a public mutation
 * along with auth to find the support agent's name and ensure they have access
 * to the specified thread.
 */
export const sendMessageFromHumanAgent = internalMutation({
  args: { agentName: v.string(), message: v.string(), threadId: v.string() },
  handler: async (ctx, args) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      agentName: args.agentName,
      message: {
        role: "assistant",
        content: args.message,
      },
    });
    return messageId;
  },
});

/**
 * Sending a message from a user
 */
export const sendMessageFromUser = mutation({
  args: { message: v.string(), threadId: v.string() },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, args.threadId);
    await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      // prompt is shorthand for message: { role: "user", content: prompt }
      prompt: args.message,
    });
  },
});

/**
 * ===============================
 * OPTION 2: Sending messages as a tool call
 * ===============================
 */

export const askHuman = tool({
  description: "Ask a human a question",
  parameters: z.object({
    question: z.string().describe("The question to ask the human"),
  }),
});

export const ask = action({
  args: { question: v.string(), threadId: v.string() },
  handler: async (ctx, { question, threadId }) => {
    const result = await agent.generateText(
      ctx,
      { threadId },
      {
        prompt: question,
        tools: { askHuman },
      },
    );
    const supportRequests = result.toolCalls
      .filter((tc) => tc.toolName === "askHuman")
      .map(({ toolCallId, args: { question } }) => ({
        toolCallId,
        question,
      }));
    if (supportRequests.length > 0) {
      // Do something so the support agent knows they need to respond,
      // e.g. save a message to their inbox
      // await ctx.runMutation(internal.example.sendToSupport, {
      //   threadId,
      //   supportRequests,
      // });
    }
    return {
      response: result.text,
      supportRequests,
      messageId: result.messageId,
    };
  },
});

export const humanResponseAsToolCall = internalAction({
  args: {
    humanName: v.string(),
    response: v.string(),
    toolCallId: v.string(),
    threadId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await agent.saveMessage(ctx, {
      threadId: args.threadId,
      message: {
        role: "tool",
        content: [
          {
            type: "tool-result",
            result: args.response,
            toolCallId: args.toolCallId,
            toolName: "askHuman",
          },
        ],
      },
      metadata: {
        provider: "human",
        providerMetadata: {
          human: { name: args.humanName },
        },
      },
    });
    // Continue generating a response from the LLM
    await agent.generateText(
      ctx,
      { threadId: args.threadId },
      { promptMessageId: args.messageId },
    );
  },
});

/**
 * ===============================
 * Other things
 * ===============================
 */

/**
 * Listing messages without using an agent
 */

export const getMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const messages = await listMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
    return { ...messages, streams };
  },
});



================================================
FILE: example/convex/chat/streamAbort.ts
================================================
// See the docs at https://docs.convex.dev/agents/messages
import { v } from "convex/values";
import { components } from "../_generated/api";
import {
  query,
  action,
  mutation,
  internalMutation,
} from "../_generated/server";
import { abortStream, listStreams } from "@convex-dev/agent";
import { agent } from "../agents/simple";
import { smoothStream } from "ai";
import { authorizeThreadAccess } from "../threads";

/**
 * Abort a stream by its order
 */
export const abortStreamByOrder = mutation({
  args: { threadId: v.string(), order: v.number() },
  handler: async (ctx, { threadId, order }) => {
    await authorizeThreadAccess(ctx, threadId);
    if (
      await abortStream(ctx, components.agent, {
        threadId,
        order,
        reason: "Aborting explicitly",
      })
    ) {
      console.log("Aborted stream", threadId, order);
    } else {
      console.log("No stream found", threadId, order);
    }
  },
});

// Test it out by streaming a message and then aborting it
export const streamThenAbortAsync = action({
  args: {},
  handler: async (ctx) => {
    const { thread, threadId } = await agent.createThread(ctx, {
      title: "Thread with aborted message",
    });
    const result = await thread.streamText(
      {
        prompt: "Write an essay on the importance of effusive dialogue",
        experimental_transform: smoothStream({ chunking: "line" }),
        onError: (error) => {
          console.error(error);
        },
      },
      { saveStreamDeltas: { chunking: "line" } },
    );
    let canceled = false;
    try {
      for await (const chunk of result.textStream) {
        console.log(chunk);
        if (!canceled) {
          await abortStream(ctx, components.agent, {
            threadId,
            order: result.order,
            reason: "Aborting explicitly",
          });
          canceled = true;
        }
      }
    } catch (error) {
      console.warn("Catching what should be an AbortError", error);
    }
  },
});

/**
 * Abort a stream by its streamId
 */

export const list = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return listStreams(ctx, components.agent, { threadId });
  },
});

export const abortStreamByStreamId = internalMutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const streams = await listStreams(ctx, components.agent, { threadId });
    for (const stream of streams) {
      console.log("Aborting stream", stream);
      await abortStream(ctx, components.agent, {
        reason: "Aborting via async call",
        streamId: stream.streamId,
      });
    }
    if (!streams.length) {
      console.log("No streams found");
    }
  },
});

/**
 * Abort a stream with the abortSignal parameter
 */

export const streamThenUseAbortSignal = action({
  args: {},
  handler: async (ctx) => {
    const { thread } = await agent.createThread(ctx, {
      title: "Thread using abortSignal",
    });
    const abortController = new AbortController();
    const result = await thread.streamText(
      {
        prompt: "Write an essay on the importance of effusive dialogue",
        abortSignal: abortController.signal,
        experimental_transform: smoothStream({ chunking: "line" }),
      },
      { saveStreamDeltas: { chunking: "line" } },
    );
    setTimeout(() => {
      abortController.abort();
    }, 1000);
    try {
      for await (const chunk of result.textStream) {
        console.log(chunk);
      }
    } catch (error) {
      console.warn("Catching what should be an AbortError", error);
    }
    await result.consumeStream();
  },
});



================================================
FILE: example/convex/chat/streaming.ts
================================================
// See the docs at https://docs.convex.dev/agents/messages
import { paginationOptsValidator } from "convex/server";
import { vStreamArgs } from "@convex-dev/agent";
import { internal } from "../_generated/api";
import {
  action,
  httpAction,
  internalAction,
  mutation,
  query,
} from "../_generated/server";
import { v } from "convex/values";
import { authorizeThreadAccess } from "../threads";
import { storyAgent } from "../agents/story";

/**
 * OPTION 1:
 * Stream the response in a single action call.
 */

export const streamOneShot = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await storyAgent.continueThread(ctx, { threadId });
    const result = await thread.streamText(
      { prompt },
      { saveStreamDeltas: true },
    );
    // We don't need to return anything, as the response is saved as deltas
    // in the database and clients are subscribed to the stream.

    // We do need to make sure the stream is finished - by awaiting each chunk
    // or using this call to consume it all.
    await result.consumeStream();
  },
});

/**
 * OPTION 2 (RECOMMENDED):
 * Generate the prompt message first, then asynchronously generate the stream response.
 * This enables optimistic updates on the client.
 */

export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await storyAgent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated
      // lazily when streaming text.
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.streaming.streamAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const { thread } = await storyAgent.continueThread(ctx, { threadId });
    const result = await thread.streamText(
      { promptMessageId },
      // more custom delta options (`true` uses defaults)
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
    );
    // We need to make sure the stream finishes - by awaiting each chunk
    // or using this call to consume it all.
    await result.consumeStream();
  },
});

/**
 * Query & subscribe to messages & threads
 */

export const listMessages = query({
  args: {
    // These arguments are required:
    threadId: v.string(),
    paginationOpts: paginationOptsValidator, // Used to paginate the messages.
    streamArgs: vStreamArgs, // Used to stream messages.
  },
  handler: async (ctx, args) => {
    const { threadId, paginationOpts, streamArgs } = args;
    await authorizeThreadAccess(ctx, threadId);
    const streams = await storyAgent.syncStreams(ctx, {
      threadId,
      streamArgs,
      includeStatuses: ["aborted", "streaming"],
    });
    // Here you could filter out / modify the stream of deltas / filter out
    // deltas.

    const paginated = await storyAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });

    // Here you could filter out metadata that you don't want from any optional
    // fields on the messages.
    // You can also join data onto the messages. They need only extend the
    // MessageDoc type.
    // { ...messages, page: messages.page.map(...)}

    return {
      ...paginated,
      streams,

      // ... you can return other metadata here too.
      // note: this function will be called with various permutations of delta
      // and message args, so returning derived data .
    };
  },
});

/**
 * ==============================
 * Other ways of doing things:
 * ==============================
 */

/**
 * OPTION 3:
 * Stream the text but don't persist the message until it's done.
 * This allows you to start processing the result in the action itself.
 * To stream the result back over http, see the next example.
 */
export const streamTextWithoutSavingDeltas = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const { threadId, thread } = await storyAgent.createThread(ctx, {});
    const result = await thread.streamText({ prompt });
    for await (const chunk of result.textStream) {
      // do something with the chunks as they come in.
      console.log(chunk);
    }
    return {
      threadId,
      text: await result.text,
      toolCalls: await result.toolCalls,
      toolResults: await result.toolResults,
    };
  },
});

/**
 * OPTION 4:
 * Stream text over http but don't persist the message until it's done.
 * This can be an alternative if you only care about streaming to one client
 * and waiting for the final result if the http request is interrupted / for
 * other clients.
 *
 * Warning: Optimistic updates are hard to get right with this approach.
 *
 * Note: you can also save deltas if you want so all clients can stream them.
 */
export const streamOverHttp = httpAction(async (ctx, request) => {
  const { threadId, prompt } = (await request.json()) as {
    threadId?: string;
    prompt: string;
  };
  const { thread } = threadId
    ? await storyAgent.continueThread(ctx, { threadId })
    : await storyAgent.createThread(ctx, {});
  const result = await thread.streamText({ prompt });
  const response = result.toTextStreamResponse();
  // Set this so the client can try to de-dupe showing the streamed message and
  // the final result.
  response.headers.set("X-Message-Id", result.messageId);
  return response;
});

// Expose an internal action that streams text, to avoid the boilerplate of
// streamStory above.
export const streamStoryInternalAction = storyAgent.asTextAction({
  stream: true,
  // stream: { chunking: "word", throttleMs: 200 },
});

// This fetches only streaming messages.
export const listStreamingMessages = query({
  args: { threadId: v.string(), streamArgs: vStreamArgs },
  handler: async (ctx, { threadId, streamArgs }) => {
    await authorizeThreadAccess(ctx, threadId);
    const streams = await storyAgent.syncStreams(ctx, { threadId, streamArgs });
    return { streams };
  },
});



================================================
FILE: example/convex/debugging/rawRequestResponseHandler.ts
================================================
// See the docs at https://docs.convex.dev/agents/debugging
import { RawRequestResponseHandler } from "@convex-dev/agent";

export const rawRequestResponseHandler: RawRequestResponseHandler = async (
  ctx,
  { request, response, agentName, threadId, userId },
) => {
  // Logging it here, to look up in the logs.
  // Note: really long requests & responses may end up truncated.
  console.log({
    name: "rawRequestResponseHandler event",
    agentName,
    threadId,
    userId,
    request,
    response,
  });
};



================================================
FILE: example/convex/files/addFile.ts
================================================
// See the docs at https://docs.convex.dev/agents/files
import { Agent, createThread, saveMessage, storeFile } from "@convex-dev/agent";
import { components, internal } from "../_generated/api";
import { chat, textEmbedding } from "../modelsForDemo";
import { action, internalAction, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getFile } from "@convex-dev/agent";
import { getAuthUserId } from "../utils";
import { usageHandler } from "../usage_tracking/usageHandler";

// Define an agent similarly to the AI SDK
export const fileAgent = new Agent(components.agent, {
  name: "File Reviewer Agent",
  chat: chat,
  instructions: "You are an expert in reviewing and analyzing files & images.",
  // Optional:
  textEmbedding,
  usageHandler,
});

/**
 * OPTION 2 (Recommended):
 * Do each step separately.
 *
 * This allows the user to upload the file ahead of time,
 * then submit a question with an optimistic update and have the response
 * generated asynchronously.
 */

// Step 1: Upload a file - this could be an httpAction if the file is big.
export const uploadFile = action({
  args: {
    filename: v.string(),
    mimeType: v.string(),
    bytes: v.bytes(),
    sha256: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    // Note: we're using storeFile which will store the file in file storage
    // or re-use an existing file with the same hash and track references.
    const {
      file: { fileId, url },
    } = await storeFile(
      ctx,
      components.agent,
      new Blob([args.bytes], { type: args.mimeType }),
      args.filename,
      args.sha256,
    );
    return { fileId, url };
  },
});

// Step 2: Submit a question about the file
export const submitFileQuestion = mutation({
  args: {
    fileId: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const threadId = await createThread(ctx, components.agent, { userId });
    const { filePart, imagePart } = await getFile(
      ctx,
      components.agent,
      args.fileId,
    );
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        role: "user",
        content: [imagePart ?? filePart, { type: "text", text: args.question }],
      },
      // This will track the usage of the file, so we can delete old ones
      metadata: { fileIds: [args.fileId] },
    });
    await ctx.scheduler.runAfter(0, internal.files.addFile.generateResponse, {
      threadId,
      promptMessageId: messageId,
    });
    return { threadId };
  },
});

// Step 3: Generate a response to the question asynchronously
export const generateResponse = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    const { thread } = await fileAgent.continueThread(ctx, { threadId });
    await thread.generateText({
      promptMessageId,
    });
  },
});



================================================
FILE: example/convex/files/autoSave.ts
================================================
// See the docs at https://docs.convex.dev/agents/files
import { v } from "convex/values";
import { action } from "../_generated/server";
import { agent } from "../agents/simple";

/**
 * This is a simple example of how to use the automatic file saving.
 * By passing in bytes directly, it will automatically store the file in file
 * storage and pass around the URL. It will also automatically re-use files
 * if you upload the same file multiple times. See [vacuum.ts](./vacuum.ts)
 * for how to clean up files no longer referenced.
 */
export const askAboutImage = action({
  args: {
    prompt: v.string(),
    image: v.bytes(),
    mimeType: v.string(),
  },
  handler: async (ctx, { prompt, image, mimeType }) => {
    const { thread, threadId } = await agent.createThread(ctx, {});
    const result = await thread.generateText({
      prompt,
      messages: [
        {
          role: "user",
          content: [
            // You can pass the data in directly. It will automatically store
            // it in file storage and pass around the URL.
            { type: "image", image, mimeType },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    return { threadId, result: result.text };
  },
});

// TODO: show an example of using http action or file storage.



================================================
FILE: example/convex/files/generateImage.ts
================================================
// See the docs at https://docs.convex.dev/agents/files
import { createThread, saveMessage } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { getAuthUserId } from "../utils";

/**
 * Generating images
 */

// Generate an image and save it in an assistant message
// This differs in that it's saving the file implicitly by passing the bytes in.
// It will save the file and make a fileId automatically when the input file
// is too big (>100k).
export const replyWithImage = internalAction({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, { prompt }) => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, {
      userId,
      title: "Image for: " + prompt,
    });
    // Save the user message
    await saveMessage(ctx, components.agent, { threadId, prompt });

    // Generate the image
    const provider = "openai";
    const model = "dall-e-2";
    const imgResponse = await new OpenAI().images.generate({
      model,
      prompt,
      size: "256x256",
      response_format: "url",
    });
    const url = imgResponse.data?.[0].url;
    if (!url) {
      throw new Error(
        "No image URL found. Response: " + JSON.stringify(imgResponse),
      );
    }
    console.debug("short-lived url:", url);
    const image = await fetch(url);
    if (!image.ok) {
      throw new Error("Failed to fetch image. " + JSON.stringify(image));
    }
    const mimeType = image.headers.get("content-type")!;
    if (!mimeType) {
      throw new Error(
        "No MIME type found. Response: " + JSON.stringify(image.headers),
      );
    }

    // // Save the image in an assistant message
    const { message } = await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        role: "assistant",
        content: [
          {
            type: "file",
            // NOTE: passing in the bytes directly!
            // It will be saved automatically in file storage.
            data: await image.arrayBuffer(),
            mimeType: image.headers.get("content-type")!,
          },
        ],
      },
      metadata: {
        text: imgResponse.data?.[0].revised_prompt || undefined,
        model,
        provider,
      },
    });
    return { threadId, assistantMessage: message };
  },
});



================================================
FILE: example/convex/files/vacuum.ts
================================================
// See the docs at https://docs.convex.dev/agents/files
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

const THRESHOLD_MS = 1000 * 60 * 60 * 24; // 24 hours

// Registered in convex/crons.ts
export const deleteUnusedFiles = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const files = await ctx.runQuery(components.agent.files.getFilesToDelete, {
      paginationOpts: {
        cursor: args.cursor ?? null,
        numItems: 100,
      },
    });
    // Only delete files that haven't been touched in the last 24 hours
    const toDelete = files.page.filter(
      (f) => f.lastTouchedAt < Date.now() - THRESHOLD_MS,
    );
    if (toDelete.length > 0) {
      console.debug(`Deleting ${toDelete.length} files...`);
    }
    await Promise.all(
      toDelete.map((f) => ctx.storage.delete(f.storageId as Id<"_storage">)),
    );
    // Also mark them as deleted in the component.
    // This is in a transaction (mutation), so there's no races.
    await ctx.runMutation(components.agent.files.deleteFiles, {
      fileIds: toDelete.map((f) => f._id),
    });
    if (!files.isDone) {
      console.debug(
        `Deleted ${toDelete.length} files but not done yet, continuing...`,
      );
      await ctx.scheduler.runAfter(0, internal.files.vacuum.deleteUnusedFiles, {
        cursor: files.continueCursor,
      });
    }
  },
});



================================================
FILE: example/convex/rag/ragAsPrompt.ts
================================================
// See the docs at https://docs.convex.dev/agents/rag
import { RAG } from "@convex-dev/rag";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { action, internalAction, mutation } from "../_generated/server";
import { textEmbedding } from "../modelsForDemo";
import { agent } from "../agents/simple";
import { authorizeThreadAccess } from "../threads";

export const rag = new RAG(components.rag, {
  textEmbeddingModel: textEmbedding,
  embeddingDimension: 1536,
});

/**
 * Add context to the RAG index.
 * This is used to search for context when the user asks a question.
 */
export const addContext = action({
  args: { title: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    // TODO: Add authorization
    await rag.add(ctx, {
      namespace: "global", // Could set a per-user namespace here
      title: args.title,
      key: args.title,
      text: args.text,
    });
  },
});

/**
 * Answer a user question via RAG.
 * It looks up chunks of context in the RAG index and uses them in the prompt.
 * This is started asynchronously after saving the prompt message to the thread
 * (see askQuestion below).
 */
export const answerQuestionViaRAG = internalAction({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    promptMessageId: v.string(),
  },
  handler: async (ctx, { threadId, prompt: rawPrompt, promptMessageId }) => {
    const { thread } = await agent.continueThread(ctx, { threadId });

    // Search the RAG index for context.
    const context = await rag.search(ctx, {
      namespace: "global",
      query: rawPrompt,
      limit: 2,
      chunkContext: { before: 1, after: 1 },
    });

    // Basic prompt to instruct the LLM to use the context to answer the question.
    // Note: for gemini / claude, using `<context>` and `<question>` tags is
    // recommended instead of the markdown format below.
    const prompt = `# Context:\n\n ${context.text}\n\n---\n\n# Question:\n\n"""${rawPrompt}\n"""`;
    // Override the system prompt for demo purposes.
    const system =
      "Answer the user's question and explain what context you used to answer it.";

    const result = await thread.streamText(
      // By providing both prompt and promptMessageId, it will use the prompt
      // in place of the promptMessageId's message, but still be considered
      // a response to the promptMessageId message (raw prompt).
      { prompt, promptMessageId, system },
      { saveStreamDeltas: true }, // to enable streaming the response via websockets.
    );
    // To show the context in the demo UI, we record the context used
    await ctx.runMutation(internal.rag.utils.recordContextUsed, {
      messageId: result.messageId,
      entries: context.entries,
      results: context.results,
    });
    // This is necessary to ensure the stream is finished before returning.
    await result.consumeStream();
  },
});

export const askQuestion = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, { threadId, prompt }) => {
    await authorizeThreadAccess(ctx, threadId);
    // Save the raw prompt message to the thread. We'll associate the response
    // with this message below.
    const { messageId } = await agent.saveMessage(ctx, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.rag.ragAsPrompt.answerQuestionViaRAG,
      { threadId, prompt, promptMessageId: messageId },
    );
  },
});



================================================
FILE: example/convex/rag/ragAsTools.ts
================================================
// See the docs at https://docs.convex.dev/agents/rag
import { openai } from "@ai-sdk/openai";
import { createTool } from "@convex-dev/agent";
import { RAG } from "@convex-dev/rag";
import { v } from "convex/values";
import { z } from "zod";
import { components, internal } from "../_generated/api";
import { action } from "../_generated/server";
import { agent } from "../agents/simple";
import { getAuthUserId } from "../utils";

const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

export const sendMessage = action({
  args: { threadId: v.string(), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const userId = await getAuthUserId(ctx);
    const { thread } = await agent.continueThread(ctx, { threadId });
    const { messageId } = await thread.generateText({
      prompt,
      tools: {
        addContext: createTool({
          description: "Store information to search later via RAG",
          args: z.object({
            title: z.string().describe("The title of the context"),
            text: z.string().describe("The text body of the context"),
          }),
          handler: async (ctx, args) => {
            await rag.add(ctx, {
              namespace: userId,
              title: args.title,
              text: args.text,
            });
          },
        }),
        searchContext: createTool({
          description: "Search for context related to this user prompt",
          args: z.object({
            query: z
              .string()
              .describe("Describe the context you're looking for"),
          }),
          handler: async (ctx, args) => {
            const context = await rag.search(ctx, {
              namespace: userId,
              query: args.query,
              limit: 5,
            });
            // To show the context in the demo UI, we record the context used
            await ctx.runMutation(internal.rag.utils.recordContextUsed, {
              messageId,
              entries: context.entries,
              results: context.results,
            });
            return (
              `Found results in ${context.entries
                .map((e) => e.title || null)
                .filter((t) => t !== null)
                .join(", ")}` + `Here is the context:\n\n ${context.text}`
            );
          },
        }),
      },
    });
  },
});



================================================
FILE: example/convex/rag/tables.ts
================================================
// See the docs at https://docs.convex.dev/agents/rag
import { vSearchEntry, vSearchResult } from "@convex-dev/rag";
import { defineTable } from "convex/server";
import { v } from "convex/values";

export default {
  // tables for the basic rag example
  contextUsed: defineTable({
    messageId: v.string(),
    entries: v.array(vSearchEntry),
    results: v.array(vSearchResult),
  }).index("messageId", ["messageId"]),
};



================================================
FILE: example/convex/rag/utils.ts
================================================
// See the docs at https://docs.convex.dev/agents/rag
import {
  getThreadMetadata,
  listMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { vEntryId, vSearchEntry, vSearchResult } from "@convex-dev/rag";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { getAuthUserId } from "../utils";
import { rag } from "./ragAsPrompt";
import { components } from "../_generated/api";

/**
 * Lists messages for a thread including the context used to generate them,
 * based on context saved when using RAG.
 */
export const listMessagesWithContext = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const threadMetadata = await getThreadMetadata(ctx, components.agent, {
      threadId: args.threadId,
    });
    if (threadMetadata.userId && threadMetadata.userId !== userId) {
      throw new Error("You are not authorized to access this thread");
    }

    const results = await listMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
    return {
      streams,
      ...results,
      page: await Promise.all(
        results.page.map(async (message) => ({
          ...message,
          contextUsed: await ctx.db
            .query("contextUsed")
            .withIndex("messageId", (q) => q.eq("messageId", message._id))
            .first(),
        })),
      ),
    };
  },
});

export const listEntries = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const namespace = await rag.getNamespace(ctx, {
      namespace: "global",
    });
    if (!namespace) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    const results = await rag.list(ctx, {
      namespaceId: namespace.namespaceId,
      paginationOpts: args.paginationOpts,
    });
    return results;
  },
});

export const listChunks = query({
  args: {
    entryId: vEntryId,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const paginatedChunks = await rag.listChunks(ctx, {
      entryId: args.entryId,
      paginationOpts: args.paginationOpts,
    });
    return paginatedChunks;
  },
});

export const recordContextUsed = internalMutation({
  args: {
    messageId: v.string(),
    entries: v.array(vSearchEntry),
    results: v.array(vSearchResult),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contextUsed", args);
  },
});



================================================
FILE: example/convex/rate_limiting/rateLimiting.ts
================================================
// See the docs at https://docs.convex.dev/agents/rate-limiting
import { Agent, saveMessage, UsageHandler } from "@convex-dev/agent";
import { components, internal } from "../_generated/api";
import { chat, textEmbedding } from "../modelsForDemo";
import { internalAction, mutation } from "../_generated/server";
import { v } from "convex/values";
import { MINUTE, RateLimiter, SECOND } from "@convex-dev/rate-limiter";
import { usageHandler as normalUsageHandler } from "../usage_tracking/usageHandler";
import { getAuthUserId } from "../utils";
import { authorizeThreadAccess } from "../threads";
import { estimateTokens } from "./utils";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessage: {
    kind: "fixed window",
    period: 5 * SECOND,
    rate: 1,
    // Allow accruing usage up to 2 messages to send within 5s (rollover).
    capacity: 2,
  },
  tokenUsagePerUser: {
    kind: "token bucket",
    period: MINUTE,
    rate: 2000,
    capacity: 10000,
  },
  globalSendMessage: { kind: "token bucket", period: MINUTE, rate: 1_000 },
  globalTokenUsage: { kind: "token bucket", period: MINUTE, rate: 100_000 },
});

export const rateLimitedUsageHandler: UsageHandler = async (ctx, args) => {
  if (!args.userId) {
    console.warn("No user ID found in usage handler");
    return;
  }
  // We consume the token usage here, once we know the full usage.
  // This is too late for the first generation, but prevents further requests
  // until we've paid off that debt.
  await rateLimiter.limit(ctx, "tokenUsagePerUser", {
    key: args.userId,
    // You could weight different kinds of tokens differently here.
    count: args.usage.totalTokens,
    // Reserving the tokens means it won't fail here, but will allow it
    // to go negative, disallowing further requests at the `check` call below.
    reserve: true,
  });
  // Also track global usage.
  await rateLimiter.limit(ctx, "globalTokenUsage", {
    count: args.usage.totalTokens,
    reserve: true,
  });

  // The usage handler used in other demos that tracks usage for billing / etc.
  await normalUsageHandler(ctx, args);
};

export const rateLimitedAgent = new Agent(components.agent, {
  name: "Rate Limited Agent",
  chat: chat,
  usageHandler: rateLimitedUsageHandler,
  // Optional:
  textEmbedding,
});

// Step 1: Submit a question. It checks to see if you are exceeding rate limits.
export const submitQuestion = mutation({
  args: {
    question: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    await authorizeThreadAccess(ctx, args.threadId);

    await rateLimiter.limit(ctx, "sendMessage", { key: userId, throws: true });
    // Also check global limit.
    await rateLimiter.limit(ctx, "globalSendMessage", { throws: true });

    const count = await estimateTokens(ctx, args.threadId, args.question);
    // We only check the limit here, we don't consume the tokens.
    // We track the total usage after it finishes, which is too late for the
    // first generation, but prevents further requests until we've paid off that
    // debt.
    await rateLimiter.check(ctx, "tokenUsagePerUser", {
      key: userId,
      count,
      reserve: true,
      throws: true,
    });
    // Also check global limit.
    await rateLimiter.check(ctx, "globalTokenUsage", {
      count,
      reserve: true,
      throws: true,
    });

    // Save the message and generate a response asynchronously.
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      prompt: args.question,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.rate_limiting.rateLimiting.generateResponse,
      { threadId: args.threadId, promptMessageId: messageId },
    );
  },
});

// Step 2: Generate a response asynchronously.
export const generateResponse = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, args) => {
    // Because the agent has a usage handler that will use the rate limiter, we
    // don't need to do anything special here.
    await rateLimitedAgent.generateText(
      ctx,
      { threadId: args.threadId },
      { promptMessageId: args.promptMessageId },
    );
  },
});



================================================
FILE: example/convex/rate_limiting/tables.ts
================================================
// See the docs at https://docs.convex.dev/agents/rate-limiting
import { defineTable } from "convex/server";
import { v } from "convex/values";

export default {
  // Just an example of tracking usage separately from rate limiting.
  usage: defineTable({
    userId: v.string(),
    totalTokens: v.number(),
  }).index("by_user", ["userId"]),
};



================================================
FILE: example/convex/rate_limiting/utils.ts
================================================
// See the docs at https://docs.convex.dev/agents/rate-limiting
import { v } from "convex/values";
import { getAuthUserId } from "../utils";
import { query, QueryCtx } from "../_generated/server";
import { fetchContextMessages } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { rateLimiter } from "./rateLimiting";
import { DataModel } from "../_generated/dataModel";

// This allows us to have a reactive query on the client for when we can send
// the next message.
export const { getRateLimit, getServerTime } = rateLimiter.hookAPI<DataModel>(
  "sendMessage",
  { key: (ctx) => getAuthUserId(ctx) },
);

// Used to show the client know what its usage was.
export const getPreviousUsage = query({
  args: { threadId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Get usage not accounting for the new question. Do that client-side.
    return estimateTokens(ctx, args.threadId, "");
  },
});

// This is a rough estimate of the tokens that will be used.
// It's not perfect, but it's a good enough estimate for a pre-generation check.
export async function estimateTokens(
  ctx: QueryCtx,
  threadId: string | undefined,
  question: string,
) {
  // Assume roughly 4 characters per token
  const promptTokens = question.length / 4;
  // Assume a longer non-zero reply
  const estimatedOutputTokens = promptTokens * 3 + 1;
  const latestMessages = await fetchContextMessages(ctx, components.agent, {
    threadId,
    userId: await getAuthUserId(ctx),
    messages: [{ role: "user" as const, content: question }],
    contextOptions: { recentMessages: 2 },
  });
  // Our new usage will roughly be the previous tokens + the question.
  // The previous tokens include the tokens for the full message history and
  // output tokens, which will be part of our new history.
  // Note:
  // - It over-counts if the history is longer than the context message
  //   limit, since some messages for the previous prompt won't be included.
  // - It doesn't account for the output tokens.
  const lastUsageMessage = latestMessages
    .reverse()
    .find((message) => message.usage);
  const lastPromptTokens = lastUsageMessage?.usage?.totalTokens ?? 1;
  return lastPromptTokens + promptTokens + estimatedOutputTokens;
}



================================================
FILE: example/convex/tools/agentAsTool.ts
================================================
// See the docs at https://docs.convex.dev/agents/tools
import { components } from "../_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import { action } from "../_generated/server";
import { tool } from "ai";

export const runAgentAsTool = action({
  args: {},
  handler: async (ctx) => {
    const agentWithTools = new Agent(components.agent, {
      chat: openai.chat("gpt-4o-mini"),
      textEmbedding: openai.embedding("text-embedding-3-small"),
      instructions: "You are a helpful assistant.",
      tools: {
        doSomething: tool({
          description: "Call this function when asked to do something",
          parameters: z.object({}),
          execute: async (args, options) => {
            console.log("doingSomething", options.toolCallId);
            return "hello";
          },
        }),
        doSomethingElse: tool({
          description: "Call this function when asked to do something else",
          parameters: z.object({}),
          execute: async (args, options) => {
            console.log("doSomethingElse", options.toolCallId);
            return "hello";
          },
        }),
      },
      maxSteps: 20,
    });
    const agentWithToolsAsTool = createTool({
      description:
        "agentWithTools which can either doSomething or doSomethingElse",
      args: z.object({
        whatToDo: z.union([
          z.literal("doSomething"),
          z.literal("doSomethingElse"),
        ]),
      }),
      handler: async (ctx, args) => {
        // Create a nested thread to call the agent with tools
        const { thread } = await agentWithTools.createThread(ctx, {
          userId: ctx.userId,
        });
        const result = await thread.generateText({
          messages: [
            {
              role: "assistant",
              content: `I'll do this now: ${args.whatToDo}`,
            },
          ],
        });
        return result.text;
      },
    });
    const dispatchAgent = new Agent(components.agent, {
      chat: openai.chat("gpt-4o-mini"),
      textEmbedding: openai.embedding("text-embedding-3-small"),
      instructions:
        "You can call agentWithToolsAsTool as many times as told with the argument whatToDo.",
      tools: { agentWithToolsAsTool },
      maxSteps: 5,
    });

    const { thread } = await dispatchAgent.createThread(ctx);
    console.time("overall");
    const result = await thread.generateText({
      messages: [
        {
          role: "user",
          content:
            "Call fastAgent with whatToDo set to doSomething three times and doSomethingElse one time",
        },
      ],
    });
    console.timeEnd("overall");
    return result.text;
  },
});



================================================
FILE: example/convex/tools/searchMessages.ts
================================================
// See the docs at https://docs.convex.dev/agents/context
import { components } from "../_generated/api";
import { createTool, fetchContextMessages } from "@convex-dev/agent";
import z from "zod";
import { embed } from "ai";
import { textEmbedding } from "../modelsForDemo";

/**
 * Manual search
 */

export const searchMessages = createTool({
  description: "Search for messages in the thread",
  args: z.object({
    query: z.string().describe("The query to search for"),
  }),
  handler: async (ctx, { query }) => {
    return fetchContextMessages(ctx, components.agent, {
      userId: ctx.userId,
      threadId: ctx.threadId,
      messages: [{ role: "user", content: query }],
      contextOptions: {
        searchOtherThreads: !!ctx.userId, // search other threads if the user is logged in
        recentMessages: 0, // only search older messages
        searchOptions: {
          textSearch: true,
          vectorSearch: true,
          messageRange: { before: 0, after: 0 },
          limit: 10,
        },
      },
      getEmbedding: async (text) => {
        const e = await embed({ model: textEmbedding, value: text });
        return {
          embedding: e.embedding,
          embeddingModel: textEmbedding.modelId,
        };
      },
    });
  },
});



================================================
FILE: example/convex/tools/updateThreadTitle.ts
================================================
// See the docs at https://docs.convex.dev/agents/tools
import { createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { z } from "zod";

export const updateThreadTitle = createTool({
  args: z.object({
    title: z.string().describe("The new title for the thread"),
  }),
  description:
    "Update the title of the current thread. It will respond with 'updated' if it succeeded",
  handler: async (ctx, args) => {
    if (!ctx.threadId) {
      console.warn("updateThreadTitle called without a threadId");
      return "missing or invalid threadId";
    }
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId: ctx.threadId,
      patch: { title: args.title },
    });
    return "updated";
  },
});



================================================
FILE: example/convex/tools/weather.ts
================================================
// See the docs at https://docs.convex.dev/agents/tools
import { tool } from "ai";
import { z } from "zod";

export const getGeocoding = tool({
  description: "Get the latitude and longitude of a location",
  parameters: z.object({
    location: z
      .string()
      .describe("The location to get the geocoding for, e.g. 'San Francisco'"),
  }),
  execute: async ({ location }) => {
    console.log("getting geocoding for location", location);
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = (await geocodingResponse.json()) as {
      results: {
        latitude: number;
        longitude: number;
        name: string;
      }[];
    };

    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${location}' not found`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];
    console.log("got geocoding for location", name, latitude, longitude);
    return { latitude, longitude, name };
  },
});

export const getWeather = tool({
  description: "Get the weather for a location",
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async (args) => {
    console.log("getting weather for location", args);
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code&wind_speed_unit=mph&temperature_unit=fahrenheit`;

    const response = await fetch(weatherUrl);
    const data = (await response.json()) as {
      current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        wind_speed_10m: number;
        wind_gusts_10m: number;
        weather_code: number;
      };
    };
    console.log("got weather for location", data);
    return {
      temperature: `${data.current.temperature_2m}°F`,
      feelsLike: `${data.current.apparent_temperature}°F`,
      windSpeed: `${data.current.wind_speed_10m} mph`,
      windGust: `${data.current.wind_gusts_10m} mph`,
      description: nameOfWeatherCode(data.current.weather_code),
    };
  },
});

/**
 * Weather from https://open-meteo.com/en/docs?hourly=temperature_2m,weather_code
 * @param code WMO code
 * @returns text description of the weather
 */
function nameOfWeatherCode(code: number) {
  switch (code) {
    case 0:
      return "Clear";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
      return "Fog and depositing rime fog";
    case 48:
      return "Fog and depositing rime fog";
    case 51:
      return "Drizzle: Light";
    case 53:
      return "Drizzle: Moderate";
    case 55:
      return "Drizzle: Dense intensity";
    case 56:
      return "Freezing Drizzle: Light and dense intensity";
    case 57:
      return "Freezing Drizzle: Dense intensity";
    case 61:
      return "Light Rain";
    case 63:
      return "Moderate Rain";
    case 65:
      return "Heavy Rain";
    case 66:
      return "Light Freezing Rain";
    case 67:
      return "Heavy Freezing Rain";
    case 71:
      return "Lightly Snow";
    case 73:
      return "Snowing";
    case 75:
      return "Snowing heavily";
    case 77:
      return "Snow grains";
    case 80:
      return "Rain showers: Slight";
    case 81:
      return "Rain showers: Moderate";
    case 82:
      return "Rain showers: Violent";
    case 85:
      return "Snow showers: Slight";
    case 86:
      return "Snow showers: Heavy";
    case 95:
      return "Thunderstorm";
    case 96:
      return "Thunderstorm with light hail";
    case 99:
      return "Thunderstorm with heavy hail";
    default:
      return "Unknown";
  }
}



================================================
FILE: example/convex/usage_tracking/invoicing.ts
================================================
// See the docs at https://docs.convex.dev/agents/usage-tracking
import { internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getBillingPeriod } from "./usageHandler";

const HOUR_IN_MS = 60 * 60 * 1000;

const provider = v.string();
const model = v.string();
/**
 * Called from a cron monthly to calculate the
 * invoices for the previous billing period
 */
export const generateInvoices = internalMutation({
  args: {
    billingPeriod: v.optional(v.string()),
    cursor: v.optional(v.string()),
    inProgress: v.optional(
      v.object({
        userId: v.string(),
        usage: v.record(
          provider,
          v.record(
            model,
            v.object({
              inputTokens: v.number(),
              outputTokens: v.number(),
              cachedInputTokens: v.number(),
            }),
          ),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Assume we're billing within a week of the previous billing period
    const weekAgo = Date.now() - 7 * 24 * HOUR_IN_MS;
    const billingPeriod = args.billingPeriod ?? getBillingPeriod(weekAgo);

    const result = await ctx.db
      .query("rawUsage")
      .withIndex("billingPeriod_userId", (q) =>
        q.eq("billingPeriod", billingPeriod),
      )
      .paginate({
        cursor: args.cursor ?? null,
        numItems: 100,
      });
    let currentInvoice = args.inProgress;
    for (const doc of result.page) {
      const cachedPromptTokens =
        doc.providerMetadata?.openai?.cachedPromptTokens ?? 0;
      const tokens = {
        inputTokens: doc.usage.promptTokens - cachedPromptTokens,
        outputTokens: doc.usage.completionTokens,
        cachedInputTokens: cachedPromptTokens,
      };
      if (!currentInvoice) {
        currentInvoice = {
          userId: doc.userId,
          usage: { [doc.provider]: { [doc.model]: tokens } },
        };
      } else if (doc.userId !== currentInvoice.userId) {
        await createInvoice(ctx, currentInvoice, billingPeriod);
        currentInvoice = {
          userId: doc.userId,
          usage: { [doc.provider]: { [doc.model]: tokens } },
        };
      } else {
        const currentTokens = currentInvoice.usage[doc.provider][doc.model];
        currentTokens.inputTokens += tokens.inputTokens;
        currentTokens.outputTokens += tokens.outputTokens;
        currentTokens.cachedInputTokens += tokens.cachedInputTokens;
      }
    }
    if (result.isDone) {
      if (currentInvoice) {
        await createInvoice(ctx, currentInvoice, billingPeriod);
      }
    } else {
      await ctx.runMutation(
        internal.usage_tracking.invoicing.generateInvoices,
        {
          billingPeriod,
          cursor: result.continueCursor,
          inProgress: currentInvoice,
        },
      );
    }
  },
});

const MILLION = 1000000;

const PRICING: Record<
  string,
  Record<
    string,
    { inputPrice: number; cachedInputPrice: number; outputPrice: number }
  >
> = {
  "openai.chat": {
    "gpt-4o-mini": {
      inputPrice: 0.3,
      cachedInputPrice: 0.15,
      outputPrice: 1.2,
    },
  },
};

async function createInvoice(
  ctx: MutationCtx,
  invoice: {
    userId: string;
    usage: Record<
      string,
      Record<
        string,
        { inputTokens: number; outputTokens: number; cachedInputTokens: number }
      >
    >;
  },
  billingPeriod: string,
) {
  let amount = 0;
  for (const provider of Object.keys(invoice.usage)) {
    for (const model of Object.keys(invoice.usage[provider])) {
      if (PRICING[provider][model] === undefined) {
        throw new Error(`Missing pricing for ${provider} ${model}`);
      }
      const { inputPrice, cachedInputPrice, outputPrice } =
        PRICING[provider][model];
      const { inputTokens, cachedInputTokens, outputTokens } =
        invoice.usage[provider][model];
      amount +=
        ((inputTokens - cachedInputTokens) / MILLION) * inputPrice +
        (cachedInputTokens / MILLION) * cachedInputPrice +
        (outputTokens / MILLION) * outputPrice;
    }
  }
  // Check if the invoice already exists
  const existingInvoice = await ctx.db
    .query("invoices")
    .withIndex("billingPeriod_userId", (q) =>
      q.eq("billingPeriod", billingPeriod).eq("userId", invoice.userId),
    )
    .filter((q) => q.neq(q.field("status"), "failed"))
    .first();
  if (existingInvoice) {
    console.error(
      `Invoice already exists for ${invoice.userId} ${billingPeriod}`,
    );
  } else {
    await ctx.db.insert("invoices", {
      userId: invoice.userId,
      amount,
      billingPeriod,
      status: "pending",
    });
  }
}



================================================
FILE: example/convex/usage_tracking/tables.ts
================================================
// See the docs at https://docs.convex.dev/agents/usage-tracking
import { vProviderMetadata, vUsage } from "@convex-dev/agent";
import { defineTable } from "convex/server";
import { v } from "convex/values";

// If you want to track usage on a granular level, you could do something like this:
export default {
  rawUsage: defineTable({
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),

    // stats
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),

    // In this case, we're setting it to the first day of the current month,
    // using UTC time for the month boundaries.
    // You could alternatively store it as a timestamp number.
    // You can then fetch all the usage at the end of the billing period
    // and calculate the total cost.
    billingPeriod: v.string(), // When the usage period ended
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),

  invoices: defineTable({
    userId: v.string(),
    billingPeriod: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
    ),
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),
};



================================================
FILE: example/convex/usage_tracking/usageHandler.ts
================================================
// See the docs at https://docs.convex.dev/agents/usage-tracking
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { UsageHandler, vProviderMetadata, vUsage } from "@convex-dev/agent";
import { internal } from "../_generated/api";

export function getBillingPeriod(at: number) {
  const now = new Date(at);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth());
  return startOfMonth.toISOString().split("T")[0];
}

export const usageHandler: UsageHandler = async (ctx, args) => {
  if (!args.userId) {
    console.debug("Not tracking usage for anonymous user");
    return;
  }
  await ctx.runMutation(internal.usage_tracking.usageHandler.insertRawUsage, {
    userId: args.userId,
    agentName: args.agentName,
    model: args.model,
    provider: args.provider,
    usage: args.usage,
    providerMetadata: args.providerMetadata,
  });
};

export const insertRawUsage = internalMutation({
  args: {
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getBillingPeriod(Date.now());
    return await ctx.db.insert("rawUsage", {
      ...args,
      billingPeriod,
    });
  },
});



================================================
FILE: example/convex/workflows/chaining.ts
================================================
// See the docs at https://docs.convex.dev/agents/workflows
import { WorkflowId, WorkflowManager } from "@convex-dev/workflow";
import { createThread, saveMessage } from "@convex-dev/agent";
import { components, internal } from "../_generated/api";
import { action, mutation } from "../_generated/server";
import { v } from "convex/values";
import { z } from "zod";
import { weatherAgent } from "../agents/weather";
import { fashionAgent } from "../agents/fashion";
import { getAuthUserId } from "../utils";

/**
 * OPTION 1: Chain agent calls in a single action.
 *
 * This will do two steps in sequence with different agents:
 *
 * 1. Get the weather forecast
 * 2. Get fashion advice based on the weather
 */

export const getAdvice = action({
  args: { location: v.string(), threadId: v.string() },
  handler: async (ctx, { location, threadId }) => {
    const userId = await getAuthUserId(ctx);

    // Note: the message is saved automatically, and clients will get the
    // response via subscriptions automatically.
    await weatherAgent.generateText(
      ctx,
      { threadId, userId },
      { prompt: `What is the weather in ${location}?` },
    );

    // This includes previous message history from the thread automatically.
    await fashionAgent.generateText(
      ctx,
      { threadId, userId },
      { prompt: `What should I wear based on the weather?` },
    );
  },
});

/**
 * OPTION 2: Use agent actions in a workflow
 *
 * Workfows are durable functions that can survive server failures and retry
 * each step, calling queries, mutations, or actions.

 * They have higher guarantees around running to completion than normal
 * serverless functions. Each time a step finishes, the workflow re-executes,
 * fast-forwarding past steps it's already completed.
 */

const workflow = new WorkflowManager(components.workflow);

export const weatherAgentWorkflow = workflow.define({
  args: { location: v.string(), threadId: v.string() },
  handler: async (step, { location, threadId }): Promise<void> => {
    const weatherQ = await saveMessage(step, components.agent, {
      threadId,
      prompt: `What is the weather in ${location}?`,
    });
    const forecast = await step.runAction(
      internal.workflows.chaining.getForecast,
      { promptMessageId: weatherQ.messageId, threadId },
      { retry: true },
    );
    const fashionQ = await saveMessage(step, components.agent, {
      threadId,
      prompt: `What should I wear based on the weather?`,
    });
    const fashion = await step.runAction(
      internal.workflows.chaining.getFashionAdvice,
      { promptMessageId: fashionQ.messageId, threadId },
      {
        retry: { maxAttempts: 5, initialBackoffMs: 1000, base: 2 },
        // runAfter: 2 * 1000, // To add artificial delay
      },
    );
    console.log("Weather forecast:", forecast);
    console.log("Fashion advice:", fashion.object);
  },
});

export const startWorkflow = mutation({
  args: { location: v.string() },
  handler: async (
    ctx,
    { location },
    // It's best practice to annotate return types on all functions involved
    // in workflows, as circular types are common.
  ): Promise<{ threadId: string; workflowId: WorkflowId }> => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, {
      userId,
      title: `Weather in ${location}`,
    });
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.chaining.weatherAgentWorkflow,
      { location, threadId },
    );
    return { threadId, workflowId };
  },
});

/**
 * Expose the agents as actions
 *
 * Note: you could alternatively create your own actions that call the agent
 * internally.
 * This is a convenient shorthand.
 */
export const getForecast = weatherAgent.asTextAction({
  maxSteps: 3,
});
export const getFashionAdvice = fashionAgent.asObjectAction({
  schema: z.object({
    hat: z.string(),
    tops: z.string(),
    bottoms: z.string(),
    shoes: z.string(),
  }),
});



================================================
FILE: example/ui/index.css
================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-light: #ffffff;
  --color-dark: #171717;
}

.accent-text {
  @apply text-slate-600;
}

.button {
  @apply bg-gradient-to-r bg-blue-500;
}

body {
  font-family:
    "Inter Variable",
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    "Noto Sans",
    sans-serif,
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "Noto Color Emoji";
  color: var(--color-dark);
  background: var(--color-light);
}

.input-field {
  @apply w-full px-3 py-2 rounded-md bg-transparent border-2 border-slate-200 focus:outline-none focus:border-blue-500 transition-colors;
}

.auth-button {
  @apply w-full py-2 rounded-md text-white font-medium button hover:opacity-90 transition-opacity;
}

.link-text {
  @apply text-blue-500 hover:underline cursor-pointer font-medium;
}



================================================
FILE: example/ui/main.tsx
================================================
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import ChatBasic from "./chat/ChatBasic";
import ChatStreaming from "./chat/ChatStreaming";
import FilesImages from "./files/FilesImages";
import RateLimiting from "./rate_limiting/RateLimiting";
import { WeatherFashion } from "./workflows/WeatherFashion";
import RagBasic from "./rag/RagBasic";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>,
);

export function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <header className="z-50 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
          <nav className="flex gap-4 items-center">
            <Link to="/" className="hover:text-indigo-600">
              <h2 className="text-xl font-semibold accent-text">
                Agent Examples
              </h2>
            </Link>
          </nav>
        </header>
        <main className="flex-1 h-full overflow-scroll">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat-basic" element={<ChatBasic />} />
            <Route path="/chat-streaming" element={<ChatStreaming />} />
            <Route path="/files-images" element={<FilesImages />} />
            <Route path="/rag-basic" element={<RagBasic />} />
            <Route path="/rate-limiting" element={<RateLimiting />} />
            <Route path="/weather-fashion" element={<WeatherFashion />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

function Index() {
  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-4">Agent Example Index</h1>
        <p className="mb-6 text-lg">
          Explore the available agent/AI examples below.
        </p>
        <ul className="space-y-4">
          <li className="border rounded p-4 hover:shadow transition">
            <Link
              to="/chat-basic"
              className="text-xl font-semibold text-indigo-700 hover:underline"
            >
              Basic Chat
            </Link>
            <p className="mt-2 text-gray-700">
              A simple chat with an AI agent. No tool calls, no streaming. Just
              enough to see it in action.
            </p>
          </li>
          <li className="border rounded p-4 hover:shadow transition">
            <Link
              to="/chat-streaming"
              className="text-xl font-semibold text-indigo-700 hover:underline"
            >
              Streaming Chat
            </Link>
            <p className="mt-2 text-gray-700">
              A simple streaming chat interface with an AI agent. Shows how to
              stream responses from an LLM in real time (without HTTP
              streaming!).
            </p>
          </li>
          <li className="border rounded p-4 hover:shadow transition">
            <Link
              to="/files-images"
              className="text-xl font-semibold text-indigo-700 hover:underline"
            >
              Files & Images
            </Link>
            <p className="mt-2 text-gray-700">
              Upload images to ask an LLM about, and have them automatically
              saved and tracked.
            </p>
          </li>
          <li className="border rounded p-4 hover:shadow transition">
            <Link
              to="/rag-basic"
              className="text-xl font-semibold text-indigo-700 hover:underline"
            >
              RAG Chat
            </Link>
            <p className="mt-2 text-gray-700">
              A simple RAG example with a chat interface.
            </p>
          </li>
          <li className="border rounded p-4 hover:shadow transition">
            <Link
              to="/rate-limiting"
              className="text-xl font-semibold text-indigo-700 hover:underline"
            >
              Rate Limiting
            </Link>
            <p className="mt-2 text-gray-700">
              Demonstrates rate limiting both message sending frequency and
              based on token usage.
            </p>
          </li>
          <li className="border rounded p-4 hover:shadow transition">
            <Link
              to="/weather-fashion"
              className="text-xl font-semibold text-indigo-700 hover:underline"
            >
              Tool Usage
            </Link>
            <p className="mt-2 text-gray-700">
              Demonstrates multi-step agent reasoning and tool use, via an
              example of a weather agent that uses a tool to get the weather and
              a fashion agent that uses a tool to get outfit suggestions based
              on the weather.
            </p>
          </li>
        </ul>
        <div className="mt-8 text-sm text-gray-500">
          More examples coming soon!
        </div>
      </div>
    </>
  );
}



================================================
FILE: example/ui/vite-env.d.ts
================================================
/// <reference types="vite/client" />



================================================
FILE: example/ui/chat/ChatBasic.tsx
================================================
import { useMutation, useQuery } from "convex/react";
import { Toaster } from "../components/ui/toaster";
import { usePaginatedQuery } from "convex-helpers/react";
import { api } from "../../convex/_generated/api";
import {
  optimisticallySendMessage,
  toUIMessages,
  useThreadMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../lib/utils";

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

export default function ChatBasic() {
  const createThread = useMutation(api.threads.createNewThread);
  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );

  // Fetch thread title if threadId exists
  const threadDetails = useQuery(
    api.threads.getThreadDetails,
    threadId ? { threadId } : "skip",
  );

  // Fetch all threads (internal API)
  // For demo, hardcode userId as in backend
  const threads = usePaginatedQuery(
    api.threads.listThreads,
    {},
    { initialNumItems: 20 },
  );

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      setThreadId(getThreadIdFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Reset handler: create a new thread and update hash
  const newThread = useCallback(() => {
    void createThread({ title: "Fresh thread" }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  // On mount or when threadId changes, if no threadId, create one and set hash
  useEffect(() => {
    if (!threadId) newThread();
  }, [newThread, threadId]);

  return (
    <div className="h-full flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold accent-text">
            Basic Chat Example
          </h1>
          {threadId && threadDetails && threadDetails.title && (
            <span
              className="text-gray-500 text-base font-normal truncate max-w-xs"
              title={threadDetails.title}
            >
              &mdash; {threadDetails.title}
            </span>
          )}
        </div>
      </header>
      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col h-full min-h-0">
          <div className="p-4 border-b font-semibold text-lg">Threads</div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {threads.results.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">No threads yet.</div>
            )}
            <ul>
              {threads.results.map((thread) => (
                <li key={thread._id}>
                  <button
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-2",
                      threadId === thread._id &&
                        "bg-blue-100 text-blue-900 font-semibold",
                    )}
                    onClick={() => {
                      window.location.hash = thread._id;
                      setThreadId(thread._id);
                    }}
                  >
                    <span className="truncate max-w-[10rem]">
                      {thread.title || "Untitled thread"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-4 py-2">
            <button
              onClick={newThread}
              className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
            >
              <span className="text-lg">+</span>
              <span>New Thread</span>
            </button>
          </div>
        </aside>
        {/* Main chat area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-0">
          {threadId ? (
            <Chat threadId={threadId} />
          ) : (
            <div className="text-center text-gray-500">Loading...</div>
          )}
        </main>
        <Toaster />
      </div>
    </div>
  );
}

function Chat({ threadId }: { threadId: string }) {
  const messages = useThreadMessages(
    api.chat.basic.listMessages,
    { threadId },
    { initialNumItems: 10 },
  );
  const sendMessage = useMutation(
    api.chat.basic.sendMessage,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.basic.listMessages),
  );
  const [prompt, setPrompt] = useState("Yo yo yo");

  function onSendClicked() {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt === "") return;
    void sendMessage({ threadId, prompt: trimmedPrompt }).catch(() =>
      setPrompt(prompt),
    );
    setPrompt("");
  }

  return (
    <>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6 h-full min-h-0 justify-end">
        {messages.status !== "Exhausted" && messages.results?.length > 0 && (
          <div className="flex justify-center">
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              onClick={() => messages.loadMore(10)}
              disabled={messages.status !== "CanLoadMore"}
            >
              Load More
            </button>
          </div>
        )}
        {messages.results?.length > 0 && (
          <div className="flex flex-col gap-4 overflow-y-auto mb-4 flex-1 min-h-0">
            {toUIMessages(messages.results ?? []).map((m) => (
              <Message key={m.key} message={m} />
            ))}
          </div>
        )}
        <form
          className="flex gap-2 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            onSendClicked();
          }}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            placeholder="Ask me anything..."
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            disabled={!prompt.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm ${
          isUser ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}



================================================
FILE: example/ui/chat/ChatStreaming.tsx
================================================
import { useMutation } from "convex/react";
import { Toaster } from "../components/ui/toaster";
import { api } from "../../convex/_generated/api";
import {
  optimisticallySendMessage,
  toUIMessages,
  useSmoothText,
  useThreadMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

export default function ChatStreaming() {
  const createThread = useMutation(api.threads.createNewThread);
  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      setThreadId(getThreadIdFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const resetThread = useCallback(() => {
    void createThread({
      title: "Streaming Chat Example",
    }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  // On mount or when threadId changes, if no threadId, create one and set hash
  useEffect(() => {
    if (!threadId) {
      void resetThread();
    }
  }, [resetThread, threadId]);

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
          <h1 className="text-xl font-semibold accent-text">
            Streaming Chat Example
          </h1>
        </header>
        <main className="flex-1 flex flex-col">
          {threadId ? (
            <>
              <Story threadId={threadId} reset={resetThread} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading...
            </div>
          )}
        </main>
        <Toaster />
      </div>
    </>
  );
}

function Story({ threadId, reset }: { threadId: string; reset: () => void }) {
  const messages = useThreadMessages(
    api.chat.streaming.listMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );
  const sendMessage = useMutation(
    api.chat.streaming.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.streaming.listMessages),
  );
  const abortStreamByOrder = useMutation(
    api.chat.streamAbort.abortStreamByOrder,
  );
  const [prompt, setPrompt] = useState("Tell me a story");

  function onSendClicked() {
    if (prompt.trim() === "") return;
    void sendMessage({ threadId, prompt }).catch(() => setPrompt(prompt));
    setPrompt("");
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full">
        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.results?.length > 0 ? (
            <div className="flex flex-col gap-4 whitespace-pre">
              {toUIMessages(messages.results ?? []).map((m) => (
                <Message key={m.key} message={m} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Start a conversation...
            </div>
          )}
        </div>

        {/* Fixed input area at bottom */}
        <div className="border-t bg-white p-6">
          <form
            className="flex gap-2 items-center max-w-2xl mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              onSendClicked();
            }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              placeholder={
                messages.results?.length > 0
                  ? "Continue the story..."
                  : "Tell me a story..."
              }
            />
            {messages.results.find((m) => m.streaming) ? (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium self-end"
                onClick={() => {
                  const order =
                    messages.results.find((m) => m.streaming)?.order ?? 0;
                  void abortStreamByOrder({ threadId, order });
                }}
                type="button"
              >
                Abort
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                disabled={!prompt.trim()}
              >
                Send
              </button>
            )}
            {messages.results?.length > 0 && (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium self-end"
                onClick={() => {
                  reset();
                  setPrompt("Tell me a story");
                }}
                type="button"
              >
                Reset
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.content, {
    // This tells the hook that it's ok to start streaming immediately.
    // If this was always passed as true, messages that are already done would
    // also stream in.
    // IF this was always passed as false (default), then the streaming message
    // wouldn't start streaming until the second chunk was received.
    startStreaming: message.status === "streaming",
  });
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm",
          isUser ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800",
          {
            "bg-green-100": message.status === "streaming",
            "bg-red-100": message.status === "failed",
          },
        )}
      >
        {visibleText}
      </div>
    </div>
  );
}



================================================
FILE: example/ui/components/Monitor.tsx
================================================
import { useState, useCallback, useEffect, useRef } from "react";
import type {
  GetRateLimitValueQuery,
  UseRateLimitOptions,
} from "@convex-dev/rate-limiter/react";
import { useRateLimit } from "@convex-dev/rate-limiter/react";
import { useQuery } from "convex/react";

interface ConsumptionEvent {
  timestamp: number;
  success: boolean;
}

interface MonitorProps {
  getRateLimitValueQuery: GetRateLimitValueQuery;
  opts?: UseRateLimitOptions;
  consumptionHistory?: ConsumptionEvent[];
  height?: string | number;
}

function formatNumber(value: number) {
  if (value < 1000) return value.toFixed(1);
  if (value < 100000) return (value / 1000).toFixed(1) + "k";
  return (value / 1000000).toFixed(1) + "M";
}

export function Monitor({
  getRateLimitValueQuery,
  opts,
  consumptionHistory = [],
  height = "320px",
}: MonitorProps) {
  const [timelineData, setTimelineData] = useState<
    Array<{ timestamp: number; value: number }>
  >([]);

  // Canvas refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const canvasSetupRef = useRef<{
    width: number;
    height: number;
    dpr: number;
  } | null>(null);

  const { check } = useRateLimit(getRateLimitValueQuery, opts);
  const raw = useQuery(getRateLimitValueQuery, {
    config: opts?.config,
    name: opts?.name,
    key: opts?.key,
    sampleShards: opts?.sampleShards,
  });

  const capacity = raw?.config.capacity ?? 1;

  // Update timeline data every 100ms with calculated values
  useEffect(() => {
    const updateTimeline = () => {
      const now = Date.now();
      // Calculate current value using server time for rate limit calculation
      const calculated = check(now, 0);
      if (!calculated) return;
      const newPoint = { timestamp: now, value: calculated.value }; // Keep client time for UI

      setTimelineData((prev) => {
        const filtered = prev.filter((point) => now - point.timestamp < 10000); // Keep last 10 seconds
        return [...filtered, newPoint];
      });
    };

    // Initial update
    updateTimeline();

    // Set up interval for regular updates
    const interval = setInterval(updateTimeline, 200);

    return () => {
      clearInterval(interval);
    };
  }, [check]);

  // Setup canvas with proper DPI scaling (only when size changes)
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Check if we need to resize
    const currentSetup = canvasSetupRef.current;
    if (
      currentSetup &&
      currentSetup.width === rect.width &&
      currentSetup.height === rect.height &&
      currentSetup.dpr === dpr
    ) {
      return canvas.getContext("2d");
    }

    // Set actual size in memory (scaled to account for pixel ratio)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale CSS size back down
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    // Get context and scale it
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Store the current setup
    canvasSetupRef.current = { width: rect.width, height: rect.height, dpr };

    return ctx;
  }, []);

  // Draw timeline with smooth rendering
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const { width, height } = rect;
    const now = Date.now();
    const tenSecondsAgo = now - 10000;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up drawing parameters
    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Title for the graph
    ctx.fillStyle = "#374151";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(opts?.name ?? "Tokens", width / 2, padding - 10);

    // Draw background grid
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;

    // Vertical grid lines (time)
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines (values)
    const maxY = Math.ceil(capacity * 1.1);
    for (let i = 0; i <= maxY; i += Math.max(1, Math.floor(maxY / 8))) {
      const y = height - padding - (i / maxY) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes with better styling
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw capacity line with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#f59e0b");
    gradient.addColorStop(1, "#d97706");

    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    const capacityY = height - padding - (capacity / maxY) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding, capacityY);
    ctx.lineTo(width - padding, capacityY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw timeline data with smooth curves
    if (timelineData.length > 0) {
      // Create gradient for the line
      const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
      lineGradient.addColorStop(0, "#3b82f6");
      lineGradient.addColorStop(1, "#1d4ed8");

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();

      // Start with a line from Y-axis to the first data point to eliminate gaps
      const firstPoint = timelineData[0];
      const firstX =
        padding + ((firstPoint.timestamp - tenSecondsAgo) / 10000) * plotWidth;
      const firstY =
        height - padding - (Math.max(0, firstPoint.value) / maxY) * plotHeight;

      // Only draw connecting line if first point is within visible area
      if (firstX >= padding) {
        // Draw line from Y-axis to first point at the same height
        ctx.moveTo(padding, firstY);
        ctx.lineTo(firstX, firstY);
      }

      timelineData.forEach((point, index) => {
        const x =
          padding + ((point.timestamp - tenSecondsAgo) / 10000) * plotWidth;
        const y =
          height - padding - (Math.max(0, point.value) / maxY) * plotHeight;

        if (index === 0) {
          // If we didn't draw connecting line, start here
          if (firstX < padding) {
            ctx.moveTo(Math.max(padding, x), y);
          }
        } else {
          ctx.lineTo(Math.max(padding, x), y);
        }
      });

      // Extend line to the right edge with current value
      if (timelineData.length > 0) {
        const lastPoint = timelineData[timelineData.length - 1];
        const lastY =
          height - padding - (Math.max(0, lastPoint.value) / maxY) * plotHeight;
        ctx.lineTo(width - padding, lastY);
      }

      ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Draw current value indicator (always at right edge)
      const lastPoint = timelineData[timelineData.length - 1];
      const y =
        height - padding - (Math.max(0, lastPoint.value) / maxY) * plotHeight;

      // Value label with modern styling (positioned to the right of the graph)
      const labelText = formatNumber(lastPoint.value);
      ctx.font = "bold 12px Inter, sans-serif";
      const labelMetrics = ctx.measureText(labelText);
      const labelWidth = labelMetrics.width + 8;
      const labelHeight = 24;
      const labelX = width - padding; // Position to the right of the graph
      const labelY = Math.max(y + labelHeight / 2, padding + labelHeight);

      // Label background with shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(
        labelX + 2,
        labelY - labelHeight + 2,
        labelWidth,
        labelHeight,
      );

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(labelX, labelY - labelHeight, labelWidth, labelHeight);

      // Label border
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY - labelHeight, labelWidth, labelHeight);

      // Label text
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.fillText(labelText, labelX + labelWidth / 2, labelY - 6);
    }

    // Draw consumption dots at bottom of graph
    const recentEvents = consumptionHistory.filter(
      (event) => now - event.timestamp < 10000,
    );

    recentEvents.forEach((event) => {
      const x =
        padding + ((event.timestamp - tenSecondsAgo) / 10000) * plotWidth;

      // Position dot at the bottom of the graph
      const dotY = height - padding - 5; // 5px above the X-axis
      const dotRadius = 4;

      // Draw dot with appropriate color
      ctx.beginPath();
      ctx.arc(x, dotY, dotRadius, 0, 2 * Math.PI);

      if (event.success) {
        ctx.fillStyle = "#10b981"; // Green for success
      } else {
        ctx.fillStyle = "#ef4444"; // Red for failure
      }

      ctx.fill();

      // Add a subtle border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw axis labels with modern typography
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "right";

    // Y-axis labels - position them better to avoid overlap
    for (let i = 0; i <= maxY; i += Math.max(1, Math.floor(capacity / 5))) {
      const y = height - padding - (i / maxY) * plotHeight;
      ctx.fillText(formatNumber(i), padding - 10, y + 4);
    }

    // X-axis labels
    ctx.textAlign = "center";
    ctx.fillText("10s ago", padding, height - 20);
    ctx.fillText("5s ago", padding + plotWidth / 2, height - 20);
    ctx.fillText("now", width - padding, height - 20);

    // Axis titles
    ctx.fillStyle = "#374151";
    ctx.font = "bold 14px Inter, sans-serif";

    // Schedule next frame
    animationRef.current = requestAnimationFrame(drawTimeline);
  }, [timelineData, consumptionHistory, capacity, opts?.name]);

  // Setup canvas when component mounts or container size changes
  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  // Start animation loop
  useEffect(() => {
    drawTimeline();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawTimeline]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200"
      style={{ height }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default Monitor;



================================================
FILE: example/ui/components/ui/toast.tsx
================================================
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};



================================================
FILE: example/ui/components/ui/toaster.tsx
================================================
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}



================================================
FILE: example/ui/files/FilesImages.tsx
================================================
import { useAction, useMutation } from "convex/react";
import { Toaster } from "../components/ui/toaster";
import { api } from "../../convex/_generated/api";
import {
  optimisticallySendMessage,
  toUIMessages,
  useThreadMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "../hooks/use-toast";

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

export default function Example() {
  const uploadFile = useAction(api.files.addFile.uploadFile);
  const [question, setQuestion] = useState("What's in this image?");

  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );
  const submitFileQuestion = useMutation(
    api.files.addFile.submitFileQuestion,
  ).withOptimisticUpdate((store, args) => {
    if (!threadId) return;
    optimisticallySendMessage(api.chat.basic.listMessages)(store, {
      prompt: args.question,
      threadId,
    });
  });
  const [file, setFile] = useState<{ fileId: string; url: string } | undefined>(
    undefined,
  );
  const messages = useThreadMessages(
    api.chat.basic.listMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 10 },
  );

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      setThreadId(getThreadIdFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // window.location.hash = newId;
  const handleFileUpload = useCallback(
    async (file: File) => {
      const { fileId, url } = await uploadFile({
        bytes: await file.arrayBuffer(),
        filename: file.name,
        mimeType: file.type,
      });
      setFile({ fileId, url });
    },
    [uploadFile],
  );

  const handleSubmitFileQuestion = useCallback(
    async (question: string) => {
      if (!file?.fileId) throw new Error("No file selected");
      setQuestion("");
      await submitFileQuestion({
        fileId: file?.fileId,
        question,
      })
        .then(({ threadId }) => {
          setThreadId(threadId);
          window.location.hash = threadId;
        })
        .catch((e) => {
          toast({
            title: "Failed to submit question",
            description: e.message,
          });
          setQuestion((q) => q || question);
        });
    },
    [submitFileQuestion, file?.fileId],
  );

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-semibold accent-text">
          Files and Images Example
        </h1>
      </header>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            {/* Image Preview */}

            {/* Chat Messages */}
            {messages.results?.length > 0 ? (
              <>
                <div className="w-full flex flex-col gap-4 overflow-y-auto mb-6 px-2">
                  {toUIMessages(messages.results ?? []).map((m) => (
                    <Message key={m.key} message={m} />
                  ))}
                </div>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-medium mt-2"
                  onClick={() => {
                    setThreadId(undefined);
                    setFile(undefined);
                    setQuestion("What's in this image?");
                    window.location.hash = "";
                  }}
                  type="button"
                >
                  Start over
                </button>
              </>
            ) : (
              <>
                {file && (
                  <div className="w-full flex flex-col items-center mb-4">
                    <img
                      src={file.url}
                      alt={file.fileId}
                      className="max-h-64 rounded-xl border border-gray-300 shadow-md object-contain bg-gray-100"
                    />
                  </div>
                )}
                <form
                  className="w-full flex flex-col gap-4 items-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmitFileQuestion(question);
                  }}
                >
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileUpload(file);
                    }}
                    className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                  />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-lg"
                    placeholder="Ask a question about the file"
                    // disabled={!file?.fileId}
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-50"
                    disabled={!file?.fileId || !question.trim()}
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
        <Toaster />
      </div>
    </>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div
        className={`rounded-2xl px-5 py-3 max-w-[75%] whitespace-pre-wrap shadow-md text-base break-words border ${
          isUser
            ? "bg-blue-100 text-blue-900 border-blue-200"
            : "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {message.parts.map((part, i) => {
          const key = message.key + i;
          switch (part.type) {
            case "text":
              return <div key={key}>{part.text}</div>;
            case "file":
              if (part.mimeType.startsWith("image/")) {
                return (
                  <img
                    key={key}
                    src={part.data}
                    className="max-h-40 rounded-lg mt-2 border border-gray-300 shadow"
                  />
                );
              }
              return (
                <a
                  key={key}
                  href={part.data}
                  className="text-blue-600 underline"
                >
                  {"📎"}File
                </a>
              );
            case "reasoning":
              return (
                <div key={key} className="italic text-gray-500">
                  {part.reasoning}
                </div>
              );
            case "tool-invocation":
              return (
                <div key={key} className="text-xs text-gray-400">
                  {part.toolInvocation.toolName}
                </div>
              );
            case "source":
              return (
                <a
                  key={key}
                  href={part.source.url}
                  className="text-blue-500 underline"
                >
                  {part.source.title ?? part.source.url}
                </a>
              );
          }
        })}
      </div>
    </div>
  );
}



================================================
FILE: example/ui/hooks/use-toast.ts
================================================
"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };



================================================
FILE: example/ui/lib/utils.ts
================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



================================================
FILE: example/ui/rag/RagBasic.tsx
================================================
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import {
  optimisticallySendMessage,
  useSmoothText,
  useThreadMessages,
} from "@convex-dev/agent/react";
import { api } from "../../convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import { EntryId } from "@convex-dev/rag";
import { toast } from "@/hooks/use-toast";

function RagBasicUI() {
  const [selectedEntry, setSelectedEntry] = useState<EntryId | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const createThread = useMutation(api.threads.createNewThread);
  useEffect(() => {
    if (threadId) return;
    void createThread({
      title: "RAG Thread",
    }).then((threadId) => {
      setThreadId(threadId);
    });
  }, [createThread, threadId]);

  // Error state
  const [error, setError] = useState<Error | undefined>(undefined);

  // Context form state
  const [addContextForm, setAddContextForm] = useState({
    key: "",
    text: "",
  });
  const [isAddingContext, setIsAddingContext] = useState(false);

  // Chat state
  const [prompt, setPrompt] = useState("");
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(
    new Set(),
  );

  // Actions and queries
  const addContext = useAction(api.rag.ragAsPrompt.addContext);
  const sendMessage = useMutation(
    api.rag.ragAsPrompt.askQuestion,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.rag.utils.listMessagesWithContext),
  );
  const listMessages = useThreadMessages(
    api.rag.utils.listMessagesWithContext,
    threadId ? { threadId } : "skip",
    { initialNumItems: 10, stream: true },
  );
  const globalDocuments = usePaginatedQuery(
    api.rag.utils.listEntries,
    {},
    { initialNumItems: 10 },
  );
  const documentChunks = usePaginatedQuery(
    api.rag.utils.listChunks,
    selectedEntry ? { entryId: selectedEntry } : "skip",
    { initialNumItems: 10 },
  );

  // Handle adding context
  const handleAddContext = useCallback(async () => {
    if (!addContextForm.key.trim() || !addContextForm.text.trim()) return;

    setIsAddingContext(true);
    try {
      await addContext({
        title: addContextForm.key.trim(),
        text: addContextForm.text.trim(),
      });
      setAddContextForm({ key: "", text: "" });
    } catch (error) {
      console.error("Error adding context:", error);
    } finally {
      setIsAddingContext(false);
    }
  }, [addContext, addContextForm]);

  // Handle sending message
  const onSendClicked = useCallback(() => {
    if (!prompt.trim()) return;

    if (!threadId) {
      toast({
        title: "Thread ID is not set",
        description: "Please create a thread first",
      });
      return;
    }
    setPrompt("");
    sendMessage({
      threadId,
      prompt: prompt.trim(),
    }).catch((error) => {
      setError(error);
      console.error("Error sending message:", error);
      setPrompt(prompt);
    });
  }, [sendMessage, threadId, prompt]);

  // Toggle context expansion
  const toggleContextExpansion = useCallback((messageId: string) => {
    setExpandedContexts((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Left Panel - Context Entries */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Context
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={addContextForm.key}
                  onChange={(e) =>
                    setAddContextForm((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter context title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text
                </label>
                <textarea
                  value={addContextForm.text}
                  onChange={(e) =>
                    setAddContextForm((prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter context body"
                />
              </div>

              <button
                onClick={() => void handleAddContext()}
                disabled={
                  isAddingContext ||
                  !addContextForm.key.trim() ||
                  !addContextForm.text.trim()
                }
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isAddingContext ? "Adding..." : "Add Context"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <h3 className="mb-3 font-medium text-gray-900">
                Context Entries
              </h3>
              <div className="space-y-2">
                {globalDocuments.results?.map((entry) => (
                  <div
                    key={entry.entryId}
                    className={`p-3 border rounded transition-colors cursor-pointer ${
                      selectedEntry === entry.entryId
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedEntry(entry.entryId)}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {entry.title || entry.key}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status: {entry.status}
                    </div>
                  </div>
                ))}
                {globalDocuments.results?.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No context entries yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel - Entry Chunks */}
        {selectedEntry && (
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Entry Chunks
                </h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close chunks panel"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {globalDocuments.results?.find(
                  (e) => e.entryId === selectedEntry,
                )?.key || "Selected entry"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {documentChunks.results && documentChunks.results.length > 0 ? (
                <div className="p-4 space-y-3">
                  {documentChunks.results.map((chunk) => (
                    <>
                      <div className="text-sm font-medium text-gray-500">
                        Chunk {chunk.order}
                      </div>
                      <div
                        key={chunk.order}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="text-sm text-gray-800 leading-relaxed">
                          {chunk.text}
                        </div>
                      </div>
                    </>
                  ))}

                  {documentChunks.status === "CanLoadMore" && (
                    <button
                      onClick={() => documentChunks.loadMore(10)}
                      className="w-full py-3 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      Load More Chunks
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    {documentChunks.status === "LoadingFirstPage" ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>Loading chunks...</p>
                      </>
                    ) : (
                      <p>No chunks found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Chat Interface */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-0">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6 h-full min-h-0 justify-end">
            {listMessages.results && listMessages.results.length > 0 && (
              <div className="flex flex-col gap-4 overflow-y-auto mb-4 flex-1 min-h-0">
                {listMessages.results.map(
                  (message) =>
                    message.text && (
                      <div key={message._id} className="space-y-2">
                        {/* Message */}
                        <div
                          className={`flex ${message.message?.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm ${
                              message.message?.role === "user"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <MessageText
                              text={message.text}
                              streaming={message.streaming}
                            />
                          </div>
                        </div>

                        {/* Context Section (expandable) - shown after user message */}
                        {message.contextUsed &&
                          message.message?.role === "user" && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg">
                              <button
                                onClick={() =>
                                  toggleContextExpansion(message._id)
                                }
                                className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                              >
                                <span>
                                  Context Used (
                                  {message.contextUsed.results.length} results)
                                </span>
                                <span className="text-gray-400">
                                  {expandedContexts.has(message._id)
                                    ? "−"
                                    : "+"}
                                </span>
                              </button>

                              {expandedContexts.has(message._id) && (
                                <div className="px-4 pb-4 space-y-2">
                                  {message.contextUsed.results.map(
                                    (result, index) => (
                                      <div
                                        key={index}
                                        className="bg-white border border-gray-200 rounded p-3"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="text-xs font-medium text-gray-600">
                                            Entry:{" "}
                                            {message.contextUsed!.entries.find(
                                              (e) =>
                                                e.entryId === result.entryId,
                                            )?.key || "Unknown"}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Score: {result.score.toFixed(3)} |
                                            Order: {result.order}
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-800 space-y-1">
                                          {result.content.map(
                                            (content, contentIndex) => (
                                              <div key={contentIndex}>
                                                {content.text}
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    ),
                )}
              </div>
            )}
            <form
              className="flex gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                onSendClicked();
              }}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                placeholder="Ask me anything and I'll leverage the context you added..."
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                disabled={!prompt.trim() || !threadId}
              >
                Send
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-red-500 transition font-semibold disabled:opacity-50"
                title="Start over"
                onClick={() => {
                  setThreadId(undefined);
                }}
                disabled={!listMessages.results?.length}
              >
                Start over
              </button>
            </form>
          </div>
        </main>
      </div>
      {error && <div className="text-red-500 text-center">{error.message}</div>}
    </div>
  );
}

function MessageText({
  text,
  streaming,
}: {
  text: string;
  streaming?: boolean;
}) {
  const [smoothText] = useSmoothText(text, { startStreaming: streaming });
  return smoothText;
}

export default RagBasicUI;



================================================
FILE: example/ui/rate_limiting/RateLimiting.tsx
================================================
import { useMutation, useQuery } from "convex/react";
import { Toaster } from "../components/ui/toaster";
import { api } from "../../convex/_generated/api";
import {
  toUIMessages,
  useThreadMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useCallback, useEffect, useState, useRef, useReducer } from "react";
import { toast } from "../hooks/use-toast";
import { isRateLimitError } from "@convex-dev/rate-limiter";
import { useRateLimit } from "@convex-dev/rate-limiter/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Monitor } from "../components/Monitor";

dayjs.extend(relativeTime);

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

export default function Example() {
  const [question, setQuestion] = useState("What's 1+1?");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { status } = useRateLimit(api.rate_limiting.utils.getRateLimit, {
    getServerTimeMutation: api.rate_limiting.utils.getServerTime,
  });
  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );
  const previousUsage = useQuery(
    api.rate_limiting.utils.getPreviousUsage,
    threadId ? { threadId } : "skip",
  );
  const estimatedUsage = previousUsage ?? 0 + question.length;
  const { status: tokenUsageStatus } = useRateLimit(
    api.rate_limiting.utils.getRateLimit,
    {
      getServerTimeMutation: api.rate_limiting.utils.getServe