# Plan

## Ten Chat - Theo Cloneathon Project

A modern chat application built with Next.js 15, React 19, and TypeScript, featuring real-time messaging, AI-powered features, and a sleek UI.

## Primary Findings from Core Exploration Actions

1. Static analysis of key components  
   • The project is the vanilla "create-t3-app" template: one global `RootLayout`, a demo `Home` page, and a client component `LatestPost`.  
   • Server side uses tRPC (`/src/server/api/**`) with an **in-memory** mock `posts` array—there is no database layer yet.  
   • No test files or additional components exist.

2. Dynamic property usage & data flow  
   • Data flows from the mock `postRouter` ➜ tRPC ➜ React Query ➜ `LatestPost` (client component) via Suspense query helpers.  
   • No authentication context or user information is passed anywhere; all procedures are marked `publicProcedure`.

3. Broader context, precedents & utilities  
   • No Convex setup, no Shadcn UI components, no AI/LLM libs, and no state persistence.  
   • Tailwind v4 is already configured and loaded through the new `@theme` CSS variable API.  
   • Project uses React 19, Next.js 15 (App Router) and Bun. This aligns with the user's desire for the latest React features (RSC, Suspense, etc.).

## Confirmation / Refinement of Problem Statement

The current codebase is a bare-bones Next.js 15 App-Router project with tRPC and Tailwind. It lacks:

• An authentication layer  
• Any persistent database and real-time sync (Convex)  
• AI/LLM integration (Vercel AI SDK, Groq, etc.)  
• UI component library (Shadcn)  
• Chat-specific schemas, routes, storage, or streaming logic

## Key Files, Functions, Types & Structures Involved

• `src/app/layout.tsx` – wraps all pages, will inject ConvexProviderWithClerk.  
• `src/app/page.tsx` – demo landing page; will likely be replaced or repurposed.  
• `src/app/_components/post.tsx` – demo client component showing Suspense + mutation pattern (will be replaced).  
• `src/server/api/routers/post.ts` – simple tRPC router (will be removed in favor of Convex functions).  
These four illustrate the current data-flow pattern we can replicate for chat routes.

## Current Data Flow & Observed Patterns

Current: Server (tRPC procedure) ➜ React Query ➜ Suspense in Client Component.  
Target: Convex Functions ➜ Convex React Hooks ➜ Real-time UI updates.  
Convex provides automatic reactivity and persistence with user-scoped data.

## Reference Implementations / Utilities Found

None yet for chat or migrations. We will introduce:  
• Convex for database, serverless functions, auth integration, and real-time data sync.  
• Vercel AI SDK for model/provider abstraction & streaming.  
• Shadcn‐UI for component scaffolding.

## Potential Challenges, Risks & Considerations

1. **Migration from tRPC to Convex**: Remove existing tRPC setup and replace with Convex functions. This simplifies the stack but requires rewriting the demo `post` functionality as Convex mutations/queries.
2. Streaming chat completions require edge-friendly endpoints or server actions to avoid latency.
3. Auth strategy: **Use Clerk** for authentication (email/passkey/OAuth). Clerk's pre-built components speed up development and integrate with Convex through `convex/react-clerk`.
4. State rehydration after refresh (`cmd+r`) – sidebar collapse state → either keep in localStorage or derive from Convex user prefs.
5. Shadcn integration requires Tailwind variants config; ensure compatibility with Tailwind v4.
6. Bun tooling: ensure Convex, Shadcn CLI, and ai-sdk work smoothly under Bun; some CLIs assume npm/yarn.
7. API keys & multi-provider routing (OpenAI, Groq, etc.) need a secure env strategy using `@t3-oss/env-nextjs`.

No clarifying questions are needed at this stage; the context is sufficiently understood to proceed with planning.

Switch to **agent mode** and type **execute** (or **execute stage 1**) to begin.

## Next Steps & Pages Overview

1. **Routing & Pages**
   • `/` – Landing page (can remain minimal).
   • `/chat/[id]` – Primary chat UI created after the first message (UUID v4).
   • `/login` and `/register` – Provided by Clerk (`<SignIn />`, `<SignUp />`).
   • `/settings` – User customization for UI theme, provider defaults, and AI behaviour.

2. **Chat UI Requirements**
   • Provider/model selector (Anthropic, OpenRouter, Groq, MCP, etc.).
   • File upload (pdf, png, jpg) and web search / MCP tool triggers.
   • Hidden but pre-rendered content sections to improve perceived speed.

3. **State Management**
   • Store local interaction state (sidebar collapse, draft input) in Zustand.
   • Persist conversations and settings in Convex collections.

