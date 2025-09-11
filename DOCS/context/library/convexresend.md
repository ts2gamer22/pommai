This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
.cursor/
  rules/
    convex_rules.mdc
.github/
  workflows/
    node.js.yml
example/
  convex/
    _generated/
      api.d.ts
      api.js
      dataModel.d.ts
      server.d.ts
      server.js
    convex.config.ts
    crons.ts
    example.ts
    http.ts
    README.md
    schema.ts
    tsconfig.json
  .gitignore
  eslint.config.js
  index.html
  package.json
  README.md
  tsconfig.json
src/
  client/
    _generated/
      _ignore.ts
    index.test.ts
    index.ts
    setup.test.ts
  component/
    _generated/
      api.d.ts
      api.js
      dataModel.d.ts
      server.d.ts
      server.js
    convex.config.ts
    lib.test.ts
    lib.ts
    schema.ts
    setup.test.ts
    shared.ts
    utils.ts
  vitest.config.ts
.gitignore
.prettierrc.json
CONTRIBUTING.md
eslint.config.js
LICENSE
node10stubs.mjs
package.json
README.md
tsconfig.build.json
tsconfig.json
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path=".cursor/rules/convex_rules.mdc">
---
description: Guidelines and best practices for building Convex projects, including database schema design, queries, mutations, and real-world examples
globs: **/*.{ts,tsx,js,jsx}
---

# Convex guidelines
## Function guidelines
### New function syntax
- ALWAYS use the new function syntax for Convex functions. For example:
      ```typescript
      import { query } from "./_generated/server";
      import { v } from "convex/values";
      export const f = query({
          args: {},
          returns: v.null(),
          handler: async (ctx, args) => {
          // Function body
          },
      });
      ```

### Http endpoint syntax
- HTTP endpoints are defined in `convex/http.ts` and require an `httpAction` decorator. For example:
      ```typescript
      import { httpRouter } from "convex/server";
      import { httpAction } from "./_generated/server";
      const http = httpRouter();
      http.route({
          path: "/echo",
          method: "POST",
          handler: httpAction(async (ctx, req) => {
          const body = await req.bytes();
          return new Response(body, { status: 200 });
          }),
      });
      ```
- HTTP endpoints are always registered at the exact path you specify in the `path` field. For example, if you specify `/api/someRoute`, the endpoint will be registered at `/api/someRoute`.

### Validators
- Below is an example of an array validator:
                            ```typescript
                            import { mutation } from "./_generated/server";
                            import { v } from "convex/values";

                            export default mutation({
                            args: {
                                simpleArray: v.array(v.union(v.string(), v.number())),
                            },
                            handler: async (ctx, args) => {
                                //...
                            },
                            });
                            ```
- Below is an example of a schema with validators that codify a discriminated union type:
                            ```typescript
                            import { defineSchema, defineTable } from "convex/server";
                            import { v } from "convex/values";

                            export default defineSchema({
                                results: defineTable(
                                    v.union(
                                        v.object({
                                            kind: v.literal("error"),
                                            errorMessage: v.string(),
                                        }),
                                        v.object({
                                            kind: v.literal("success"),
                                            value: v.number(),
                                        }),
                                    ),
                                )
                            });
                            ```
- Always use the `v.null()` validator when returning a null value. Below is an example query that returns a null value:
                                  ```typescript
                                  import { query } from "./_generated/server";
                                  import { v } from "convex/values";

                                  export const exampleQuery = query({
                                    args: {},
                                    returns: v.null(),
                                    handler: async (ctx, args) => {
                                        console.log("This query returns a null value");
                                        return null;
                                    },
                                  });
                                  ```

### Function registration
- Use `internalQuery`, `internalMutation`, and `internalAction` to register internal functions. These functions are private and aren't part of an app's API. They can only be called by other Convex functions. These functions are always imported from `./_generated/server`.
- Use `query`, `mutation`, and `action` to register public functions. These functions are part of the public API and are exposed to the public Internet. Do NOT use `query`, `mutation`, or `action` to register sensitive internal functions that should be kept private.
- You CANNOT register a function through the `api` or `internal` objects.
- ALWAYS include argument and return validators for all Convex functions. This includes all of `query`, `internalQuery`, `mutation`, `internalMutation`, `action`, and `internalAction`. If a function doesn't return anything, include `returns: v.null()` as its output validator.
- If the JavaScript implementation of a Convex function doesn't have a return value, it implicitly returns `null`.

### Function calling
- Use `ctx.runQuery` to call a query from a query, mutation, or action.
- Use `ctx.runMutation` to call a mutation from a mutation or action.
- Use `ctx.runAction` to call an action from an action.
- ONLY call an action from another action if you need to cross runtimes (e.g. from V8 to Node). Otherwise, pull out the shared code into a helper async function and call that directly instead.
- Try to use as few calls from actions to queries and mutations as possible. Queries and mutations are transactions, so splitting logic up into multiple calls introduces the risk of race conditions.
- All of these calls take in a `FunctionReference`. Do NOT try to pass the callee function directly into one of these calls.
- When using `ctx.runQuery`, `ctx.runMutation`, or `ctx.runAction` to call a function in the same file, specify a type annotation on the return value to work around TypeScript circularity limitations. For example,
                            ```
                            export const f = query({
                              args: { name: v.string() },
                              returns: v.string(),
                              handler: async (ctx, args) => {
                                return "Hello " + args.name;
                              },
                            });

                            export const g = query({
                              args: {},
                              returns: v.null(),
                              handler: async (ctx, args) => {
                                const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
                                return null;
                              },
                            });
                            ```

### Function references
- Function references are pointers to registered Convex functions.
- Use the `api` object defined by the framework in `convex/_generated/api.ts` to call public functions registered with `query`, `mutation`, or `action`.
- Use the `internal` object defined by the framework in `convex/_generated/api.ts` to call internal (or private) functions registered with `internalQuery`, `internalMutation`, or `internalAction`.
- Convex uses file-based routing, so a public function defined in `convex/example.ts` named `f` has a function reference of `api.example.f`.
- A private function defined in `convex/example.ts` named `g` has a function reference of `internal.example.g`.
- Functions can also registered within directories nested within the `convex/` folder. For example, a public function `h` defined in `convex/messages/access.ts` has a function reference of `api.messages.access.h`.

### Api design
- Convex uses file-based routing, so thoughtfully organize files with public query, mutation, or action functions within the `convex/` directory.
- Use `query`, `mutation`, and `action` to define public functions.
- Use `internalQuery`, `internalMutation`, and `internalAction` to define private, internal functions.

### Pagination
- Paginated queries are queries that return a list of results in incremental pages.
- You can define pagination using the following syntax:

                            ```ts
                            import { v } from "convex/values";
                            import { query, mutation } from "./_generated/server";
                            import { paginationOptsValidator } from "convex/server";
                            export const listWithExtraArg = query({
                                args: { paginationOpts: paginationOptsValidator, author: v.string() },
                                handler: async (ctx, args) => {
                                    return await ctx.db
                                    .query("messages")
                                    .filter((q) => q.eq(q.field("author"), args.author))
                                    .order("desc")
                                    .paginate(args.paginationOpts);
                                },
                            });
                            ```
- A query that ends in `.paginate()` returns an object that has the following properties:
                            - page (contains an array of documents that you fetches)
                            - isDone (a boolean that represents whether or not this is the last page of documents)
                            - continueCursor (a string that represents the cursor to use to fetch the next page of documents)


## Validator guidelines
- `v.bigint()` is deprecated for representing signed 64-bit integers. Use `v.int64()` instead.
- Use `v.record()` for defining a record type. `v.map()` and `v.set()` are not supported.

## Schema guidelines
- Always define your schema in `convex/schema.ts`.
- Always import the schema definition functions from `convex/server`:
- System fields are automatically added to all documents and are prefixed with an underscore.
- Always include all index fields in the index name. For example, if an index is defined as `["field1", "field2"]`, the index name should be "by_field1_and_field2".
- Index fields must be queried in the same order they are defined. If you want to be able to query by "field1" then "field2" and by "field2" then "field1", you must create separate indexes.

## Typescript guidelines
- You can use the helper typescript type `Id` imported from './_generated/dataModel' to get the type of the id for a given table. For example if there is a table called 'users' you can use `Id<'users'>` to get the type of the id for that table.
- If you need to define a `Record` make sure that you correctly provide the type of the key and value in the type. For example a validator `v.record(v.id('users'), v.string())` would have the type `Record<Id<'users'>, string>`. Below is an example of using `Record` with an `Id` type in a query:
                    ```ts
                    import { query } from "./_generated/server";
                    import { Doc, Id } from "./_generated/dataModel";

                    export const exampleQuery = query({
                        args: { userIds: v.array(v.id("users")) },
                        returns: v.record(v.id("users"), v.string()),
                        handler: async (ctx, args) => {
                            const idToUsername: Record<Id<"users">, string> = {};
                            for (const userId of args.userIds) {
                                const user = await ctx.db.get(userId);
                                if (user) {
                                    users[user._id] = user.username;
                                }
                            }

                            return idToUsername;
                        },
                    });
                    ```
- Be strict with types, particularly around id's of documents. For example, if a function takes in an id for a document in the 'users' table, take in `Id<'users'>` rather than `string`.
- Always use `as const` for string literals in discriminated union types.
- When using the `Array` type, make sure to always define your arrays as `const array: Array<T> = [...];`
- When using the `Record` type, make sure to always define your records as `const record: Record<KeyType, ValueType> = {...};`
- Always add `@types/node` to your `package.json` when using any Node.js built-in modules.

## Full text search guidelines
- A query for "10 messages in channel '#general' that best match the query 'hello hi' in their body" would look like:

const messages = await ctx.db
  .query("messages")
  .withSearchIndex("search_body", (q) =>
    q.search("body", "hello hi").eq("channel", "#general"),
  )
  .take(10);

## Query guidelines
- Do NOT use `filter` in queries. Instead, define an index in the schema and use `withIndex` instead.
- Convex queries do NOT support `.delete()`. Instead, `.collect()` the results, iterate over them, and call `ctx.db.delete(row._id)` on each result.
- Use `.unique()` to get a single document from a query. This method will throw an error if there are multiple documents that match the query.
- When using async iteration, don't use `.collect()` or `.take(n)` on the result of a query. Instead, use the `for await (const row of query)` syntax.
### Ordering
- By default Convex always returns documents in ascending `_creationTime` order.
- You can use `.order('asc')` or `.order('desc')` to pick whether a query is in ascending or descending order. If the order isn't specified, it defaults to ascending.
- Document queries that use indexes will be ordered based on the columns in the index and can avoid slow table scans.


## Mutation guidelines
- Use `ctx.db.replace` to fully replace an existing document. This method will throw an error if the document does not exist.
- Use `ctx.db.patch` to shallow merge updates into an existing document. This method will throw an error if the document does not exist.

## Action guidelines
- Always add `"use node";` to the top of files containing actions that use Node.js built-in modules.
- Never use `ctx.db` inside of an action. Actions don't have access to the database.
- Below is an example of the syntax for an action:
                    ```ts
                    import { action } from "./_generated/server";

                    export const exampleAction = action({
                        args: {},
                        returns: v.null(),
                        handler: async (ctx, args) => {
                            console.log("This action does not return anything");
                            return null;
                        },
                    });
                    ```

## Scheduling guidelines
### Cron guidelines
- Only use the `crons.interval` or `crons.cron` methods to schedule cron jobs. Do NOT use the `crons.hourly`, `crons.daily`, or `crons.weekly` helpers.
- Both cron methods take in a FunctionReference. Do NOT try to pass the function directly into one of these methods.
- Define crons by declaring the top-level `crons` object, calling some methods on it, and then exporting it as default. For example,
                            ```ts
                            import { cronJobs } from "convex/server";
                            import { internal } from "./_generated/api";
                            import { internalAction } from "./_generated/server";

                            const empty = internalAction({
                              args: {},
                              returns: v.null(),
                              handler: async (ctx, args) => {
                                console.log("empty");
                              },
                            });

                            const crons = cronJobs();

                            // Run `internal.crons.empty` every two hours.
                            crons.interval("delete inactive users", { hours: 2 }, internal.crons.empty, {});

                            export default crons;
                            ```
- You can register Convex functions within `crons.ts` just like any other file.
- If a cron calls an internal function, always import the `internal` object from '_generated/api`, even if the internal function is registered in the same file.


## File storage guidelines
- Convex includes file storage for large files like images, videos, and PDFs.
- The `ctx.storage.getUrl()` method returns a signed URL for a given file. It returns `null` if the file doesn't exist.
- Do NOT use the deprecated `ctx.storage.getMetadata` call for loading a file's metadata.

                    Instead, query the `_storage` system table. For example, you can use `ctx.db.system.get` to get an `Id<"_storage">`.
                    ```
                    import { query } from "./_generated/server";
                    import { Id } from "./_generated/dataModel";

                    type FileMetadata = {
                        _id: Id<"_storage">;
                        _creationTime: number;
                        contentType?: string;
                        sha256: string;
                        size: number;
                    }

                    export const exampleQuery = query({
                        args: { fileId: v.id("_storage") },
                        returns: v.null();
                        handler: async (ctx, args) => {
                            const metadata: FileMetadata | null = await ctx.db.system.get(args.fileId);
                            console.log(metadata);
                            return null;
                        },
                    });
                    ```
- Convex storage stores items as `Blob` objects. You must convert all items to/from a `Blob` when using Convex storage.


# Examples:
## Example: chat-app

### Task
```
Create a real-time chat application backend with AI responses. The app should:
- Allow creating users with names
- Support multiple chat channels
- Enable users to send messages to channels
- Automatically generate AI responses to user messages
- Show recent message history

The backend should provide APIs for:
1. User management (creation)
2. Channel management (creation)
3. Message operations (sending, listing)
4. AI response generation using OpenAI's GPT-4

Messages should be stored with their channel, author, and content. The system should maintain message order
and limit history display to the 10 most recent messages per channel.

```

### Analysis
1. Task Requirements Summary:
- Build a real-time chat backend with AI integration
- Support user creation
- Enable channel-based conversations
- Store and retrieve messages with proper ordering
- Generate AI responses automatically

2. Main Components Needed:
- Database tables: users, channels, messages
- Public APIs for user/channel management
- Message handling functions
- Internal AI response generation system
- Context loading for AI responses

3. Public API and Internal Functions Design:
Public Mutations:
- createUser:
  - file path: convex/index.ts
  - arguments: {name: v.string()}
  - returns: v.object({userId: v.id("users")})
  - purpose: Create a new user with a given name
- createChannel:
  - file path: convex/index.ts
  - arguments: {name: v.string()}
  - returns: v.object({channelId: v.id("channels")})
  - purpose: Create a new channel with a given name
- sendMessage:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels"), authorId: v.id("users"), content: v.string()}
  - returns: v.null()
  - purpose: Send a message to a channel and schedule a response from the AI

Public Queries:
- listMessages:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.array(v.object({
    _id: v.id("messages"),
    _creationTime: v.number(),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    }))
  - purpose: List the 10 most recent messages from a channel in descending creation order

Internal Functions:
- generateResponse:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.null()
  - purpose: Generate a response from the AI for a given channel
- loadContext:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.array(v.object({
    _id: v.id("messages"),
    _creationTime: v.number(),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
  }))
- writeAgentResponse:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels"), content: v.string()}
  - returns: v.null()
  - purpose: Write an AI response to a given channel

4. Schema Design:
- users
  - validator: { name: v.string() }
  - indexes: <none>
- channels
  - validator: { name: v.string() }
  - indexes: <none>
- messages
  - validator: { channelId: v.id("channels"), authorId: v.optional(v.id("users")), content: v.string() }
  - indexes
    - by_channel: ["channelId"]

5. Background Processing:
- AI response generation runs asynchronously after each user message
- Uses OpenAI's GPT-4 to generate contextual responses
- Maintains conversation context using recent message history


### Implementation

#### package.json
```typescript
{
  "name": "chat-app",
  "description": "This example shows how to build a chat app without authentication.",
  "version": "1.0.0",
  "dependencies": {
    "convex": "^1.17.4",
    "openai": "^4.79.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

#### tsconfig.json
```typescript
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "exclude": ["convex"],
  "include": ["**/src/**/*.tsx", "**/src/**/*.ts", "vite.config.ts"]
}
```

#### convex/index.ts
```typescript
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";

