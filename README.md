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

##### 2. Enable Extensions & Media Access

In the CometChat Dashboard, enable:

- **Stickers** (also add sticker packs from settings)
- **Calling**
- **Conversation & Advanced Search**
- **Polls**
- **Collaborative Document**
- **Collaborative Whiteboard**

Then, under **Chat & Messaging → Settings → General Configuration → Media URL Access**, select **Presigned URLs** 

> **Required** for every attachment flow — `e2e/multi-attachment`, the `e2e/message-composer` attachment tests, and the image test in `e2e/thread-subscription`. Without it the upload tray never resolves and those tests time out.

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
AI_AGENT_UID=ai-agent-e2e
```

`.env.e2e.example` is the full reference — it also carries the optional per-suite flags below, each of which **self-skips its tests when left blank**:

| Var | Suite |
|-----|-------|
| `E2E_BLOCKED_MIME_TYPE` | multi-attachment (blocked-MIME test) |
| `E2E_PIN_MESSAGES_LIMIT`, `E2E_PARTICIPANT_PIN_DENIED`, `E2E_PARTICIPANT_UNPIN_DENIED`, `E2E_PARTICIPANT_PIN_LISTING_DENIED` | pin & save (see below) |
| `GROUP_AGENT_1_UID`, `GROUP_AGENT_2_UID`, `AGENTIC_GROUP_1_ID`, `AGENTIC_GROUP_2_ID` | agentic group chat |

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
| **CI/CD** (e2e-group-33) | Incoming messages for message-privately / pin-conversation tests | ❌ Never - Unless the tests send incoming messages |
| **Engineering** | Mutable group — the chat the pin-conversation tests pin/unpin | ✅ Yes |
| **Testing** | Secondary mutable group — use for anything (currently the pin-conversation "stays below pinned" test) | ✅ Yes |
| **AI Agent E2E** | AI assistant chat tests | ✅ Yes |

> **Engineering & Testing groups** — create two public groups named **exactly `Engineering`** and **exactly `Testing`** (any guids). Add `e2e-user-1` to **Engineering** (the tests send it a message as `e2e-user-1` to bring it into the list, then pin it) and `e2e-user-2` to **Testing** (used to send an incoming). The suite resolves both by name at runtime, so no guids go in env. Treat `Testing` as a free secondary group for future tests.

#### Pin & Save prerequisites

The pin/save suites (`e2e/pin-messages`, `e2e/save-messages`, and the "Pin conversation" block in `e2e/conversations`) need these enabled on the E2E app:

- **Enable** in the dashboard: `features.ux.messages.pinned.enabled`, `features.ux.messages.saved.enabled`, `features.ux.conversations.pinned.enabled`.
- **Strategy roles**: `e2e-user-1` is owner/admin; `e2e-user-2` is a **participant**. The UI Kit shows Pin/Unpin to *every* member and the **server** enforces who may act — so the permission test asserts the participant *is* offered *Pin message* (the deny surfaces as a toast, covered below).
- **Pin-message limit test** self-skips unless `E2E_PIN_MESSAGES_LIMIT=5` (it's only meaningful at a small cap). Set it to your `features.ux.messages.pinned.limit`.
- **Pin-permission deny tests** (denied pin / denied unpin / denied pinned-listing) each self-skip until you both (a) apply the matching **deny to the participant scope** in the Strategy group and (b) set the flag. Apply these in the dashboard **after seeding** — they act on the Strategy group, so it must already exist:
  - Deny the **participant** scope *pin* → set `E2E_PARTICIPANT_PIN_DENIED=1`.
  - Deny the **participant** scope *unpin* → set `E2E_PARTICIPANT_UNPIN_DENIED=1`.
  - Deny the **participant** scope *pinned-messages listing* → set `E2E_PARTICIPANT_PIN_LISTING_DENIED=1`.

  Leave a flag blank to skip its test. (The deny lives in dashboard config, not seeding, so an un-configured app would let the action through and the test would fail for the wrong reason — hence the self-skip.)
  There are also three **permutation** tests that need a specific *mix* of allowed/denied — a denied listing must not append a realtime pin (**pin allowed, listing denied**); a denied pin must not reach the list (**pin denied, listing allowed**); a denied unpin keeps the message listed (**unpin denied, pin & listing allowed**). Because they need different mixes, the full permission matrix spans more than one env/dashboard configuration — run them in separate passes.
- Each test **clears its own pinned/saved state over REST first**, so the low pin/save caps never leak between tests. Conversation-pin tests **system-pin Strategy** and pin **only** the Engineering chat (Bob stays a read-only fixture).

#### Thread subscription prerequisites

`e2e/thread-subscription` needs no dashboard flag of its own, but:

- **Stickers** and **Polls** extensions must be enabled (step 2) — the "auto-subscribe by message type" tests send one of each.
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
role. The E2E suite runs against the Strategy group and the e2e user `e2e-user-` is normally an
admin/owner there, so blocking the MIME type for the Admin scope reliably applies to the
uploads under test.

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