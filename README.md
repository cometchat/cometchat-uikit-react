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

## Integrate with AI Coding Agents

[CometChat Agent Skills](https://www.cometchat.com/docs/agent-skills) teach your AI coding agent how to build with the CometChat React UI Kit in React 18+ apps built with Vite, Create React App, Next.js, React Router, or Astro. Ask your agent to *"add chat to my app"* and it detects your project setup, walks you through a short plan for your approval, and then writes the integration code directly into your existing app, following the official CometChat guides. The skills work with Claude Code, Cursor, GitHub Copilot, Codex, Windsurf, and other popular coding agents.

Run the installer in your project root (requires Node.js 18+):

```sh
npx @cometchat/skills add
```

The skills are installed for Claude Code by default; pass `--ide <agent>` (for example, `--ide cursor`) to install them for a different agent. Then open your project in your agent and prompt it with *"add chat to my app"*, or run `/cometchat`.

To learn more, visit [CometChat Agent Skills](https://www.cometchat.com/docs/agent-skills).

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

End-to-end tests live in `sample-app/e2e/` and run against the live sample app and a real CometChat app. They cover full user journeys: login, messaging, attachments, reactions, threads, pin & save, groups, calls, search, AI, and more.

#### Prerequisites

##### 1. Create a CometChat App

Create a **new** CometChat app dedicated to E2E testing — the suite creates and deletes `e2e-*` users and groups, so don't point it at an app with real data.

- Go to [CometChat Dashboard](https://app.cometchat.com)
- Note down: **App ID**, **Region**, **Auth Key**, **REST API Key**

##### 2. Enable Extensions & Media Access

In the CometChat Dashboard, enable:

- **Stickers** — and add sticker packs from its settings (the sticker tests need at least one pack)
- **Calling**
- **Conversation & Advanced Search**
- **Polls**
- **Collaborative Document**
- **Collaborative Whiteboard**

Then, under **Chat & Messaging → Settings → General Configuration → Media URL Access**, select **Presigned URLs**.

> **Required** for every attachment flow — `e2e/multi-attachment`, the `e2e/message-composer` attachment tests, and the image test in `e2e/thread-subscription`. Without it the upload tray never resolves and those tests time out.

##### 3. Create the AI Agent Users

In the Dashboard → BYO Agents:

- **AI assistant chat:** UID `ai-agent-e2e` or mention it in `AI_AGENT_UID`, name `AI Agent E2E`, role `@agentic`.
- **Agentic group chat:** two more `@agentic` users; put their UIDs in `GROUP_AGENT_1_UID` / `GROUP_AGENT_2_UID`. The agents must be connected to a backend that **actually replies** — the agentic-group tests wait for a real reply.

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
AI_AGENT_UID=ai-agent-e2e
```

`.env.e2e.example` documents **every** variable the suite reads. The optional ones only enable specific tests:

| Var | Suite |
|-----|-------|
| `E2E_BLOCKED_MIME_TYPE` | multi-attachment (blocked-MIME test) |
| `E2E_PIN_MESSAGES_LIMIT` | pin & save (pin-limit test, see below) |
| `GROUP_AGENT_1_UID`, `GROUP_AGENT_2_UID`, `AGENTIC_GROUP_1_ID`, `AGENTIC_GROUP_2_ID` | agentic group chat |

At the start of every run the suite prints any variable that is missing and which tests it will skip.

##### 5. Install Dependencies and Playwright Browsers

The sample app can run against your **local UI Kit source** (`src/`) instead of the published package, which needs both installs:

```bash
npm ci                       # repo root — the UI Kit's own dependencies
cd sample-app && npm ci      # the sample app
npx playwright install chromium
```

#### Running E2E Tests

**Seed test data (idempotent — safe to re-run):**

```bash
cd sample-app
npm run e2e:seed
```

**Run all E2E tests (headless):**

```bash
UIKIT_LOCAL=1 npm run e2e
```

`UIKIT_LOCAL=1` makes the sample app resolve `@cometchat/chat-uikit-react` from `../src`, so the tests exercise **your local changes**. Without it they run against the published package in `sample-app/node_modules`. On Windows (or to make it permanent) put `UIKIT_LOCAL=1` in `sample-app/.env` instead.

Playwright starts the dev server on `http://localhost:3005` by itself (and reuses one you already have running), so there is no need to start it in a separate terminal. To use another port, set `E2E_PORT` together with a server command for that port (e.g. `E2E_PORT=3006 E2E_WEB_SERVER_COMMAND="npx vite --port 3006 --strictPort"`).

**Run against a production build** — what end users get, and slower to start:

```bash
UIKIT_LOCAL=1 npm run build -- --sourcemap
E2E_WEB_SERVER_COMMAND="npx vite preview --port 3005 --strictPort" npm run e2e
```

**Other modes:**

```bash
npm run e2e:ui                                             # Playwright UI (interactive)
npm run e2e:headed                                         # visible browser
npm run e2e:debug                                          # step through
npx playwright test e2e/conversations/conversations.spec.ts  # one spec file
npx playwright test --grep "pin"                           # tests whose title matches
npx playwright test --grep @smoke                          # the core-flow smoke subset (~10 min)
```

**Accessibility:** `e2e/accessibility/axe.spec.ts` scans the main screens with axe (WCAG 2.0/2.1 A and AA). Violations that exist today are listed per screen in `e2e/accessibility/axe-baseline.json`; the scan fails only on new ones. After fixing a violation, remove its rule from the baseline. To regenerate the baseline from the current app (review the diff before committing): `UPDATE_AXE_BASELINE=1 npx playwright test e2e/accessibility`.

**Lint the suite:** `npm run lint:e2e` (`eslint-plugin-playwright` — prefer web-first assertions such as `await expect(locator).toBeVisible()` over fixed `waitForTimeout` sleeps). `locator.isVisible()` does not wait, so it is a lint error when given a timeout; use `toBeVisible({ timeout })`, or `visibleWithin()` from `e2e/helpers/wait.ts` for an optional element.

**Results:** the HTML report is written to `playwright-report/` (`npx playwright show-report`), a machine-readable summary to `e2e-results/results.json`, and traces/screenshots of failures to `test-results/`.

#### Cleanup

To delete all E2E-created data and reset the app:

```bash
npm run e2e:cleanup
```

#### Test Data Strategy

| Chat / user | Purpose | Modified by Tests? |
|------|---------|-------------------|
| **Alice Johnson** (e2e-user-1) | The logged-in test user | — |
| **Bob Smith** (e2e-user-2) | Static 1:1 — read-only tests; the **participant** in Strategy | ❌ Never |
| **Design Team** (e2e-group-1) | Static group — pagination, group details | ❌ Never |
| **Strategy** (e2e-group-35) | Mutable group — send/edit/delete/thread/reactions/pin | ✅ Yes |
| **CI/CD** (e2e-group-33) | Incoming messages for message-privately / pin-conversation tests | ❌ Never - Unless the tests send incoming messages |
| **Engineering** | Mutable group — the chat the pin-conversation tests pin/unpin | ✅ Yes |
| **Testing** | Secondary mutable group — use for anything (currently the pin-conversation "stays below pinned" test) | ✅ Yes |
| **AI Agent E2E** | AI assistant chat tests | ✅ Yes |
| **Perf User** (perf-user-1) | A stable login for performance measurement; created by the seed, never deleted by cleanup | ❌ Never |
| **Charlie Brown** (e2e-user-3), **Diana Prince** (e2e-user-4) | Caller and callee in the incoming-call tests; members of the agentic groups; Charlie also logs in during the switch-user journey | ✅ Call logs grow — don't assert on their call history |
| Other seeded users (e2e-user-5 … e2e-user-35) and groups (e2e-group-2 … e2e-group-34) | Population for lists, search, pagination and member counts | ❌ Never |
| **AI Solo E2E**, **AI Squad E2E** (e2e-agentic-group-1/2, or `AGENTIC_GROUP_1_ID`/`AGENTIC_GROUP_2_ID`) | Agentic group tests, with the agents in `GROUP_AGENT_1_UID`/`GROUP_AGENT_2_UID` | ✅ Yes |

> **Reserved for generated data** — tests create their own throwaway fixtures with these prefixes and delete them afterwards; `npm run e2e:cleanup` sweeps any a failed run leaves behind. Don't create your own users or groups with them:
> groups `e2e-group-tmp-*` (guid) and `E2E_Test_*` (name), users `e2e-user-tmp-*` and `e2e-user-journey-*` (uid).

> **Engineering & Testing groups** — create two public groups named **exactly `Engineering`** and **exactly `Testing`** (any guids). Add `e2e-user-1` to **Engineering** (the tests send it a message as `e2e-user-1` to bring it into the list, then pin it) and `e2e-user-2` to **Testing** (used to send an incoming). The suite resolves both by name at runtime, so no guids go in env. Treat `Testing` as a free secondary group for future tests.

#### Pin & Save prerequisites

The pin/save suites (`e2e/pin-messages`, `e2e/save-messages`, and the "Pin conversation" block in `e2e/conversations`) need these on the E2E app:

- **Enable** in the dashboard: `features.ux.messages.pinned.enabled`, `features.ux.messages.saved.enabled`, `features.ux.conversations.pinned.enabled`.
- **Pin-message limit:** set `features.ux.messages.pinned.limit` to **5** and `E2E_PIN_MESSAGES_LIMIT=5` — the limit test only runs at that cap.
- **Strategy roles:** `e2e-user-1` is owner/admin; `e2e-user-2` is a **participant**. The UI Kit shows Pin/Unpin to *every* member and the **server** enforces who may act.
- **Participant permissions:** keep the **default** scope permissions for the **participant** role — **pin denied, unpin denied, pinned-messages listing allowed**. The permission tests exercise those denials live against the server. A denied *listing* can't coexist with them, so those tests simulate the server's permission error for the pinned-list request instead — no extra dashboard setup or env flags.
- Each test **clears its own pinned/saved state over REST first**, so the low pin/save caps never leak between tests. Conversation-pin tests **system-pin Strategy** and pin **only** the Engineering chat (Bob stays a read-only fixture).

#### Moderation prerequisites

`e2e/message-actions/moderation.spec.ts` reports a message and checks that the profanity filter blocks one. Both need the **Moderation** feature on the E2E app, with **profanity filtering** turned on; without them those two tests skip with the reason. They act only on throwaway users and groups.

#### Thread subscription prerequisites

`e2e/thread-subscription` needs no dashboard flag of its own, but:

- **Stickers** (with a sticker pack) and **Polls** must be enabled (step 2) — the "auto-subscribe by message type" tests send one of each.
- **Presigned URLs** must be on (step 2) — one test sends an image.
- Runs against **Strategy** (group cases) and the **Bob Smith** 1:1 — thread subscription is offered in 1:1 as well as groups, so the 1:1 case asserts the option *is* present.

#### Optional fixtures — multi-attachment error states

Two tests in `e2e/multi-attachment/multi-attachment.spec.ts` exercise the composer's
**rejected** (non-retryable) upload states. They need inputs that are impractical to
commit (a huge file) or that depend on dashboard config, so they **skip themselves
unless you add a matching fixture** to `e2e/fixtures/`. The lookup is by name prefix,
so the extension is up to you (within the limits noted below).

**1. File size exceeded — `e2e-oversize.*`**

Any single file larger than 100 MB (any extension) in `e2e/fixtures/`. You can generate one with:

```bash
# from sample-app/
head -c 150000000 /dev/urandom > e2e/fixtures/e2e-oversize.txt   # ~150 MB
```

**2. File type not supported — `e2e-blocked-mime.*` + `E2E_BLOCKED_MIME_TYPE`**

This test needs **both** of the following — if either is missing it is skipped:

- **A fixture** named `e2e-blocked-mime.*` in `e2e/fixtures/`. Its extension must **not**
  be `png`, `mp4`, `mp3`, or `pdf` (so it can't collide with the standard fixtures). The
  file's bytes are what get uploaded; the extension itself doesn't matter beyond that.
- **`E2E_BLOCKED_MIME_TYPE`** in `.env.e2e`, set to the exact MIME type you denied in the
  dashboard (e.g. `E2E_BLOCKED_MIME_TYPE=image/svg+xml`). The test attaches this MIME to
  the upload explicitly. This is required because Playwright can't infer a MIME for exotic
  extensions and would send an empty one — the server then rejects with
  `mimeType is required` (a *retryable* failure) instead of the permission-denied
  *rejected* state the test asserts. There is no fallback: the MIME must come from this
  env var and must match what you denied.

**Where to set the restriction:** on the **Strategy group → Scope permissions → Admin**
role. The E2E suite runs against the Strategy group and the e2e user `e2e-user-1` is normally an
admin/owner there, so blocking the MIME type for the Admin scope reliably applies to the
uploads under test.

#### Quick Start

```bash
npm ci                              # repo root
cd sample-app && npm ci
cp .env.e2e.example .env.e2e        # fill in credentials
npx playwright install chromium     # once
npm run e2e:seed                    # seed test data
UIKIT_LOCAL=1 npm run e2e           # run against your local UI Kit source
```

## Help and Support

For issues running the project or integrating with our UI Kits, consult our [documentation](https://www.cometchat.com/docs/ui-kit/react/integration-react) or create a [support ticket](https://help.cometchat.com/hc/en-us) or seek real-time support via the [CometChat Dashboard](https://app.cometchat.com/).

---