/**
 * Create a user with a given name.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { name: args.name });
  },
});

/**
 * Create a channel with a given name.
 */
export const createChannel = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("channels"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("channels", { name: args.name });
  },
});

/**
 * List the 10 most recent messages from a channel in descending creation order.
 */
export const listMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      channelId: v.id("channels"),
      authorId: v.optional(v.id("users")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);
    return messages;
  },
});

/**
 * Send a message to a channel and schedule a response from the AI.
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const user = await ctx.db.get(args.authorId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content,
    });
    await ctx.scheduler.runAfter(0, internal.index.generateResponse, {
      channelId: args.channelId,
    });
    return null;
  },
});

const openai = new OpenAI();

export const generateResponse = internalAction({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.index.loadContext, {
      channelId: args.channelId,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: context,
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    await ctx.runMutation(internal.index.writeAgentResponse, {
      channelId: args.channelId,
      content,
    });
    return null;
  },
});

export const loadContext = internalQuery({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);

    const result = [];
    for (const message of messages) {
      if (message.authorId) {
        const user = await ctx.db.get(message.authorId);
        if (!user) {
          throw new Error("User not found");
        }
        result.push({
          role: "user" as const,
          content: `${user.name}: ${message.content}`,
        });
      } else {
        result.push({ role: "assistant" as const, content: message.content });
      }
    }
    return result;
  },
});

export const writeAgentResponse = internalMutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      content: args.content,
    });
    return null;
  },
});
```

#### convex/schema.ts
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    name: v.string(),
  }),

  users: defineTable({
    name: v.string(),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
  }).index("by_channel", ["channelId"]),
});
```

#### src/App.tsx
```typescript
export default function App() {
  return <div>Hello World</div>;
}
```
</file>

<file path=".github/workflows/node.js.yml">
name: Run tests
on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          cache-dependency-path: |
            example/package.json
            package.json
          node-version: "18.x"
          cache: "npm"
      - run: npm i
      - run: npm ci
      - run: npm run build
      - run: cd example && npm i && cd ..
      - run: npx pkg-pr-new publish
</file>

<file path="example/convex/_generated/api.d.ts">
/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as example from "../example.js";
import type * as http from "../http.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  example: typeof example;
  http: typeof http;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
</file>

<file path="example/convex/_generated/api.js">
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
</file>

<file path="example/convex/_generated/dataModel.d.ts">
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
</file>

<file path="example/convex/_generated/server.d.ts">
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
</file>

<file path="example/convex/_generated/server.js">
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
</file>

<file path="example/convex/convex.config.ts">
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);

export default app;
</file>

<file path="example/convex/crons.ts">
import { cronJobs } from "convex/server";
import { components, internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";

const crons = cronJobs();

crons.interval(
  "Remove old emails from the resend component",
  { hours: 1 },
  internal.crons.cleanupResend
);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: ONE_WEEK_MS }
    );
  },
});

export default crons;
</file>

<file path="example/convex/example.ts">
import {
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { components, internal } from "./_generated/api";
import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.example.handleEmailEvent,
});

export const testBatch = internalAction({
  args: {
    from: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const addresses = [
      "delivered@resend.dev",
      "bounced@resend.dev",
      "complained@resend.dev",
    ];

    for (let i = 0; i < 25; i++) {
      const address = addresses[i % addresses.length];
      const expectation = address.split("@")[0];
      const email = await resend.sendEmail(ctx, {
        from: args.from,
        to: address,
        subject: "Test Email",
        html: "This is a test email",
      });
      await ctx.runMutation(internal.example.insertExpectation, {
        email: email,
        expectation: expectation as "delivered" | "bounced" | "complained",
      });
    }
    while (!(await ctx.runQuery(internal.example.isEmpty))) {
      console.log("Waiting for emails to be processed...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("All emails finalized as expected");
  },
});

export const sendOne = internalAction({
  args: { to: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = await resend.sendEmail(ctx, {
      from: "<your-verified-sender-address>",
      to: args.to ?? "delivered@resend.dev",
      subject: "Test Email",
      html: "This is a test email",
    });
    console.log("Email sent", email);
    let status = await resend.status(ctx, email);
    while (
      status &&
      (status.status === "queued" || status.status === "waiting")
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await resend.status(ctx, email);
    }
    console.log("Email status", status);
    return email;
  },
});

export const insertExpectation = internalMutation({
  args: {
    email: v.string(),
    expectation: v.union(
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("complained")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("testEmails", {
      email: args.email,
      expectation: args.expectation,
    });
  },
});

export const isEmpty = internalQuery({
  returns: v.boolean(),
  handler: async (ctx) => {
    return (await ctx.db.query("testEmails").first()) === null;
  },
});

export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, args) => {
    console.log("Got called back!", args.id, args.event);
    const testEmail = await ctx.db
      .query("testEmails")
      .withIndex("by_email", (q) => q.eq("email", args.id))
      .unique();
    if (!testEmail) {
      console.log("No test email found for id", args.id);
      return;
    }
    if (args.event.type === "email.delivered") {
      if (testEmail.expectation === "bounced") {
        throw new Error("Email was delivered but expected to be bounced");
      }
      if (testEmail.expectation === "complained") {
        console.log(
          "Complained email was delivered, expecting complaint coming..."
        );
        return;
      }
      // All good. Delivered email was delivered.
      await ctx.db.delete(testEmail._id);
    }
    if (args.event.type === "email.bounced") {
      if (testEmail.expectation !== "bounced") {
        throw new Error(
          `Email was bounced but expected to be ${testEmail.expectation}`
        );
      }
      // All good. Bounced email was bounced.
      await ctx.db.delete(testEmail._id);
    }
    if (args.event.type === "email.complained") {
      if (testEmail.expectation !== "complained") {
        throw new Error(
          `Email was complained but expected to be ${testEmail.expectation}`
        );
      }
      // All good. Complained email was complained.
      await ctx.db.delete(testEmail._id);
    }
  },
});

export const sendManualEmail = internalAction({
  args: {
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    subject: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const from = args.from ?? "onboarding@resend.dev";
    const to = args.to ?? "delivered@resend.dev";
    const subject = args.subject ?? "Test Email";
    const text = args.text ?? "This is a test email with a tag";
    const emailId = await resend.sendEmailManually(
      ctx,
      { from, to, subject },
      async (emailId) => {
        const data = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to,
            subject,
            text,
            headers: [
              {
                name: "Idempotency-Key",
                value: emailId,
              },
            ],
            tags: [
              {
                name: "category",
                value: "confirm_email",
              },
            ],
          }),
        });
        const json = await data.json();
        return json.id;
      }
    );
    return emailId;
  },
});
</file>

<file path="example/convex/http.ts">
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resend } from "./example";

const http = httpRouter();

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
</file>

<file path="example/convex/README.md">
# Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// functions.js
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.functions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// functions.js
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.functions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.
</file>

<file path="example/convex/schema.ts">
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  testEmails: defineTable({
    email: v.string(),
    expectation: v.union(
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("complained")
    ),
  }).index("by_email", ["email"]),
});
</file>

<file path="example/convex/tsconfig.json">
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
    "isolatedModules": true,
    "noEmit": true,

    /* This should only be used in this example. Real apps should not attempt
     * to compile TypeScript because differences between tsconfig.json files can
     * cause the code to be compiled differently.
     */
    "customConditions": ["@convex-dev/component-source"]
  },
  "include": ["./**/*"],
  "exclude": ["./_generated"]
}
</file>

<file path="example/.gitignore">
!**/glob-import/dir/node_modules
.DS_Store
.idea
*.cpuprofile
*.local
*.log
/.vscode/
/docs/.vitepress/cache
dist
dist-ssr
explorations
node_modules
playground-temp
temp
TODOs.md
.eslintcache
</file>

