import { test, expect } from '@playwright/test';

test.describe('CometChatCreatePoll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcreatepoll--default&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
  });

  test('renders the create poll form', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Create Poll');
  });

  test('has question input and two option inputs', async ({ page }) => {
    const questionInput = page.locator('input[placeholder="Ask a question"]');
    await expect(questionInput).toBeVisible();
    const optionInputs = page.locator('input[placeholder="Answer"]');
    await expect(optionInputs).toHaveCount(2);
  });

  test('can type a question', async ({ page }) => {
    const questionInput = page.locator('input[placeholder="Ask a question"]');
    await questionInput.fill('What is your favorite color?');
    await expect(questionInput).toHaveValue('What is your favorite color?');
  });

  test('can add an option', async ({ page }) => {
    const addButton = page.getByText('+ Add another answer');
    await addButton.click();
    const optionInputs = page.locator('input[placeholder="Answer"]');
    await expect(optionInputs).toHaveCount(3);
  });

  test('can remove a third option', async ({ page }) => {
    // Add a third option first
    const addButton = page.getByText('+ Add another answer');
    await addButton.click();
    await expect(page.locator('input[placeholder="Answer"]')).toHaveCount(3);

    // Remove it
    const removeButton = page.locator('[aria-label="Remove option 3"]');
    await removeButton.click();
    await expect(page.locator('input[placeholder="Answer"]')).toHaveCount(2);
  });

  test('create button is disabled when form is incomplete', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeDisabled();
  });

  test('create button enables when question and 2+ options filled', async ({ page }) => {
    await page.locator('input[placeholder="Ask a question"]').fill('Favorite color?');
    const optionInputs = page.locator('input[placeholder="Answer"]');
    await optionInputs.nth(0).fill('Red');
    await optionInputs.nth(1).fill('Blue');

    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeEnabled();
  });

  test.describe('Keyboard navigation', () => {
    test('Escape key closes the dialog in modal story', async ({ page }) => {
      await page.goto('/iframe.html?id=extension-plugins-cometchatcreatepoll--in-modal&viewMode=story');
      await page.waitForSelector('[role="dialog"]');
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });

    test('question input is focusable via click', async ({ page }) => {
      const questionInput = page.locator('input[placeholder="Ask a question"]');
      await questionInput.click();
      await expect(questionInput).toBeFocused();
    });

    test('can navigate between inputs with Tab', async ({ page }) => {
      const questionInput = page.locator('input[placeholder="Ask a question"]');
      await questionInput.click();
      await page.keyboard.press('Tab');
      // Focus should move to the first option input
      const firstOption = page.locator('input[placeholder="Answer"]').first();
      await expect(firstOption).toBeFocused();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcreatepoll--dark-theme&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcreatepoll--rtl&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });
});
