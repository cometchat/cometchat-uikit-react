# [7.0.0]

## New

- **CometChatProvider integration** — The app now wraps all authenticated views in a single `<CometChatProvider>` component that handles SDK initialization, calling setup, AI plugins, theming, and locale in one declarative boundary. Replaces the v6 pattern of manual `CometChatUIKit.init()` in the entry point.
- **End-to-end (E2E) test suite** — Added a full Playwright-based E2E test suite covering several feature areas (conversations, messages, reactions, threads, search, groups, calls, AI assistant, and more) with automated seed/cleanup scripts for test data lifecycle management.
- **AI Assistant Chat support** — Lazy-loads `CometChatAIAssistantChat` when an `@agentic` user is selected, matching the v6 behavior with a code-split approach for smaller initial bundle.
- **CometChatNewChat component** — New "Start Chat" flow for initiating conversations with existing users or groups without requiring a pre-existing conversation.

## Enhancements

- **React 19 + Vite** — Upgraded from React 18 + Create React App (v6) to React 19 + Vite 6. Faster dev server startup, HMR, and builds.
- **Removed react-router-dom dependency** — Routing eliminated entirely. The app uses conditional rendering based on state (credentials → login → home), removing the `react-router-dom` dependency and simplifying the navigation model.
- **Simplified component architecture** — Decomposed the monolithic `CometChatHome` into focused, single-purpose components:
  - `CometChatSelector` — sidebar with conversations/users/groups lists
  - `CometChatTabs` — tab bar (Chats, Calls, Users, Groups)
  - `CometChatMessages` — message header + list + composer composition
  - `CometChatSideComponent` — user/group details panel
  - `CometChatThreadPanel` — threaded message view
  - `CometChatNewChatView` — start new chat flow
  - `CometChatCallLogDetails` — call log detail view
- **Event-driven chat navigation** — Uses `useCometChatEvents` to listen for `ui:open-chat` events (e.g., from "Message Privately" in group details) and navigates to the appropriate conversation.

## Fixes

- None