<file path="example/eslint.config.js">
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    ignores: ["convex"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow explicit `any`s
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  }
);
</file>

<file path="example/index.html">
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sharded Counter Component Example</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
</file>

<file path="example/package.json">
{
  "name": "uses-component",
  "private": true,
  "type": "module",
  "version": "0.0.0",
  "scripts": {
    "dev": "convex dev --typecheck-components",
    "logs": "convex logs",
    "lint": "tsc -p convex && eslint convex"
  },
  "dependencies": {
    "@convex-dev/resend": "file:..",
    "convex": "^1.24.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.1.0",
    "@eslint/js": "^9.9.0",
    "eslint": "^9.9.0",
    "globals": "^15.9.0",
    "typescript": "^5.5.0",
    "typescript-eslint": "^8.0.1"
  }
}
</file>

<file path="example/README.md">
# Example Resend component deployment

It's a simple one. The meat is in the `convex/` directory. If you want to fire it up, here's how:

1. Run `npm run dev` 
2. Grab a Resend api key and webhook secret and set them in your deployment environment.
3. Go mess around in your Convex dashboard with `testBatch`. There is no UI!
</file>

<file path="example/tsconfig.json">
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "skipLibCheck": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx",

  },
  "include": ["./src", "vite.config.ts", "./convex"]
}
</file>

<file path="src/client/_generated/_ignore.ts">
// This is only here so convex-test can detect a _generated folder
</file>

<file path="src/client/index.test.ts">
import { describe, test } from "vitest";
import { componentSchema, componentModules, modules } from "./setup.test.js";
import { defineSchema } from "convex/server";
import { convexTest } from "convex-test";

const schema = defineSchema({});

function setupTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("resend", componentSchema, componentModules);
  return { t };
}

type ConvexTest = ReturnType<typeof setupTest>["t"];

describe("Resend", () => {
  test("handleResendEventWebhook", async () => {});
});
</file>

<file path="src/client/index.ts">
import {
  createFunctionHandle,
  internalMutationGeneric,
  type Expand,
  type FunctionReference,
  type FunctionVisibility,
  type GenericDataModel,
  type GenericMutationCtx,
} from "convex/server";
import { v, type GenericId, type VString } from "convex/values";
import { Webhook } from "svix";
import type { api } from "../component/_generated/api.js";
import {
  vEmailEvent,
  type EmailEvent,
  type RunMutationCtx,
  type RunQueryCtx,
  type RuntimeConfig,
  type Status,
} from "../component/shared.js";

export type ResendComponent = UseApi<typeof api>;

export type EmailId = string & { __isEmailId: true };
export const vEmailId = v.string() as VString<EmailId>;
export { vEmailEvent, vOptions, vStatus } from "../component/shared.js";
export type { EmailEvent, Status } from "../component/shared.js";
export const vOnEmailEventArgs = v.object({
  id: vEmailId,
  event: vEmailEvent,
});

type Config = RuntimeConfig & {
  webhookSecret: string;
};

function getDefaultConfig(): Config {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? "",
    initialBackoffMs: 30000,
    retryAttempts: 5,
    testMode: true,
  };
}

export type ResendOptions = {
  /**
   * The API key to use for the Resend API.
   * If not provided, the API key will be read from the environment variable RESEND_API_KEY.
   */
  apiKey?: string;

  /**
   * The secret to use for the Resend webhook.
   * If not provided, the webhook secret will be read from the environment variable RESEND_WEBHOOK_SECRET.
   */
  webhookSecret?: string;

  /**
   * The initial backoff to use for the Resend API.
   * If not provided, the initial backoff will be 30 seconds.
   */
  initialBackoffMs?: number;

  /**
   * The number of retry attempts to use for the Resend API.
   * If not provided, the number of retry attempts will be 5.
   */
  retryAttempts?: number;

  /**
   * Whether to run in test mode. In test mode, only emails to
   * resend-approved test email addresses will be sent.
   * If not provided, the test mode will be true. You need to opt
   * into production mode by setting testMode to false.
   */
  testMode?: boolean;

  /**
   * A mutation to run after an email event occurs.
   * The mutation will be passed the email id and the event.
   */
  onEmailEvent?: FunctionReference<
    "mutation",
    FunctionVisibility,
    {
      id: EmailId;
      event: EmailEvent;
    }
  > | null;
};

async function configToRuntimeConfig(
  config: Config,
  onEmailEvent?: FunctionReference<
    "mutation",
    FunctionVisibility,
    {
      id: EmailId;
      event: EmailEvent;
    }
  > | null
): Promise<RuntimeConfig> {
  return {
    apiKey: config.apiKey,
    initialBackoffMs: config.initialBackoffMs,
    retryAttempts: config.retryAttempts,
    testMode: config.testMode,
    onEmailEvent: onEmailEvent
      ? { fnHandle: await createFunctionHandle(onEmailEvent) }
      : undefined,
  };
}

export type EmailStatus = {
  /**
   * The status of the email. It will be one of the following:
   * - `waiting`: The email has not yet been batched.
   * - `queued`: The email has been batched and is waiting to be sent.
   * - `cancelled`: The email has been cancelled.
   * - `sent`: The email has been sent to Resend, but we do not yet know its fate.
   * - `bounced`: The email bounced.
   * - `delivered`: The email was delivered successfully.
   * - `delivery_delayed`: Resend is having trouble delivering the email, but is still trying.
   */
  status: Status;

  /**
   * The error message of the email. Typically only set on bounces.
   */
  errorMessage: string | null;

  /**
   * Whether the email was marked as spam. This is only set on emails which are delivered.
   */
  complained: boolean;

  /**
   * If you're using open tracking, did Resend detect that the email was opened?
   */
  opened: boolean;
};

export type SendEmailOptions = {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string[];
  headers?: { name: string; value: string }[];
};

export class Resend {
  public config: Config;
  onEmailEvent?: FunctionReference<
    "mutation",
    FunctionVisibility,
    {
      id: EmailId;
      event: EmailEvent;
    }
  > | null;

  /**
   * Creates a Resend component.
   *
   * @param component The component to use, like `components.resend` from
   * `./_generated/api.ts`.
   * @param options The {@link ResendOptions} to use for this component.
   */
  constructor(
    public component: UseApi<typeof api>,
    options?: ResendOptions
  ) {
    const defaultConfig = getDefaultConfig();
    this.config = {
      apiKey: options?.apiKey ?? defaultConfig.apiKey,
      webhookSecret: options?.webhookSecret ?? defaultConfig.webhookSecret,
      initialBackoffMs:
        options?.initialBackoffMs ?? defaultConfig.initialBackoffMs,
      retryAttempts: options?.retryAttempts ?? defaultConfig.retryAttempts,
      testMode: options?.testMode ?? defaultConfig.testMode,
    };
    if (options?.onEmailEvent) {
      this.onEmailEvent = options.onEmailEvent;
    }
  }

  /**
   * Sends an email
   *
   * Specifically, enqueues your email to be sent as part of efficient, durable email batches
   * managed by the component. The email will be sent as soon as possible, but the component
   * will manage rate limiting and batching for efficiency.
   *
   * This component utilizes idempotency keys to ensure the email is sent exactly once.
   *
   * @param ctx Any context that can run a mutation. You can enqueue an email from
   * either a mutation or an action.
   * @param options The {@link SendEmailOptions} object containing all email parameters.
   * @returns The id of the email within the component.
   */
  async sendEmail(
    ctx: RunMutationCtx,
    options: SendEmailOptions
  ): Promise<EmailId>;
  /**
   * Sends an email by providing individual arguments for `from`, `to`, `subject`, and optionally `html`, `text`, `replyTo`, and `headers`.
   *
   * Specifically, enqueues your email to be sent as part of efficient, durable email batches
   * managed by the component. The email will be sent as soon as possible, but the component
   * will manage rate limiting and batching for efficiency.
   *
   * This component utilizes idempotency keys to ensure the email is sent exactly once.
   *
   * @param ctx Any context that can run a mutation. You can enqueue an email from
   * either a mutation or an action.
   * @param from The email address to send from.
   * @param to The email address to send to.
   * @param subject The subject of the email.
   * @param html The HTML body of the email.
   * @param text The text body of the email.
   * @param replyTo Optionally, any extra reply to addresses to include in the email.
   * @param headers Extra email headers your want included.
   * @returns The id of the email within the component.
   */
  async sendEmail(
    ctx: RunMutationCtx,
    from: string,
    to: string,
    subject: string,
    html?: string,
    text?: string,
    replyTo?: string[],
    headers?: { name: string; value: string }[]
  ): Promise<EmailId>;
  /** @deprecated Use the object format e.g. `{ from, to, subject, html }` */
  async sendEmail(
    ctx: RunMutationCtx,
    fromOrOptions: string | SendEmailOptions,
    to?: string,
    subject?: string,
    html?: string,
    text?: string,
    replyTo?: string[],
    headers?: { name: string; value: string }[]
  ) {
    const sendEmailArgs =
      typeof fromOrOptions === "string"
        ? {
            from: fromOrOptions,
            to: to!,
            subject: subject!,
            html,
            text,
            replyTo,
            headers,
          }
        : fromOrOptions;

    if (this.config.apiKey === "") throw new Error("API key is not set");

    const id = await ctx.runMutation(this.component.lib.sendEmail, {
      options: await configToRuntimeConfig(this.config, this.onEmailEvent),
      ...sendEmailArgs,
    });

    return id as EmailId;
  }

  async sendEmailManually(
    ctx: RunMutationCtx,
    options: Omit<SendEmailOptions, "html" | "text">,
    sendCallback: (emailId: EmailId) => Promise<string>
  ): Promise<EmailId> {
    const emailId = (await ctx.runMutation(
      this.component.lib.createManualEmail,
      {
        from: options.from,
        to: options.to,
        subject: options.subject,
        replyTo: options.replyTo,
        headers: options.headers,
      }
    )) as EmailId;
    try {
      const resendId = await sendCallback(emailId);
      await ctx.runMutation(this.component.lib.updateManualEmail, {
        emailId,
        status: "sent",
        resendId,
      });
    } catch (error) {
      await ctx.runMutation(this.component.lib.updateManualEmail, {
        emailId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        resendId:
          typeof error === "object" && error !== null && "resendId" in error
            ? typeof error.resendId === "string"
              ? error.resendId
              : undefined
            : undefined,
      });
      throw error;
    }

    return emailId as EmailId;
  }

  /**
   * Cancels an email.
   *
   * This will mark the email as cancelled if it has no already been send to Resend.
   *
   * @param ctx Any context that can run a mutation. You can cancel an email from
   * either a mutation or an action.
   * @param emailId The id of the email to cancel. This was returned from {@link sendEmail}.
   */
  async cancelEmail(ctx: RunMutationCtx, emailId: EmailId) {
    await ctx.runMutation(this.component.lib.cancelEmail, {
      emailId,
    });
  }

  /**
   * Gets the status of an email.
   *
   * @param ctx Any context that can run a query. You can get the status of an email from
   * an action, mutation, or query.
   * @param emailId The id of the email to get the status of. This was returned from {@link sendEmail}.
   * @returns {@link EmailStatus} The status of the email.
   */
  async status(
    ctx: RunQueryCtx,
    emailId: EmailId
  ): Promise<EmailStatus | null> {
    return await ctx.runQuery(this.component.lib.getStatus, {
      emailId,
    });
  }

  /**
   * Gets a full email.
   *
   * @param ctx Any context that can run a query. You can get an email from
   * an action, mutation, or query.
   * @param emailId The id of the email to get. This was returned from {@link sendEmail}.
   * @returns The email, or null if the email does not exist.
   */
  async get(
    ctx: RunQueryCtx,
    emailId: EmailId
  ): Promise<{
    from: string;
    to: string;
    subject: string;
    replyTo: string[];
    headers?: { name: string; value: string }[];
    status: Status;
    errorMessage?: string;
    complained: boolean;
    opened: boolean;
    resendId?: string;
    finalizedAt: number;
    createdAt: number;
    html?: string;
    text?: string;
  } | null> {
    return await ctx.runQuery(this.component.lib.get, {
      emailId,
    });
  }