4. **Incremental Implementation Plan**
   • Stage 1 – Remove tRPC, scaffold Convex + Clerk auth wiring, create basic pages.
   • Stage 2 – Convex schema for conversations/messages/settings.
   • Stage 3 – Integrate Vercel AI SDK streaming + provider factory.
   • Stage 4 – Tooling: uploads, web search, MCP integration.
   • Stage 5 – Polish UI with Shadcn & gradient design, add Suspense loaders.

## Open Items / Decisions Needed

1. **Data-layer decisions**  
   • **Decision made: Convex only.** Remove tRPC entirely and migrate all API logic to Convex functions for consistency and real-time capabilities.  
   • File uploads: **Use UploadThing** (Theo's `uploadthing`) for PDF/image uploads. Configure its server action helpers and React hooks, and record the required env vars.

2. **Environment & Secrets Matrix**  
   | Key | Used By / Stage | Notes |
   | --- | --------------- | ----- |
   | `CLERK_PUBLISHABLE_KEY` | Auth (Stage 1) | Clerk frontend SDK |
   | `CLERK_SECRET_KEY` | Auth (Stage 1) | Backend webhooks / server actions |
   | `CONVEX_URL` | Convex client (Stage 1) | Provided by Convex deployment |
   | `CONVEX_DEPLOY_KEY` | Convex CLI (CI) | Needed for CI migrations |
   | `ANTHROPIC_API_KEY` | AI Provider (Stage 3) | Only if Anthropic enabled |
   | `OPENROUTER_API_KEY` | AI Provider (Stage 3) | |
   | `GROQ_API_KEY` | AI Provider (Stage 3) | |
   | `UPLOADTHING_APP_ID` | Uploads (Stage 4) | UploadThing project ID |
   | `UPLOADTHING_SECRET` | Uploads (Stage 4) | Server-side signature generation |

3. **Component & Folder Skeleton after Stage 1**

```
src/
  app/
    middleware.ts        (authMiddleware from @clerk/nextjs)
    layout.tsx           (wrap with <ClerkProvider> <ConvexProviderWithClerk>)
    chat/
      [id]/
        page.tsx         (RSC wrapper)
        Chat.tsx         (client component)
    settings/
      page.tsx
  components/
    Sidebar.tsx
    ProviderSelector.tsx
    FileDropzone.tsx
+convex/
+  schema.ts            (define conversations, messages, users tables)
+  conversations.ts     (queries and mutations for chat data)
+  auth.config.ts       (Clerk integration)
```

4. **Testing & Quality Gates**  
   • Unit: Vitest for provider-factory logic & Convex function testing.  
   • E2E: Playwright flow – Clerk sign-in ➜ start chat ➜ receive stream.  
   • CI: GitHub Actions job running `bun test`, `convex deploy`, Playwright.

5. **Performance & Ops**  
   • Target Edge runtime for `/api/chat/stream` for lower latency.  
   • Add rate limiting (`@upstash/ratelimit`) to safeguard provider quotas.  
   • Observability: initialise Sentry (or LogRocket) via Next.js instrumentation.

6. **Accessibility & Theming**  
   • Use Radix primitives via Shadcn.  
   • Tailwind v4 `@theme` for dark/light & user colour preferences.  
   • Ensure Sidebar/tab order & chat transcript have proper ARIA roles.

7. **Future-proofing MCP**  
   MCP integration is flagged **Stage 4b** – optional, proceed only if SDK remains stable after prior stages are complete.

## More details

### Tech Stack

- **Frontend**: Next.js 15.3.3, React 19.1, Tailwind CSS 4
- **Backend**: Convex for real-time database and auth
- **AI Integration**: Vercel AI SDK with Groq
- **UI Components**: Shadcn UI
- **Package Manager**: Bun 1.2.16

## Core Features

1. Real-time messaging with Convex
2. AI-powered chat assistance
3. Modern, responsive UI with Shadcn
4. User authentication and profiles
5. Message history and search
6. File sharing and media support

## Implementation Plan

1. **Phase 1: Foundation**

   - Set up Convex database and auth
   - Create basic chat UI components
   - Implement real-time messaging

2. **Phase 2: AI Integration**

   - Add Vercel AI SDK
   - Implement chat completion
   - Add message suggestions

3. **Phase 3: Enhanced Features**

   - File sharing
   - Message search
   - User profiles
   - Message reactions

4. **Phase 4: Polish**
   - Performance optimization
   - UI/UX improvements
   - Testing and bug fixes

## Database Schema
