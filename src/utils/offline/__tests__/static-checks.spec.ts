/**
 * Static checks of the offline plan (TEST-PLAN §6), run on every commit over
 * the kit's source (tests and test doubles excluded):
 * - the gate has one call site, and nothing stores its answer;
 * - no connectivity API gates an offline decision;
 * - every offline SDK member is reached feature-detected (never `CometChat.x`);
 * - the kit never calls what the SDK owns (flush, clear cache, retry-all) and
 *   never the non-existent `deletePendingMessage`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..', '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === '__tests__' || name === 'testing' || name === 'node_modules') continue;
      out.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(name) && !/\.(spec|test|stories)\.tsx?$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

const files = sourceFiles(SRC).map(path => ({
  path: relative(SRC, path),
  // Comments may name anything; only code counts.
  code: readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1'),
}));

function offenders(pattern: RegExp, allowed: string[] = []): string[] {
  return files.filter(f => pattern.test(f.code) && !allowed.includes(f.path)).map(f => f.path);
}

describe('offline static checks (TEST-PLAN §6)', () => {
  it('sees the kit source', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('the gate has one call site: isOfflineEnabled() only in utils/offline/gate.ts', () => {
    expect(offenders(/isOfflineEnabled\s*\(/, ['utils/offline/gate.ts'])).toEqual([]);
  });

  it('no stored gate: its answer is never kept in state, a ref, a memo or a module value', () => {
    expect(
      offenders(
        /use(State|Ref|Memo)\(\s*(\(\)\s*=>\s*)?isOfflineOn\(|^(export )?(const|let) \w+\s*=\s*isOfflineOn\(\)/m
      )
    ).toEqual([]);
  });

  it('no connectivity gate (navigator.onLine, online/offline window events)', () => {
    // The AI stream bubble's network watch predates offline support and gates
    // no offline decision (it is in dev-v7 as is).
    expect(
      offenders(/navigator\.onLine|addEventListener\(\s*['"](online|offline)['"]/, [
        'components/CometChatAIAssistantChat/CometChatStreamMessageBubble.tsx',
      ])
    ).toEqual([]);
  });

  it('every offline SDK member is reached feature-detected, never as CometChat.<member>', () => {
    const members = [
      'isOfflineEnabled',
      'addOfflineMessageListener',
      'addSyncListener',
      'addOfflineCacheResetListener',
      'addMediaDownloadListener',
      'retryMessage',
      'discardLocalMessage',
      'getCachedMediaObjectURL',
      'getCachedMediaPath',
      'downloadMedia',
      'getMediaCachingMode',
      'getExistingUploadFileRequest',
      'getPendingMessages',
      'forceSyncNow',
    ];
    expect(offenders(new RegExp(`CometChat\\.(${members.join('|')})\\b`))).toEqual([]);
  });

  it('never calls what the SDK owns, nor the non-existent deletePendingMessage', () => {
    expect(
      offenders(/\b(clearOfflineCache|retryAllFailedMessages|forceSyncNow|deletePendingMessage)\b/)
    ).toEqual([]);
  });
});