  /**
   * Handles a Resend event webhook.
   *
   * This will update emails in the component with the status of the email as detected by Resend,
   * and call your `onEmailEvent` mutation if it is set.
   *
   * @param ctx Any context that can run a mutation.
   * @param req The request to handle from Resend.
   * @returns A response to send back to Resend.
   */
  async handleResendEventWebhook(
    ctx: RunMutationCtx,
    req: Request
  ): Promise<Response> {
    if (this.config.webhookSecret === "") {
      throw new Error("Webhook secret is not set");
    }
    const webhook = new Webhook(this.config.webhookSecret);
    const raw = await req.text();
    const svix_id = req.headers.get("svix-id") ?? "";
    const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
    const svix_signature = req.headers.get("svix-signature") ?? "";
    const payload = webhook.verify(raw, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
    const event: EmailEvent = payload as EmailEvent;

    await ctx.runMutation(this.component.lib.handleEmailEvent, {
      event,
    });

    return new Response(null, {
      status: 201,
    });
  }

  /**
   * Defines a mutation to run after an email event occurs.
   *
   * It is probably simpler to just define your mutation as a `internalMutation`
   * and pass the `vOnEmailEventArgs` as the args than use this.
   * See the example in the README for more.
   *
   * @param handler The handler to run after an email event occurs.
   * @returns The mutation to run after an email event occurs.
   */
  defineOnEmailEvent<DataModel extends GenericDataModel>(
    handler: (
      ctx: GenericMutationCtx<DataModel>,
      args: { id: EmailId; event: EmailEvent }
    ) => Promise<void>
  ) {
    return internalMutationGeneric({
      args: {
        id: vEmailId,
        event: vEmailEvent,
      },
      handler,
    });
  }
}

export type OpaqueIds<T> =
  T extends GenericId<infer _T>
    ? string
    : T extends (infer U)[]
      ? OpaqueIds<U>[]
      : T extends ArrayBuffer
        ? ArrayBuffer
        : T extends object
          ? { [K in keyof T]: OpaqueIds<T[K]> }
          : T;

export type UseApi<API> = Expand<{
  [mod in keyof API]: API[mod] extends FunctionReference<
    infer FType,
    "public",
    infer FArgs,
    infer FReturnType,
    infer FComponentPath
  >
    ? FunctionReference<
        FType,
        "internal",
        OpaqueIds<FArgs>,
        OpaqueIds<FReturnType>,
        FComponentPath
      >
    : UseApi<API[mod]>;
}>;
</file>

<file path="src/client/setup.test.ts">
/// <reference types="vite/client" />

import { test } from "vitest";

export const modules = import.meta.glob("./**/*.*s");
export { componentSchema };
export const componentModules = import.meta.glob("../component/**/*.ts");

import { type ResendComponent } from "./index.js";
import { componentsGeneric } from "convex/server";
import componentSchema from "../component/schema.js";

export const components = componentsGeneric() as unknown as {
  resend: ResendComponent;
};

test("setup", () => {});
</file>

<file path="src/component/_generated/api.d.ts">
/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as lib from "../lib.js";
import type * as shared from "../shared.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  lib: typeof lib;
  shared: typeof shared;
}>;
export type Mounts = {
  lib: {
    cancelEmail: FunctionReference<
      "mutation",
      "public",
      { emailId: string },
      null
    >;
    get: FunctionReference<
      "query",
      "public",
      { emailId: string },
      {
        complained: boolean;
        errorMessage?: string;
        finalizedAt: number;
        from: string;
        headers?: Array<{ name: string; value: string }>;
        html?: string;
        opened: boolean;
        replyTo: Array<string>;
        resendId?: string;
        segment: number;
        status:
          | "waiting"
          | "queued"
          | "cancelled"
          | "sent"
          | "delivered"
          | "delivery_delayed"
          | "bounced";
        subject: string;
        text?: string;
        to: string;
      }
    >;
    getStatus: FunctionReference<
      "query",
      "public",
      { emailId: string },
      {
        complained: boolean;
        errorMessage: string | null;
        opened: boolean;
        status:
          | "waiting"
          | "queued"
          | "cancelled"
          | "sent"
          | "delivered"
          | "delivery_delayed"
          | "bounced";
      }
    >;
    handleEmailEvent: FunctionReference<
      "mutation",
      "public",
      { event: any },
      null
    >;
    sendEmail: FunctionReference<
      "mutation",
      "public",
      {
        from: string;
        headers?: Array<{ name: string; value: string }>;
        html?: string;
        options: {
          apiKey: string;
          initialBackoffMs: number;
          onEmailEvent?: { fnHandle: string };
          retryAttempts: number;
          testMode: boolean;
        };
        replyTo?: Array<string>;
        subject: string;
        text?: string;
        to: string;
      },
      string
    >;
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  emailWorkpool: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
        },
        any
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        {
          before?: number;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
        },
        any
      >;
      enqueue: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism: number;
          };
          fnArgs: any;
          fnHandle: string;
          fnName: string;
          fnType: "action" | "mutation" | "query";
          onComplete?: { context?: any; fnHandle: string };
          retryBehavior?: {
            base: number;
            initialBackoffMs: number;
            maxAttempts: number;
          };
          runAt: number;
        },
        string
      >;
      status: FunctionReference<
        "query",
        "internal",
        { id: string },
        | { previousAttempts: number; state: "pending" }
        | { previousAttempts: number; state: "running" }
        | { state: "finished" }
      >;
    };
  };
  callbackWorkpool: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
        },
        any
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        {
          before?: number;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
        },
        any
      >;
      enqueue: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism: number;
          };
          fnArgs: any;
          fnHandle: string;
          fnName: string;
          fnType: "action" | "mutation" | "query";
          onComplete?: { context?: any; fnHandle: string };
          retryBehavior?: {
            base: number;
            initialBackoffMs: number;
            maxAttempts: number;
          };
          runAt: number;
        },
        string
      >;
      status: FunctionReference<
        "query",
        "internal",
        { id: string },
        | { previousAttempts: number; state: "pending" }
        | { previousAttempts: number; state: "running" }
        | { state: "finished" }
      >;
    };
  };
};
</file>

<file path="src/component/_generated/api.js">
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
</file>

<file path="src/component/_generated/dataModel.d.ts">
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
</file>

<file path="src/component/_generated/server.d.ts">
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
</file>

<file path="src/component/_generated/server.js">
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
</file>

<file path="src/component/convex.config.ts">
import { defineComponent } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import workpool from "@convex-dev/workpool/convex.config";

const component = defineComponent("resend");
component.use(rateLimiter);
component.use(workpool, { name: "emailWorkpool" });
component.use(workpool, { name: "callbackWorkpool" });

export default component;
</file>

<file path="src/component/lib.test.ts">
import { expect, describe, it, beforeEach } from "vitest";
import { api } from "./_generated/api.js";
import type { EmailEvent } from "./shared.js";
import {
  createTestEventOfType,
  insertTestSentEmail,
  setupTest,
  setupTestLastOptions,
  type Tester,
} from "./setup.test.js";
import { type Doc } from "./_generated/dataModel.js";

describe("handleEmailEvent", () => {
  let t: Tester;
  let event: EmailEvent;
  let email: Doc<"emails">;

  beforeEach(async () => {
    t = setupTest();
    event = createTestEventOfType("email.delivered");
    await setupTestLastOptions(t);
    email = await insertTestSentEmail(t);
  });

  const exec = (_event: EmailEvent | unknown = event) =>
    t.mutation(api.lib.handleEmailEvent, { event: _event });

  const getEmail = () =>
    t.run(async (ctx) => {
      const _email = await ctx.db.get(email._id);
      if (!_email) throw new Error("Email not found");
      return _email;
    });

  it("updates email for delivered event", async () => {
    expect(email.status).toBe("sent");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("delivered");
    expect(updatedEmail.finalizedAt).toBeLessThan(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.finalizedAt).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
  });

  it("updates email for complained event", async () => {
    expect(email.status).toBe("sent");
    event = createTestEventOfType("email.complained");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.complained).toBe(true);
  });

  it("updates email for bounced event", async () => {
    expect(email.status).toBe("sent");
    event = createTestEventOfType("email.bounced");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("bounced");
    expect(updatedEmail.finalizedAt).toBeLessThan(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.finalizedAt).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
    expect(updatedEmail.errorMessage).toBe(
      "The email bounced due to invalid recipient"
    );
  });

  it("updates email for delivery_delayed event", async () => {
    expect(email.status).toBe("sent");
    event = createTestEventOfType("email.delivery_delayed");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("delivery_delayed");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER); // Should remain unchanged
  });

  it("updates email for opened event", async () => {
    expect(email.status).toBe("sent");
    expect(email.opened).toBe(false);
    event = createTestEventOfType("email.opened");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.opened).toBe(true);
  });

  it("does not update email for sent event", async () => {
    expect(email.status).toBe("sent");
    event = createTestEventOfType("email.sent");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER); // Should remain unchanged
    expect(updatedEmail.complained).toBe(false); // Should remain unchanged
    expect(updatedEmail.opened).toBe(false); // Should remain unchanged
  });

  it("does not update email for clicked event", async () => {
    expect(email.status).toBe("sent");
    event = createTestEventOfType("email.clicked");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER); // Should remain unchanged
    expect(updatedEmail.complained).toBe(false); // Should remain unchanged
    expect(updatedEmail.opened).toBe(false); // Should remain unchanged
  });

  it("does not update email for failed event", async () => {
    expect(email.status).toBe("sent");
    event = createTestEventOfType("email.failed");

    await exec();

    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER); // Should remain unchanged
    expect(updatedEmail.complained).toBe(false); // Should remain unchanged
    expect(updatedEmail.opened).toBe(false); // Should remain unchanged
  });

  it("gracefully handles invalid event structure - missing type", async () => {
    const invalidEvent = {
      created_at: "2024-01-01T00:00:00Z",
      data: {
        email_id: "test-resend-id-123",
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Test Email",
      },
    };

    // Should not throw an error
    await exec(invalidEvent);

    // Email should remain unchanged
    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.complained).toBe(false);
    expect(updatedEmail.opened).toBe(false);
  });

  it("gracefully handles invalid event structure - missing data", async () => {
    const invalidEvent = {
      type: "email.delivered",
      created_at: "2024-01-01T00:00:00Z",
    };

    // Should not throw an error
    await exec(invalidEvent);

    // Email should remain unchanged
    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.complained).toBe(false);
    expect(updatedEmail.opened).toBe(false);
  });

  it("gracefully handles completely invalid event", async () => {
    const invalidEvent = "not an object";

    // Should not throw an error
    await exec(invalidEvent);

    // Email should remain unchanged
    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.complained).toBe(false);
    expect(updatedEmail.opened).toBe(false);
  });

  it("gracefully handles null event", async () => {
    // Should not throw an error
    await exec(null);

    // Email should remain unchanged
    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.complained).toBe(false);
    expect(updatedEmail.opened).toBe(false);
  });

  it("gracefully handles empty object event", async () => {
    const invalidEvent = {};

    // Should not throw an error
    await exec(invalidEvent);

    // Email should remain unchanged
    const updatedEmail = await getEmail();
    expect(updatedEmail.status).toBe("sent");
    expect(updatedEmail.finalizedAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(updatedEmail.complained).toBe(false);
    expect(updatedEmail.opened).toBe(false);
  });
});
</file>

