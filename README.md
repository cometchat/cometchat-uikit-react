<p align="center">
  <img alt="CometChat" src="https://assets.cometchat.io/website/images/logos/banner.png">
</p>

# CometChat UI Kit for React

The CometChat React UI Kit provides pre-built, customizable UI components that developers can use to quickly integrate real-time messaging and calling into any React application.

<div style="display: flex; align-items: center; justify-content: center;">
   <img src="./screenshots/sample_app_overview.png" />
</div>

## 🚀 Explore the Sample App

Check out the [Sample App](https://github.com/cometchat/cometchat-uikit-react/blob/v7/sample-app/README.md) to see the UI Kit in action with a fully functional chat experience including conversations, messaging, calling, and AI features.

## Prerequisites

- Node.js >= 18
- npm >= 9
- React >= 18

## Getting Started

1. Register at the [CometChat Dashboard](https://app.cometchat.com/) to create an account.
2. Create a new app to get your _App ID_, _Region_, and _Auth Key_.

## Installation

```sh
npm install @cometchat/chat-uikit-react
```

## Features

- **Conversations** — List and manage one-on-one and group chats
- **Messages** — Rich message list with reactions, threads, and read receipts
- **Calling** — Voice and video calling with call logs
- **AI Features** — AI-powered assistant chat and smart replies
- **Theming** — CSS custom properties for full visual customization
- **Localization** — Built-in multi-language support

## Testing

The project has three test suites: **unit tests** (Vitest), **E2E tests** (Playwright), and **Storybook**.

### Unit Tests (Vitest)

Unit tests live alongside the source files as `*.spec.ts` / `*.spec.tsx` and cover individual components, hooks, and utilities.

**Run all unit tests (single pass):**

```sh
npm test
```

**Run with coverage:**

```sh
npm run test:coverage
```

No browser or running server is required.

---

### Storybook

Storybook provides an interactive development environment for building and testing components in isolation.

**Start Storybook (dev mode):**

```sh
npm run storybook
```

Opens at `http://localhost:6006`.

**Build static Storybook:**

```sh
npm run build-storybook
```

---

### E2E Tests (Playwright)

End-to-end tests live in `sample-app/e2e/` and run against the live sample app. They cover full user journeys: login, messaging, reactions, threads, groups, calls, search, and more.

#### Prerequisites

##### 1. Create a CometChat App

Create a **new** CometChat app (or use an existing one dedicated to E2E testing).

- Go to [CometChat Dashboard](https://app.cometchat.com)
- Note down: **App ID**, **Region**, **Auth Key**, **REST API Key**

##### 2. Enable Extensions

In the CometChat Dashboard, enable:

- **Stickers** (also add sticker packs from settings)
- **Calling**
- **Conversation & Advanced Search**
- **Polls**
- **Collaborative Document**
- **Collaborative Whiteboard**

##### 3. Create AI Agent User

In the Dashboard → BYO Agents:

- **UID**: `ai-agent-e2e`
- **Name**: `AI Agent E2E`
- **Role**: `@agentic`

##### 4. Configure Environment

```bash
cd sample-app
cp .env.e2e.example .env.e2e
```

Fill in `.env.e2e`:
```env
COMETCHAT_APP_ID=your-app-id
COMETCHAT_REGION=us
COMETCHAT_AUTH_KEY=your-auth-key
COMETCHAT_API_KEY=your-rest-api-key
E2E_USER_UID=e2e-user-1
AI_AGENT_UID=ai-agent-e2e
```

##### 5. Install Playwright Browsers

```bash
npx playwright install
```

#### Running E2E Tests

**Seed test data (one-time, idempotent):**

```bash
cd sample-app
npm run e2e:seed
```

**Start dev server (keep running in separate terminal):**

```bash
npm run dev
```

**Run all E2E tests (headless):**

```bash
npm run e2e
```

**Run with Playwright UI (interactive):**

```bash
npm run e2e:ui
```

**Run headed (visible browser):**

```bash
npm run e2e:headed
```

**Run in debug mode:**

```bash
npm run e2e:debug
```

**Run a specific test file:**

```bash
npx playwright test e2e/conversations/conversations.spec.ts
```

#### Cleanup

To delete all E2E-created data and reset the app:

```bash
npm run e2e:cleanup
```

#### Test Data Strategy

| Chat | Purpose | Modified by Tests? |
|------|---------|-------------------|
| **Bob Smith** (e2e-user-2) | Static 1:1 — read-only tests | ❌ Never |
| **Design Team** (e2e-group-1) | Static group — pagination, group details | ❌ Never |
| **Strategy** (e2e-group-35) | Mutable group — send/edit/delete/thread/reactions | ✅ Yes |
| **CI/CD** (e2e-group-33) | Incoming messages for message-privately tests | ❌ Never |
| **AI Agent E2E** | AI assistant chat tests | ✅ Yes |

#### Quick Start

```bash
cd sample-app
cp .env.e2e.example .env.e2e    # Fill in credentials
npx playwright install           # Install browsers (once)
npm run e2e:seed                 # Seed test data (once)
npm run dev                      # Start dev server
npm run e2e                      # Run tests
```

## Help and Support

For issues running the project or integrating with our UI Kits, consult our [documentation](https://www.cometchat.com/docs/ui-kit/react/integration-react) or create a [support ticket](https://help.cometchat.com/hc/en-us) or seek real-time support via the [CometChat Dashboard](https://app.cometchat.com/).

---