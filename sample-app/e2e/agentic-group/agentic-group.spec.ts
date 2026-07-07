import { test, expect, Page } from '@playwright/test';
import {
  loginToApp,
  getAgenticConfig,
  openGroupByName,
  sendComposerMessage,
  sendMentionMessage,
  getUserName,
  waitForAgentReply,
  expectNoAgentReply,
  AGENT_BUBBLE,
  type AgenticConfig,
} from '../helpers';

/**
 * E2E Tests — Agentic Group Chat (ENG-36495)
 *
 * Covers AI agents responding inside group conversations:
 *   - Group 1 (solo):  1 human + 1 agent — agent replies to a plain message.
 *   - Group 2 (squad): 3 humans + 2 agents — agent replies only when @mentioned.
 *
 * Groups are provisioned by global-setup (helpers/seed.ts → ensureAgenticGroups).
 * The whole suite is skipped unless GROUP_AGENT_1_UID / GROUP_AGENT_2_UID are set.
 *
 * Agent replies render as `assistant`-type bubbles in the normal message list:
 *   src/plugins/ai/CometChatAIPlugin.ts → CometChatAIAssistantBubble
 */

const cfg: AgenticConfig = getAgenticConfig();

test.describe('Agentic Group Chat', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    test.skip(
      !cfg.enabled,
      'GROUP_AGENT_1_UID / GROUP_AGENT_2_UID not set — see .env.e2e.example'
    );
    page = p;
    await loginToApp(page, cfg.loginUid);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
  });

  // ==================== Group 1 — Solo (no @mention needed) ====================

  test('solo group: plain message triggers a real-time agent reply', async () => {
    test.setTimeout(180_000);
    await openGroupByName(page, cfg.group1Name);

    await sendComposerMessage(page, `What is CometChat? [${Date.now()}]`);

    // Outgoing bubble appears immediately.
    await expect(
      page.locator('.cometchat-message-bubble__wrapper--outgoing').last()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for the agent's reply (no @mention used). Fails if none within 120s.
    await waitForAgentReply(page);
  });

  test('solo group: agent bubble suppresses the inline copy button', async () => {
    test.setTimeout(180_000);
    await openGroupByName(page, cfg.group1Name);

    // This checks a UI property of agent bubbles, not real-time delivery — so
    // reuse an existing reply from history (the solo group accumulates them)
    // rather than invoking the agent again. Wait for lazy-loaded bubbles to mount;
    // only trigger a fresh reply if the group has none yet.
    const hasHistory = await page
      .locator(AGENT_BUBBLE)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (!hasHistory) {
      await sendComposerMessage(page, `What is CometChat? [${Date.now()}]`);
      await waitForAgentReply(page);
    }

    // In groups the inline copy button is suppressed (showCopyButton=false);
    // copy is offered via the context menu instead (ENG-36495).
    const agentBubble = page.locator(AGENT_BUBBLE).last();
    await expect(agentBubble).toBeVisible();
    await expect(
      agentBubble.locator('.cometchat-ai-assistant-bubble__copy')
    ).toHaveCount(0);
  });

  // ==================== Conversations sidebar — real-time update ====================

  test('solo group: last conversation updates in the Chats sidebar after an agent reply', async () => {
    test.setTimeout(180_000);
    await openGroupByName(page, cfg.group1Name);

    await sendComposerMessage(page, `Sidebar update check [${Date.now()}]`);
    await waitForAgentReply(page);

    // Switch to the Chats tab and verify the group bubbled to the top with a
    // non-empty preview (the conversation list reflects the latest message).
    const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats")').first();
    await chatsTab.click();
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    const topItem = page.locator('.cometchat-conversations__item').first();
    await expect(topItem).toContainText(cfg.group1Name, { timeout: 10_000 });

    const subtitle = topItem.locator('.cometchat-conversations__subtitle, [class*="subtitle"]').first();
    await expect(subtitle).toBeVisible({ timeout: 5_000 });
    const subtitleText = await subtitle.textContent();
    expect(subtitleText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  // ==================== Group 2 — Squad (@mention required) ====================

  test('squad group: a plain message does NOT trigger an agent reply', async () => {
    test.setTimeout(60_000);
    await openGroupByName(page, cfg.group2Name);

    await sendComposerMessage(page, `Just chatting, no mention [${Date.now()}]`);

    // Outgoing message lands...
    await expect(
      page.locator('.cometchat-message-bubble__wrapper--outgoing').last()
    ).toBeVisible({ timeout: 15_000 });

    // ...but with 2 agents in the group, none should reply without an @mention.
    // Wait 30s — if an agent replies the last message becomes its bubble (fail).
    await expectNoAgentReply(page, 30_000);
  });

  test('squad group: @mentioning an agent triggers its reply', async () => {
    test.setTimeout(180_000);
    const agentName = await getUserName(cfg.agent1Uid);
    test.skip(!agentName, `Agent user "${cfg.agent1Uid}" not found in app`);

    await openGroupByName(page, cfg.group2Name);

    await sendMentionMessage(page, agentName!, ` are you there? [${Date.now()}]`);

    await expect(
      page.locator('.cometchat-message-bubble__wrapper--outgoing').last()
    ).toBeVisible({ timeout: 15_000 });

    // The @mentioned agent replies. Fails if none within 120s.
    await waitForAgentReply(page);
  });
});