<file path="src/component/lib.ts">
import { v } from "convex/values";
import {
  internalAction,
  mutation,
  type MutationCtx,
  query,
  internalQuery,
  type ActionCtx,
} from "./_generated/server.js";
import { Workpool } from "@convex-dev/workpool";
import { RateLimiter } from "@convex-dev/rate-limiter";
import { api, components, internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";
import { type Id, type Doc } from "./_generated/dataModel.js";
import {
  type RuntimeConfig,
  vEmailEvent,
  vOptions,
  vStatus,
} from "./shared.js";
import type { FunctionHandle } from "convex/server";
import type { EmailEvent, RunMutationCtx } from "./shared.js";
import { isDeepEqual } from "remeda";
import schema from "./schema.js";
import { omit } from "convex-helpers";
import { parse } from "convex-helpers/validators";
import { assertExhaustive, attemptToParse, iife } from "./utils.js";

// Move some of these to options? TODO
const SEGMENT_MS = 125;
const BASE_BATCH_DELAY = 1000;
const BATCH_SIZE = 100;
const EMAIL_POOL_SIZE = 4;
const CALLBACK_POOL_SIZE = 4;
const RESEND_ONE_CALL_EVERY_MS = 600; // Half the stated limit, but it keeps us sane.
const FINALIZED_EMAIL_RETENTION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const FINALIZED_EPOCH = Number.MAX_SAFE_INTEGER;
const ABANDONED_EMAIL_RETENTION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const RESEND_TEST_EMAILS = new Set([
  "delivered@resend.dev",
  "bounced@resend.dev",
  "complained@resend.dev",
]);

const PERMANENT_ERROR_CODES = new Set([
  400, 401 /* 402 not included - unclear spec */, 403, 404, 405, 406, 407, 408,
  /* 409 not included - conflict may work on retry */
  410, 411 /* 412 not included - precondition may have changed? */, 413, 414,
  415, 416 /* 417, not included - expectation may be met later? */, 418, 421,
  422 /*423, 424, 425, may change over time */, 426, 427,
  428 /* 429, explicitly asked to retry */, 431 /* 451, laws change? */,
]);

// We break the emails into segments to avoid contention on new emails being inserted.
function getSegment(now: number) {
  return Math.floor(now / SEGMENT_MS);
}

// Four threads is more than enough, especially given the low rate limiting.
const emailPool = new Workpool(components.emailWorkpool, {
  maxParallelism: EMAIL_POOL_SIZE,
});

// We need to run callbacks in a separate pool so we don't tie up too many threads.
const callbackPool = new Workpool(components.callbackWorkpool, {
  maxParallelism: CALLBACK_POOL_SIZE,
});

// We rate limit our calls to the Resend API.
// FUTURE -- make this rate configurable if an account ups its sending rate with Resend.
const resendApiRateLimiter = new RateLimiter(components.rateLimiter, {
  resendApi: {
    kind: "fixed window",
    period: RESEND_ONE_CALL_EVERY_MS,
    rate: 1,
  },
});

// Enqueue an email to be send.  A background job will grab batches
// of emails and enqueue them to be sent by the workpool.
export const sendEmail = mutation({
  args: {
    options: vOptions,
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
    replyTo: v.optional(v.array(v.string())),
    headers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          value: v.string(),
        })
      )
    ),
  },
  returns: v.id("emails"),
  handler: async (ctx, args) => {
    // We only allow test emails in test mode.
    if (args.options.testMode && !RESEND_TEST_EMAILS.has(args.to)) {
      throw new Error(
        `Test mode is enabled, but email address is not a valid resend test address. Did you want to set testMode: false in your ResendOptions?`
      );
    }

    // We require either html or text to be provided. No body = no bueno.
    if (args.html === undefined && args.text === undefined) {
      throw new Error("Either html or text must be provided");
    }

    // Store the text/html into separate records to keep things fast and memory low when we work with email batches.
    let htmlContentId: Id<"content"> | undefined;
    if (args.html !== undefined) {
      const contentId = await ctx.db.insert("content", {
        content: new TextEncoder().encode(args.html).buffer,
        mimeType: "text/html",
      });
      htmlContentId = contentId;
    }

    let textContentId: Id<"content"> | undefined;
    if (args.text !== undefined) {
      const contentId = await ctx.db.insert("content", {
        content: new TextEncoder().encode(args.text).buffer,
        mimeType: "text/plain",
      });
      textContentId = contentId;
    }

    // This is the "send requested" segment.
    const segment = getSegment(Date.now());

    // Okay, we're ready to insert the email into the database, waiting for a background job to enqueue it.
    const emailId = await ctx.db.insert("emails", {
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: htmlContentId,
      text: textContentId,
      headers: args.headers,
      segment,
      status: "waiting",
      complained: false,
      opened: false,
      replyTo: args.replyTo ?? [],
      finalizedAt: FINALIZED_EPOCH,
    });

    // Ensure there is a worker running to grab batches of emails.
    await scheduleBatchRun(ctx, args.options);
    return emailId;
  },
});

export const createManualEmail = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    replyTo: v.optional(v.array(v.string())),
    headers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          value: v.string(),
        })
      )
    ),
  },
  returns: v.id("emails"),
  handler: async (ctx, args) => {
    const emailId = await ctx.db.insert("emails", {
      from: args.from,
      to: args.to,
      subject: args.subject,
      headers: args.headers,
      segment: Infinity,
      status: "queued",
      complained: false,
      opened: false,
      replyTo: args.replyTo ?? [],
      finalizedAt: FINALIZED_EPOCH,
    });
    return emailId;
  },
});

export const updateManualEmail = mutation({
  args: {
    emailId: v.id("emails"),
    status: vStatus,
    resendId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const finalizedAt =
      args.status === "failed" || args.status === "cancelled"
        ? Date.now()
        : undefined;
    await ctx.db.patch(args.emailId, {
      status: args.status,
      resendId: args.resendId,
      errorMessage: args.errorMessage,
      ...(finalizedAt ? { finalizedAt } : {}),
    });
  },
});

// Cancel an email that has not been sent yet. The worker will ignore it
// within whatever batch it is in.
export const cancelEmail = mutation({
  args: {
    emailId: v.id("emails"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      throw new Error("Email not found");
    }
    if (email.status !== "waiting" && email.status !== "queued") {
      throw new Error("Email has already been sent");
    }
    await ctx.db.patch(args.emailId, {
      status: "cancelled",
      finalizedAt: Date.now(),
    });
  },
});

// Get the status of an email.
export const getStatus = query({
  args: {
    emailId: v.id("emails"),
  },
  returns: v.union(
    v.object({
      status: vStatus,
      errorMessage: v.union(v.string(), v.null()),
      complained: v.boolean(),
      opened: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      return null;
    }
    return {
      status: email.status,
      errorMessage: email.errorMessage ?? null,
      complained: email.complained,
      opened: email.opened,
    };
  },
});

// Get the entire email.
export const get = query({
  args: {
    emailId: v.id("emails"),
  },
  returns: v.union(
    v.object({
      ...omit(schema.tables.emails.validator.fields, ["html", "text"]),
      createdAt: v.number(),
      html: v.optional(v.string()),
      text: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      return null;
    }
    const html = email.html
      ? new TextDecoder().decode((await ctx.db.get(email.html))?.content)
      : undefined;
    const text = email.text
      ? new TextDecoder().decode((await ctx.db.get(email.text))?.content)
      : undefined;
    return {
      ...omit(email, ["html", "text", "_id", "_creationTime"]),
      createdAt: email._creationTime,
      html,
      text,
    };
  },
});

// Ensure there is a worker running to grab batches of emails.
async function scheduleBatchRun(ctx: MutationCtx, options: RuntimeConfig) {
  // Update the last options if they've changed.
  const lastOptions = await ctx.db.query("lastOptions").unique();
  if (!lastOptions) {
    await ctx.db.insert("lastOptions", {
      options,
    });
  } else if (!isDeepEqual(lastOptions.options, options)) {
    await ctx.db.replace(lastOptions._id, {
      options,
    });
  }

  // Check if there is already a worker running.
  const existing = await ctx.db.query("nextBatchRun").unique();

  // Is there already a worker running?
  if (existing) {
    return;
  }

  // No worker running? Schedule one.
  const runId = await ctx.scheduler.runAfter(
    BASE_BATCH_DELAY,
    internal.lib.makeBatch,
    { reloop: false, segment: getSegment(Date.now() + BASE_BATCH_DELAY) }
  );

  // Insert the new worker to reserve exactly one running.
  await ctx.db.insert("nextBatchRun", {
    runId,
  });
}

// A background job that grabs batches of emails and enqueues them to be sent by the workpool.
export const makeBatch = internalMutation({
  args: { reloop: v.boolean(), segment: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the API key for the worker.
    const lastOptions = await ctx.db.query("lastOptions").unique();
    if (!lastOptions) {
      throw new Error("No last options found -- invariant");
    }
    const options = lastOptions.options;

    // Grab the batch of emails to send.
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_status_segment", (q) =>
        // We scan earlier than two segments ago to avoid contention between new email insertions and batch creation.
        q.eq("status", "waiting").lte("segment", args.segment - 2)
      )
      .take(BATCH_SIZE);

    // If we have no emails, or we have a short batch on a reloop,
    // let's delay working for now.
    if (emails.length === 0 || (args.reloop && emails.length < BATCH_SIZE)) {
      return reschedule(ctx, emails.length > 0);
    }

    console.log(`Making a batch of ${emails.length} emails`);

    // Mark the emails as queued.
    for (const email of emails) {
      await ctx.db.patch(email._id, {
        status: "queued",
      });
    }

    // Okay, let's calculate rate limiting as best we can globally in this distributed system.
    const delay = await getDelay(ctx);

    // Give the batch to the workpool! It will call the Resend batch API
    // in a durable background action.
    await emailPool.enqueueAction(
      ctx,
      internal.lib.callResendAPIWithBatch,
      {
        apiKey: options.apiKey,
        emails: emails.map((e) => e._id),
      },
      {
        retry: {
          maxAttempts: options.retryAttempts,
          initialBackoffMs: options.initialBackoffMs,
          base: 2,
        },
        runAfter: delay,
        context: { emailIds: emails.map((e) => e._id) },
        onComplete: internal.lib.onEmailComplete,
      }
    );

    // Let's go around again until there are no more batches to make in this particular segment range.
    await ctx.scheduler.runAfter(0, internal.lib.makeBatch, {
      reloop: true,
      segment: args.segment,
    });
  },
});

// If there are no more emails to send in this segment range, we need to check to see if there are any
// emails in newer segments and so we should sleep for a bit before trying to make batches again.
// If the table is empty, we need to stop the worker and idle the system until a new email is inserted.
async function reschedule(ctx: MutationCtx, emailsLeft: boolean) {
  emailsLeft =
    emailsLeft ||
    (await ctx.db
      .query("emails")
      .withIndex("by_status_segment", (q) => q.eq("status", "waiting"))
      .first()) !== null;

  if (!emailsLeft) {
    // No next email yet?
    const batchRun = await ctx.db.query("nextBatchRun").unique();
    if (!batchRun) {
      throw new Error("No batch run found -- invariant");
    }
    await ctx.db.delete(batchRun._id);
  } else {
    const segment = getSegment(Date.now() + BASE_BATCH_DELAY);
    await ctx.scheduler.runAfter(BASE_BATCH_DELAY, internal.lib.makeBatch, {
      reloop: false,
      segment,
    });
  }
}

// Helper to fetch content. We'll use batch apis here to avoid lots of action->query calls.
async function getAllContent(
  ctx: ActionCtx,
  contentIds: Id<"content">[]
): Promise<Map<Id<"content">, string>> {
  const docs = await ctx.runQuery(internal.lib.getAllContentByIds, {
    contentIds,
  });
  return new Map(docs.map((doc) => [doc.id, doc.content]));
}

const vBatchReturns = v.union(
  v.null(),
  v.object({
    emailIds: v.array(v.id("emails")),
    resendIds: v.array(v.string()),
  })
);

// Okay, finally! Let's call the Resend API with the batch of emails.
export const callResendAPIWithBatch = internalAction({
  args: {
    apiKey: v.string(),
    emails: v.array(v.id("emails")),
  },
  returns: vBatchReturns,
  handler: async (ctx, args) => {
    // Construct the JSON payload for the Resend API from all the database values.
    const batchPayload = await createResendBatchPayload(ctx, args.emails);

    if (batchPayload === null) {
      // No emails to send.
      console.log("No emails to send in batch. All were cancelled or failed.");
      return;
    }

    const [emailIds, body] = batchPayload;

    // Make API call
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": args.emails[0].toString(),
      },
      body,
    });
    if (!response.ok) {
      if (PERMANENT_ERROR_CODES.has(response.status)) {
        // report the error to the user
        await ctx.runMutation(internal.lib.markEmailsFailed, {
          emailIds: args.emails,
          errorMessage: `Resend API error: ${response.status} ${response.statusText} ${await response.text()}`,
        });
        return;
      }
      // For now, try again.
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    } else {
      const data = await response.json();
      if (!data.data) {
        throw new Error("Resend API error: No data returned");
      }
      return {
        emailIds,
        resendIds: data.data.map((d: { id: string }) => d.id),
      };
    }
  },
});

export const markEmailsFailed = internalMutation({
  args: {
    emailIds: v.array(v.id("emails")),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: markEmailsFailedHandler,
});

async function markEmailsFailedHandler(
  ctx: MutationCtx,
  args: {
    emailIds: Id<"emails">[];
    errorMessage: string;
  }
) {
  await Promise.all(
    args.emailIds.map(async (emailId) => {
      const email = await ctx.db.get(emailId);
      if (!email || email.status !== "queued") {
        return;
      }
      await ctx.db.patch(emailId, {
        status: "failed",
        errorMessage: args.errorMessage,
        finalizedAt: Date.now(),
      });
    })
  );
}

export const onEmailComplete = emailPool.defineOnComplete({
  context: v.object({
    emailIds: v.array(v.id("emails")),
  }),
  handler: async (ctx, args) => {
    if (args.result.kind === "success") {
      const result = parse(vBatchReturns, args.result.returnValue);
      if (result === null) {
        return;
      }
      const { emailIds, resendIds } = result;
      await Promise.all(
        emailIds.map((emailId, i) =>
          ctx.db.patch(emailId, {
            status: "sent",
            resendId: resendIds[i],
          })
        )
      );
    } else if (args.result.kind === "failed") {
      await markEmailsFailedHandler(ctx, {
        emailIds: args.context.emailIds,
        errorMessage: args.result.error,
      });
    } else if (args.result.kind === "canceled") {
      await Promise.all(
        args.context.emailIds.map(async (emailId) => {
          const email = await ctx.db.get(emailId);
          if (!email || email.status !== "queued") {
            return;
          }
          await ctx.db.patch(emailId, {
            status: "cancelled",
            errorMessage: "Resend API batch job was cancelled",
            finalizedAt: Date.now(),
          });
        })
      );
    }
  },
});

// Helper to create the JSON payload for the Resend API.
async function createResendBatchPayload(
  ctx: ActionCtx,
  emailIds: Id<"emails">[]
): Promise<[Id<"emails">[], string] | null> {
  // Fetch emails from database.
  const allEmails = await ctx.runQuery(internal.lib.getEmailsByIds, {
    emailIds,
  });
  // Filter out cancelled emails.
  const emails = allEmails.filter((e) => e.status === "queued");
  if (emails.length === 0) {
    return null;
  }
  // Fetch body content from database.
  const contentMap = await getAllContent(
    ctx,
    emails
      .flatMap((e) => [e.html, e.text])
      .filter((id): id is Id<"content"> => id !== undefined)
  );

  // Build payload for resend API.
  const batchPayload = emails.map((email: Doc<"emails">) => ({
    from: email.from,
    to: [email.to],
    subject: email.subject,
    html: email.html ? contentMap.get(email.html) : undefined,
    text: email.text ? contentMap.get(email.text) : undefined,
    reply_to: email.replyTo && email.replyTo.length ? email.replyTo : undefined,
    headers: email.headers
      ? Object.fromEntries(
          email.headers.map((h: { name: string; value: string }) => [
            h.name,
            h.value,
          ])
        )
      : undefined,
  }));

  return [emails.map((e) => e._id), JSON.stringify(batchPayload)];
}

const FIXED_WINDOW_DELAY = 100;
async function getDelay(ctx: RunMutationCtx): Promise<number> {
  const limit = await resendApiRateLimiter.limit(ctx, "resendApi", {
    reserve: true,
  });
  //console.log(`RL: ${limit.ok} ${limit.retryAfter}`);
  const jitter = Math.random() * FIXED_WINDOW_DELAY;
  return limit.retryAfter ? limit.retryAfter + jitter : 0;
}

// Helper to fetch content by id. We'll use batch apis here to avoid lots of action->query calls.
export const getAllContentByIds = internalQuery({
  args: { contentIds: v.array(v.id("content")) },
  returns: v.array(v.object({ id: v.id("content"), content: v.string() })),
  handler: async (ctx, args) => {
    const contentMap = [];
    const promises = [];
    for (const contentId of args.contentIds) {
      promises.push(ctx.db.get(contentId));
    }
    const docs = await Promise.all(promises);
    for (const doc of docs) {
      if (!doc) throw new Error("Content not found -- invariant");
      contentMap.push({
        id: doc._id,
        content: new TextDecoder().decode(doc.content),
      });
    }
    return contentMap;
  },
});

// Helper to fetch emails by id. We'll use batch apis here to avoid lots of action->query calls.
export const getEmailsByIds = internalQuery({
  args: { emailIds: v.array(v.id("emails")) },
  handler: async (ctx, args) => {
    const emails = await Promise.all(args.emailIds.map((id) => ctx.db.get(id)));

    // Some emails might be missing b/c they were cancelled long ago and already
    // cleaned up because the retention period has passed.
    return emails.filter((e): e is Doc<"emails"> => e !== null);
  },
});

// Helper to fetch an email by resendId. This is used by the webhook handler.
// Resend gives us *their* id back, no ours. We'll use the index to find it.
export const getEmailByResendId = internalQuery({
  args: { resendId: v.string() },
  handler: async (ctx, args) => {
    const email = await ctx.db
      .query("emails")
      .withIndex("by_resendId", (q) => q.eq("resendId", args.resendId))
      .unique();
    if (!email) throw new Error("Email not found for resendId");
    return email;
  },
});

// Handle a webhook event. Mostly we just update the email status.
export const handleEmailEvent = mutation({
  args: {
    event: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Event can be anything, so we need to parse it.
    // this will also strip out anything that shouldnt be there.
    const result = attemptToParse(vEmailEvent, args.event);
    if (result.kind === "error") {
      console.warn(
        `Invalid email event received. You might want to to exclude this event from your Resend webhook settings in the Resend dashboard. ${result.error}.`
      );
      return;
    }

    const event = result.data;

    const email = await ctx.db
      .query("emails")
      .withIndex("by_resendId", (q) => q.eq("resendId", event.data.email_id))
      .unique();

    if (!email) {
      console.info(
        `Email not found for resendId: ${event.data.email_id}, ignoring...`
      );
      return;
    }

    // Returns the changed email or null if not changed
    const changed = iife((): Doc<"emails"> | null => {
      // NOOP -- we do this automatically when we send the email.
      if (event.type == "email.sent") return null;

      // These we dont do anything with
      if (event.type == "email.clicked") return null;
      if (event.type == "email.failed") return null;

      if (event.type == "email.delivered")
        return {
          ...email,
          status: "delivered",
          finalizedAt: Date.now(),
        };

      if (event.type == "email.bounced")
        return {
          ...email,
          status: "bounced",
          finalizedAt: Date.now(),
          errorMessage: event.data.bounce?.message,
        };

      if (event.type == "email.delivery_delayed")
        return {
          ...email,
          status: "delivery_delayed",
        };

      if (event.type == "email.complained")
        return {
          ...email,
          complained: true,
        };

      if (event.type == "email.opened")
        return {
          ...email,
          opened: true,
        };

      assertExhaustive(event);

      return null;
    });

    if (changed) await ctx.db.replace(email._id, changed);

    await enqueueCallbackIfExists(ctx, changed ?? email, event);
  },
});

async function enqueueCallbackIfExists(
  ctx: MutationCtx,
  email: Doc<"emails">,
  event: EmailEvent
) {
  const lastOptions = await ctx.db.query("lastOptions").unique();
  if (!lastOptions) {
    throw new Error("No last options found -- invariant");
  }
  if (lastOptions.options.onEmailEvent) {
    const handle = lastOptions.options.onEmailEvent.fnHandle as FunctionHandle<
      "mutation",
      {
        id: Id<"emails">;
        event: EmailEvent;
      },
      void
    >;
    await callbackPool.enqueueMutation(ctx, handle, {
      id: email._id,
      event: event,
    });
  }
}

// Periodic background job to clean up old emails that have already
// been delivered, bounced, what have you.
export const cleanupOldEmails = mutation({
  args: { olderThan: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const olderThan = args.olderThan ?? FINALIZED_EMAIL_RETENTION_MS;
    const oldAndDone = await ctx.db
      .query("emails")
      .withIndex("by_finalizedAt", (q) =>
        q.lt("finalizedAt", Date.now() - olderThan)
      )
      .take(500);
    for (const email of oldAndDone) {
      await ctx.db.delete(email._id);
      if (email.text) {
        await ctx.db.delete(email.text);
      }
      if (email.html) {
        await ctx.db.delete(email.html);
      }
    }
    if (oldAndDone.length > 0) {
      console.log(`Cleaned up ${oldAndDone.length} emails`);
    }
    if (oldAndDone.length === 500) {
      await ctx.scheduler.runAfter(0, api.lib.cleanupOldEmails, {
        olderThan,
      });
    }
  },
});

// Periodic background job to clean up old emails that have been abandoned.
// Meaning, even if they're not finalized, we should just get rid of them.
export const cleanupAbandonedEmails = mutation({
  args: { olderThan: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const olderThan = args.olderThan ?? ABANDONED_EMAIL_RETENTION_MS;
    const oldAndAbandoned = await ctx.db
      .query("emails")
      .withIndex("by_creation_time", (q) =>
        q.lt("_creationTime", Date.now() - olderThan)
      )
      .take(500);

    for (const email of oldAndAbandoned) {
      // No webhook to finalize these. We'll just delete them.
      await ctx.db.delete(email._id);
      if (email.text) {
        await ctx.db.delete(email.text);
      }
      if (email.html) {
        await ctx.db.delete(email.html);
      }
    }
    if (oldAndAbandoned.length > 0) {
      console.log(`Cleaned up ${oldAndAbandoned.length} emails`);
    }
    if (oldAndAbandoned.length === 500) {
      await ctx.scheduler.runAfter(0, api.lib.cleanupAbandonedEmails, {
        olderThan,
      });
    }
  },
});
</file>

<file path="src/component/schema.ts">
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vOptions, vStatus } from "./shared.js";

export default defineSchema({
  content: defineTable({
    content: v.bytes(),
    mimeType: v.string(),
    filename: v.optional(v.string()),
    path: v.optional(v.string()),
  }),
  nextBatchRun: defineTable({
    runId: v.id("_scheduled_functions"),
  }),
  lastOptions: defineTable({
    options: vOptions,
  }),
  emails: defineTable({
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    replyTo: v.array(v.string()),
    html: v.optional(v.id("content")),
    text: v.optional(v.id("content")),
    headers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          value: v.string(),
        })
      )
    ),
    status: vStatus,
    errorMessage: v.optional(v.string()),
    complained: v.boolean(),
    opened: v.boolean(),
    resendId: v.optional(v.string()),
    segment: v.number(),
    finalizedAt: v.number(),
  })
    .index("by_status_segment", ["status", "segment"])
    .index("by_resendId", ["resendId"])
    .index("by_finalizedAt", ["finalizedAt"]),
});
</file>

<file path="src/component/setup.test.ts">
/// <reference types="vite/client" />
import { test } from "vitest";
import type {
  EventEventOfType,
  EventEventTypes,
  RuntimeConfig,
} from "./shared.js";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import type { Doc } from "./_generated/dataModel.js";
import { assertExhaustive } from "./utils.js";

export const modules = import.meta.glob("./**/*.*s");

export const setupTest = () => {
  const t = convexTest(schema, modules);
  return t;
};

export type Tester = ReturnType<typeof setupTest>;

test("setup", () => {});

export const createTestEventOfType = <T extends EventEventTypes>(
  type: T,
  overrides?: Partial<EventEventOfType<T>>
): EventEventOfType<T> => {
  const baseData = {
    email_id: "test-resend-id-123",
    created_at: "2024-01-01T00:00:00Z",
    from: "test@example.com",
    to: "recipient@example.com",
    subject: "Test Email",
    broadcast_id: "test-broadcast-123",
    cc: ["cc@example.com"],
    bcc: ["bcc@example.com"],
    reply_to: ["reply@example.com"],
    headers: [{ name: "X-Test-Header", value: "test-value" }],
    tags: [
      { name: "environment", value: "test" },
      { name: "campaign", value: "test-campaign" },
    ],
  };

  const baseEvent = {
    type,
    created_at: "2024-01-01T00:00:00Z",
  };

  // Helper to merge overrides with base event
  const applyOverrides = (event: {
    type: string;
    created_at: string;
    data: Record<string, unknown>;
  }): EventEventOfType<T> => {
    if (!overrides) return event as EventEventOfType<T>;

    return {
      ...event,
      ...overrides,
      data: overrides.data ? { ...event.data, ...overrides.data } : event.data,
    } as EventEventOfType<T>;
  };

  if (type === "email.sent")
    return applyOverrides({
      ...baseEvent,
      type: "email.sent",
      data: baseData,
    });

  if (type === "email.delivered")
    return applyOverrides({
      ...baseEvent,
      type: "email.delivered",
      data: baseData,
    });

  if (type === "email.delivery_delayed")
    return applyOverrides({
      ...baseEvent,
      type: "email.delivery_delayed",
      data: baseData,
    });

  if (type === "email.complained")
    return applyOverrides({
      ...baseEvent,
      type: "email.complained",
      data: baseData,
    });

  if (type === "email.bounced")
    return applyOverrides({
      ...baseEvent,
      type: "email.bounced",
      data: {
        ...baseData,
        bounce: {
          message: "The email bounced due to invalid recipient",
          subType: "general",
          type: "hard",
        },
      },
    });

  if (type === "email.opened")
    return applyOverrides({
      ...baseEvent,
      type: "email.opened",
      data: {
        ...baseData,
        open: {
          ipAddress: "192.168.1.100",
          timestamp: "2024-01-01T00:05:00Z",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    });

  if (type === "email.clicked")
    return applyOverrides({
      ...baseEvent,
      type: "email.clicked",
      data: {
        ...baseData,
        click: {
          ipAddress: "192.168.1.100",
          link: "https://example.com/test-link",
          timestamp: "2024-01-01T00:10:00Z",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    });

  if (type === "email.failed")
    return applyOverrides({
      ...baseEvent,
      type: "email.failed",
      data: {
        ...baseData,
        failed: {
          reason: "SMTP server rejected the email",
        },
      },
    });

  return assertExhaustive(type);
};

export const createTestRuntimeConfig = (): RuntimeConfig => ({
  apiKey: "test-api-key",
  testMode: true,
  initialBackoffMs: 1000,
  retryAttempts: 3,
});

export const setupTestLastOptions = (
  t: Tester,
  overrides?: Partial<Doc<"lastOptions">>
) =>
  t.run(async (ctx) => {
    await ctx.db.insert("lastOptions", {
      options: {
        ...createTestRuntimeConfig(),
      },
      ...overrides,
    });
  });

export const insertTestEmail = (
  t: Tester,
  overrides: Omit<Doc<"emails">, "_id" | "_creationTime">
) =>
  t.run(async (ctx) => {
    const id = await ctx.db.insert("emails", overrides);
    const email = await ctx.db.get(id);
    if (!email) throw new Error("Email not found");
    return email;
  });

export const insertTestSentEmail = (
  t: Tester,
  overrides?: Partial<Doc<"emails">>
) =>
  insertTestEmail(t, {
    from: "test@example.com",
    to: "recipient@example.com",
    subject: "Test Email",
    replyTo: [],
    status: "sent",
    complained: false,
    opened: false,
    resendId: "test-resend-id-123",
    segment: 1,
    finalizedAt: Number.MAX_SAFE_INTEGER, // FINALIZED_EPOCH
    ...overrides,
  });
</file>

<file path="src/component/shared.ts">
import {
  type GenericDataModel,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { type Infer, v } from "convex/values";

// Validator for the onEmailEvent option.
export const onEmailEvent = v.object({
  fnHandle: v.string(),
});

// Validator for the status of an email.
export const vStatus = v.union(
  v.literal("waiting"),
  v.literal("queued"),
  v.literal("cancelled"),
  v.literal("sent"),
  v.literal("delivered"),
  v.literal("delivery_delayed"),
  v.literal("bounced"),
  v.literal("failed")
);
export type Status = Infer<typeof vStatus>;

// Validator for the runtime options used by the component.
export const vOptions = v.object({
  initialBackoffMs: v.number(),
  retryAttempts: v.number(),
  apiKey: v.string(),
  testMode: v.boolean(),
  onEmailEvent: v.optional(onEmailEvent),
});

export type RuntimeConfig = Infer<typeof vOptions>;

const commonFields = {
  broadcast_id: v.optional(v.string()),
  created_at: v.string(),
  email_id: v.string(),
  from: v.union(v.string(), v.array(v.string())),
  to: v.union(v.string(), v.array(v.string())),
  cc: v.optional(v.union(v.string(), v.array(v.string()))),
  bcc: v.optional(v.union(v.string(), v.array(v.string()))),
  reply_to: v.optional(v.union(v.string(), v.array(v.string()))),
  headers: v.optional(
    v.array(
      v.object({
        name: v.string(),
        value: v.string(),
      })
    )
  ),
  subject: v.string(),
  tags: v.optional(
    v.union(
      v.record(v.string(), v.string()),
      v.array(
        v.object({
          name: v.string(),
          value: v.string(),
        })
      )
    )
  ),
};

// Normalized webhook events coming from Resend.
export const vEmailEvent = v.union(
  v.object({
    type: v.literal("email.sent"),
    created_at: v.string(),
    data: v.object(commonFields),
  }),
  v.object({
    type: v.literal("email.delivered"),
    created_at: v.string(),
    data: v.object(commonFields),
  }),
  v.object({
    type: v.literal("email.delivery_delayed"),
    created_at: v.string(),
    data: v.object(commonFields),
  }),
  v.object({
    type: v.literal("email.complained"),
    created_at: v.string(),
    data: v.object(commonFields),
  }),
  v.object({
    type: v.literal("email.bounced"),
    created_at: v.string(),
    data: v.object({
      ...commonFields,
      bounce: v.object({
        message: v.string(),
        subType: v.string(),
        type: v.string(),
      }),
    }),
  }),
  v.object({
    type: v.literal("email.opened"),
    created_at: v.string(),
    data: v.object({
      ...commonFields,
      open: v.object({
        ipAddress: v.string(),
        timestamp: v.string(),
        userAgent: v.string(),
      }),
    }),
  }),
  v.object({
    type: v.literal("email.clicked"),
    created_at: v.string(),
    data: v.object({
      ...commonFields,
      click: v.object({
        ipAddress: v.string(),
        link: v.string(),
        timestamp: v.string(),
        userAgent: v.string(),
      }),
    }),
  }),
  v.object({
    type: v.literal("email.failed"),
    created_at: v.string(),
    data: v.object({
      ...commonFields,
      failed: v.object({
        reason: v.string(),
      }),
    }),
  })
);

export type EmailEvent = Infer<typeof vEmailEvent>;
export type EventEventTypes = EmailEvent["type"];
export type EventEventOfType<T extends EventEventTypes> = Extract<
  EmailEvent,
  { type: T }
>;

/* Type utils follow */

export type RunQueryCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
export type RunMutationCtx = {
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
</file>

<file path="src/component/utils.ts">
import { parse } from "convex-helpers/validators";
import type { Validator, Infer } from "convex/values";

export const assertExhaustive = (value: never): never => {
  throw new Error(`Unhandled event type: ${value as string}`);
};

export const iife = <T>(fn: () => T): T => fn();

/**
 * Generic function to attempt parsing with proper TypeScript type narrowing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function attemptToParse<T extends Validator<any, any, any>>(
  validator: T,
  value: unknown
): { kind: "success"; data: Infer<T> } | { kind: "error"; error: unknown } {
  try {
    return {
      kind: "success",
      data: parse(validator, value),
    };
  } catch (error) {
    return {
      kind: "error",
      error,
    };
  }
}
</file>

<file path="src/vitest.config.ts">
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
  },
});
</file>

<file path=".gitignore">
.DS_Store
.idea
*.local
*.log
/.vscode/
/docs/.vitepress/cache
dist
dist-ssr
explorations
node_modules
.eslintcache

# this is a package-json-redirect stub dir, see https://github.com/andrewbranch/example-subpath-exports-ts-compat?tab=readme-ov-file
react/package.json
# npm pack output
*.tgz
</file>

<file path=".prettierrc.json">
{
  "trailingComma": "es5"
}
</file>

<file path="CONTRIBUTING.md">
# Developing guide

## Running locally

```sh
npm i
cd example
npm i
npx convex dev
```

## Testing

```sh
rm -rf dist/ && npm run build
npm run typecheck
npm run test
cd example
npm run lint
cd ..
```

## Deploying

### Building a one-off package

```sh
rm -rf dist/ && npm run build
npm pack
```

### Deploying a new version

```sh
# this will change the version and commit it (if you run it in the root directory)
npm version patch
npm publish --dry-run
# sanity check files being included
npm publish
git push --tags
```

#### Alpha release

The same as above, but it requires extra flags so the release is only installed with `@alpha`:

```sh
npm version prerelease --preid alpha
npm publish --tag alpha
```
</file>

<file path="eslint.config.js">
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { files: ["src/**/*.{js,mjs,cjs,ts,tsx}"] },
  {
    ignores: [
      "dist/**",
      "eslint.config.js",
      "example/eslint.config.js",
      "**/_generated/",
      "node10stubs.mjs",
    ],
  },
  {
    languageOptions: {
      globals: globals.worker,
      parser: tseslint.parser,

      parserOptions: {
        project: ["./tsconfig.json", "./example/tsconfig.json"],
        tsconfigRootDir: ".",
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "eslint-comments/no-unused-disable": "off",

      // allow (_arg: number) => {} and const _foo = 1;
      "no-unused-vars": "off",
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
</file>

<file path="LICENSE">
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
</file>

<file path="node10stubs.mjs">
import fs from "fs/promises";
import path from "path";

async function findPackageJson(directory) {
  const packagePath = path.join(directory, "package.json");
  try {
    await fs.access(packagePath);
    return packagePath;
  } catch (error) {
    const parentDir = path.dirname(directory);
    if (parentDir === directory) {
      throw new Error("package.json not found");
    }
    return findPackageJson(parentDir);
  }
}

async function processSubPackages(packageJsonPath, exports, cleanup = false) {
  const baseDir = path.dirname(packageJsonPath);

  for (const [subDir, _] of Object.entries(exports)) {
    // package.json is already right where Node10 resolution would expect it.
    if (subDir.endsWith("package.json")) continue;
    // No need for Node10 resolution for component.config.ts
    if (subDir.endsWith("convex.config.js")) continue;
    // . just works with Node10 resolution
    if (subDir === ".") continue;
    console.log(subDir);

    const newDir = path.join(baseDir, subDir);
    const newPackageJsonPath = path.join(newDir, "package.json");

    if (cleanup) {
      try {
        await fs.rm(newDir, { recursive: true, force: true });
      } catch (error) {
        console.error(`Failed to remove ${newDir}:`, error.message);
      }
    } else {
      const newPackageJson = {
        main: `../dist/${subDir}/index.js`,
        module: `../dist/${subDir}/index.js`,
        types: `../dist/${subDir}/index.d.ts`,
      };

      await fs.mkdir(newDir, { recursive: true });
      await fs.writeFile(
        newPackageJsonPath,
        JSON.stringify(newPackageJson, null, 2),
      );
    }
  }
}

async function main() {
  try {
    const isCleanup = process.argv.includes("--cleanup");
    const isAddFiles = process.argv.includes("--addFiles");
    const packageJsonPath = await findPackageJson(process.cwd());
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    if (!packageJson.exports) {
      throw new Error("exports not found in package.json");
    }

    if (isAddFiles) {
      return;
    }

    await processSubPackages(packageJsonPath, packageJson.exports, isCleanup);

    if (isCleanup) {
      console.log(
        "Node10 module resolution compatibility stub directories removed.",
      );
    } else {
      console.log(
        "Node10 module resolution compatibility stub directories created",
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
</file>

<file path="package.json">
{
  "name": "@convex-dev/resend",
  "description": "A resend component for Convex.",
  "repository": "github:get-convex/resend",
  "homepage": "https://github.com/get-convex/resend#readme",
  "bugs": {
    "email": "support@convex.dev",
    "url": "https://github.com/get-convex/resend/issues"
  },
  "version": "0.1.12",
  "license": "Apache-2.0",
  "keywords": [
    "convex",
    "component"
  ],
  "type": "module",
  "scripts": {
    "example": "cd example && npm run dev",
    "dev": "run-p -r 'example' 'build:watch'",
    "dashboard": "cd example && npx convex dashboard",
    "all": "run-p -r 'example' 'build:watch' 'test:watch'",
    "setup": "npm i && npm run build && cd example && npm i && npx convex dev --once --live-component-sources --typecheck-components",
    "build:watch": "npx chokidar 'tsconfig*.json' 'src/**/*.ts' -c 'npm run build' --initial",
    "build": "tsc --project ./tsconfig.build.json && tsc-alias -p tsconfig.build.json",
    "alpha": "npm run clean && npm run build && run-p test lint typecheck && npm version prerelease --preid alpha && npm publish --tag alpha && git push --tags",
    "release": "npm run clean && npm run build && run-p test lint typecheck && npm version patch && npm publish && git push --tags",
    "clean": "rm -rf dist tsconfig.build.tsbuildinfo",
    "typecheck": "tsc --noEmit",
    "prepare": "npm run build",
    "prepack": "node node10stubs.mjs",
    "postpack": "node node10stubs.mjs --cleanup",
    "test": "vitest run --typecheck --config ./src/vitest.config.ts",
    "test:watch": "vitest --typecheck --config ./src/vitest.config.ts",
    "test:debug": "vitest --inspect-brk --no-file-parallelism --config ./src/vitest.config.ts",
    "test:coverage": "vitest run --coverage --coverage.reporter=text",
    "lint": "eslint src"
  },
  "files": [
    "dist",
    "src",
    "react"
  ],
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "types": "./dist/client/index.d.ts",
      "default": "./dist/client/index.js"
    },
    "./convex.config": {
      "types": "./dist/component/convex.config.d.ts",
      "default": "./dist/component/convex.config.js"
    }
  },
  "peerDependencies": {
    "convex": "^1.23.0",
    "convex-helpers": "^0.1.99"
  },
  "devDependencies": {
    "@edge-runtime/vm": "^5.0.0",
    "@eslint/js": "^9.9.1",
    "@types/node": "^18.17.0",
    "chokidar-cli": "^3.0.0",
    "convex": "1.25.4",
    "convex-test": "^0.0.33",
    "cpy-cli": "^5.0.0",
    "eslint": "^9.9.1",
    "globals": "^15.9.0",
    "npm-run-all2": "^7.0.2",
    "pkg-pr-new": "^0.0.54",
    "prettier": "3.2.5",
    "tsc-alias": "^1.8.16",
    "typescript": "^5.5",
    "typescript-eslint": "^8.4.0",
    "vitest": "^3.2.4"
  },
  "main": "./dist/client/index.js",
  "types": "./dist/client/index.d.ts",
  "module": "./dist/client/index.js",
  "dependencies": {
    "@convex-dev/rate-limiter": "^0.2.10",
    "@convex-dev/workpool": "^0.2.17",
    "remeda": "^2.26.0",
    "svix": "^1.70.0"
  }
}
</file>

<file path="README.md">
# Resend Convex Component

[![npm version](https://badge.fury.io/js/@convex-dev%2Fresend.svg)](https://badge.fury.io/js/@convex-dev%2Fresend)

This component is the official way to integrate the Resend email service
with your Convex project.

Features:

- Queueing: Send as many emails as you want, as fast as you want—they'll all be delivered (eventually).
- Batching: Automatically batches large groups of emails and sends them to Resend efficiently.
- Durable execution: Uses Convex workpools to ensure emails are eventually delivered, even in the face of temporary failures or network outages.
- Idempotency: Manages Resend idempotency keys to guarantee emails are delivered exactly once, preventing accidental spamming from retries.
- Rate limiting: Honors API rate limits established by Resend.

See [example](./example) for a demo of how to incorporate this hook into your
application.

[![Navigate the Email MINEFIELD with the Resend Component!](https://thumbs.video-to-markdown.com/bf0f179c.jpg)](https://youtu.be/iIq67N8vuMU)

## Installation

```bash
npm install @convex-dev/resend
```

## Get Started

Create a [Resend](https://resend.com) account and grab an API key. Set it to
`RESEND_API_KEY` in your deployment environment.

Next, add the component to your Convex app via `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);

export default app;
```

Then you can use it, as we see in `convex/sendEmails.ts`:

```ts
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";

export const resend: Resend = new Resend(components.resend, {});

export const sendTestEmail = internalMutation({
  handler: async (ctx) => {
    await resend.sendEmail(ctx, {
      from: "Me <test@mydomain.com>",
      to: "delivered@resend.dev",
      subject: "Hi there",
      html: "This is a test email",
    });
  },
});
```

Then, calling `sendTestEmail` from anywhere in your app will send this test email.

If you want to send emails to real addresses, you need to disable `testMode`.
You can do this in `ResendOptions`, [as detailed below](#resend-component-options-and-going-into-production).

## Advanced Usage

### Setting up a Resend webhook

While the setup we have so far will reliably send emails, you don't have any feedback
on anything delivering, bouncing, or triggering spam complaints. For that, we need
to set up a webhook!

On the Convex side, we need to mount an http endpoint to our project to route it to
the Resend component in `convex/http.ts`:

```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resend } from "./sendEmails";

const http = httpRouter();

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
```

If our Convex project is happy-leopard-123, we now have a Resend webhook for
our project running at `https://happy-leopard-123.convex.site/resend-webhook`.

So navigate to the Resend dashboard and create a new webhook at that URL. Make sure
to enable all the `email.*` events; the other event types will be ignored.

Finally, copy the webhook secret out of the Resend dashboard and set it to the
`RESEND_WEBHOOK_SECRET` environment variable in your Convex deployment.

You should now be seeing email status updates as Resend makes progress on your
batches!

Speaking of...

### Registering an email status event handler.

If you have your webhook established, you can also register an event handler in your
apps you get notifications when email statuses change.

Update your `sendEmails.ts` to look something like this:

```ts
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { vEmailId, vEmailEvent, Resend } from "@convex-dev/resend";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.example.handleEmailEvent,
});

export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, args) => {
    // Handle however you want
    // args provides { id: EmailId; event: EmailEvent; }
    // see /example/example.ts
  },
});
```

Check out the `example/` project in this repo for a full demo.

### Resend component options, and going into production

There is a `ResendOptions` argument to the component constructor to help customize
it's behavior.

Check out the [docstrings](./src/client/index.ts), but notable options include:

- `apiKey`: Provide the Resend API key instead of having it read from the environment
  variable.
- `webhookSecret`: Same thing, but for the webhook secret.
- `testMode`: Only allow delivery to test addresses. To keep you safe as you develop
  your project, `testMode` is default **true**. You need to explicitly set this to
  `false` for the component to allow you to enqueue emails to artibrary addresses.
- `onEmailEvent`: Your email event callback, as outlined above!
  Check out the [docstrings](./src/client/index.ts) for details on the events that
  are emitted.

### Optional email sending parameters

In addition to basic from/to/subject and html/plain text bodies, the `sendEmail` method
allows you to provide a list of `replyTo` addresses, and other email headers.

### Tracking, getting status, and cancelling emails

The `sendEmail` method returns a branded type, `EmailId`. You can use this
for a few things:

- To reassociate the original email during status changes in your email event handler.
- To check on the status any time using `resend.status(ctx, emailId)`.
- To cancel the email using `resend.cancelEmail(ctx, emailId)`.

If the email has already been sent to the Resend API, it cannot be cancelled. Cancellations
do not trigger an email event.

### Data retention

This component retains "finalized" (delivered, cancelled, bounced) emails.
It's your responsibility to clear out those emails on your own schedule.
You can run `cleanupOldEmails` and `cleanupAbandonedEmails` from the dashboard,
under the "resend" component tab in the function runner, or set up a cron job.

If you pass no argument, it defaults to deleting emails older than 7 days.

If you don't care about historical email status, the recommended approach is to
use a cron job, as shown below:

```ts
// in convex/crons.ts
import { cronJobs } from "convex/server";
import { components, internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";

const crons = cronJobs();
crons.interval(
  "Remove old emails from the resend component",
  { hours: 1 },
  internal.crons.cleanupResend
);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      // These generally indicate a bug, so keep them around for longer.
      { olderThan: 4 * ONE_WEEK_MS }
    );
  },
});

export default crons;
```

### Using React Email

You can use [React Email](https://react.email/) to generate your HTML for you from JSX.

First install the [dependencies](https://react.email/docs/getting-started/manual-setup#2-install-dependencies):

```bash
npm install @react-email/components react react-dom react-email @react-email/render
```

Then create a new .tsx file in your Convex directory e.g. `/convex/emails.tsx`:

```tsx
// IMPORTANT: this is a Convex Node Action
"use node";
import { action } from "./_generated/server";
import { render, pretty } from "@react-email/render";
import { Button, Html } from "@react-email/components";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const sendEmail = action({
  args: {},
  handler: async (ctx, args) => {
    // 1. Generate the HTML from your JSX
    // This can come from a custom component in your /emails/ directory
    // if you would like to view your templates locally. For more info see:
    // https://react.email/docs/getting-started/manual-setup#5-run-locally
    const html = await pretty(
      await render(
        <Html>
          <Button
            href="https://example.com"
            style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
          >
            Click me
          </Button>
        </Html>
      )
    );

    // 2. Send your email as usual using the component
    await resend.sendEmail(ctx, {
      from: "Me <test@mydomain.com>",
      to: "delivered@resend.dev",
      subject: "Hi there",
      html,
    });
  },
});
```

> [!WARNING]
> React Email requires some Node dependencies thus it must run in a Convex [Node action](https://docs.convex.dev/functions/actions#choosing-the-runtime-use-node) and not a regular Action.

### Sending emails manually, e.g. for attachments

If you need something that the component doesn't provide (it is currently
limited by what is supported by the batch API in Resend), you can send emails
manually. This is the preferred approach, because you have fine-grained control
over the email sending process, and can track its progress manually using the
component's public APIs.

```ts
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { Resend as ResendComponent } from "@convex-dev/resend";
import { Resend } from "resend";

const resend = new Resend("re_xxxxxxxxx");

export const resendResendComponent = new ResendComponent(components.resend, {});

await resend.emails.send({
  from: "Acme <onboarding@resend.dev>",
  to: ["delivered@resend.dev"],
  subject: "hello world",
  html: "<p>it works!</p>",
});

export const sendManualEmail = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const from = "Acme <onboarding@resend.dev>";
    const to = ["delivered@resend.dev"];
    const subject = "hello world";
    const html = "<p>it works!</p>";

    const emailId = await resend.sendEmailManually(
      ctx,
      { from, to, subject },
      async (emailId) => {
        const data = await resend.emails.send({
          from,
          to,
          subject,
          html,
          headers: [
            {
              name: "Idempotency-Key",
              value: emailId,
            },
          ],
        });
        return data.id;
      }
    );
  },
});
```
</file>

<file path="tsconfig.build.json">
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts", "src/**/*.js", "src/**/*.d.ts"],
  "exclude": ["src/**/*.test.*", "src/vitest.config.ts"],
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "./dist"
  },
  "tsc-alias": {
    "resolveFullPaths": true
  }
}
</file>

<file path="tsconfig.json">
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "strict": true,

    "target": "ESNext",
    "lib": ["ES2021", "dom"],
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "skipLibCheck": true
  },
  "include": ["./src/**/*"]
}
</file>

</files>
