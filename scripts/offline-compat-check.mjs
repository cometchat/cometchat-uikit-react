/**
 * Offline support compatibility gates (offline TEST-PLAN §6, UIT-OFF-05/07):
 *
 *   node scripts/offline-compat-check.mjs --baseline <old dist/index.d.ts> [--sdk <SDK package dir>]
 *
 * Run after `npx tsup`. It checks that:
 *  1. API: every export of the baseline declaration file is still exported
 *     (additions only), and the new declarations name no SDK-4.3-only type;
 *  2. with --sdk (e.g. an unpacked @cometchat/chat-sdk-javascript 4.2.x): a
 *     consumer project with skipLibCheck false, compiled against that SDK's
 *     typings and this kit's dist/index.d.ts, type-checks (the peer floor
 *     stays ^4.2.0, README §3.1, Q5).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const arg = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
let failed = false;
const fail = message => {
  console.error(`✗ ${message}`);
  failed = true;
};

function exportsOf(path) {
  const text = readFileSync(path, 'utf8');
  const names = new Set();
  for (const block of text.matchAll(/^export \{([^}]*)\};/gm)) {
    for (const raw of block[1].split(',')) {
      const name = raw.trim().replace(/^type /, '');
      if (name) names.add(name);
    }
  }
  return { names, text };
}

const current = exportsOf(join(root, 'dist/index.d.ts'));
const baselinePath = arg('--baseline');
if (baselinePath) {
  const baseline = exportsOf(resolve(baselinePath));
  const removed = [...baseline.names].filter(n => !current.names.has(n));
  if (removed.length) fail(`exports removed: ${removed.join(', ')}`);
  const added = [...current.names].filter(n => !baseline.names.has(n));
  console.log(`API: ${String(added.length)} exports added (${added.join(', ') || 'none'}), none removed`);
}
const sdk43Only = [
  'OfflineConfig',
  'OfflineMessageListener',
  'SyncListener',
  'MessageSentListener',
  'MessageFetchListener',
  'ConversationFetchListener',
  'ConversationDetailsListener',
  'OfflineCacheResetListener',
  'MediaDownloadListener',
  'MessageFailureReason',
  'UploadFileStatus',
  'UploadFileInfo',
];
const named = sdk43Only.filter(t => new RegExp(`CometChat\\.${t}\\b`).test(current.text));
if (named.length) fail(`public declarations name SDK-4.3-only types: ${named.join(', ')}`);
else console.log('API: no SDK-4.3-only type in the public declarations');

const sdkDir = arg('--sdk');
if (sdkDir) {
  const dir = mkdtempSync(join(tmpdir(), 'cc-consumer-'));
  try {
    const nm = join(dir, 'node_modules');
    mkdirSync(join(nm, '@cometchat', 'chat-uikit-react'), { recursive: true });
    mkdirSync(join(nm, '@types'), { recursive: true });
    symlinkSync(resolve(sdkDir), join(nm, '@cometchat', 'chat-sdk-javascript'));
    writeFileSync(
      join(nm, '@cometchat', 'chat-uikit-react', 'package.json'),
      readFileSync(join(root, 'package.json'))
    );
    // A copy of the declarations, so they resolve the SDK from the fixture, not the repo.
    mkdirSync(join(nm, '@cometchat', 'chat-uikit-react', 'dist'));
    writeFileSync(join(nm, '@cometchat', 'chat-uikit-react', 'dist', 'index.d.ts'), current.text);
    for (const p of ['react', 'react-dom', 'dompurify', 'csstype']) {
      if (existsSync(join(root, 'node_modules', p))) symlinkSync(join(root, 'node_modules', p), join(nm, p));
    }
    for (const p of ['react', 'react-dom']) {
      symlinkSync(join(root, 'node_modules', '@types', p), join(nm, '@types', p));
    }
    for (const p of ['cards-react', 'calls-sdk-javascript']) {
      const from = join(root, 'node_modules', '@cometchat', p);
      if (existsSync(from)) symlinkSync(from, join(nm, '@cometchat', p));
    }
    writeFileSync(
      join(dir, 'consumer.tsx'),
      `import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit, UIKitSettingsBuilder, CometChatMessageList, CometChatConversations,
  useCometChatEvents, type CometChatEvent, type CometChatOfflineConfig } from '@cometchat/chat-uikit-react';
const config: CometChatOfflineConfig = { enabled: true, maxPendingMessages: 50 };
void CometChatUIKit.init(new UIKitSettingsBuilder().setAppId('a').setRegion('us').setAuthKey('k').setOfflineConfig(config).build());
void CometChatUIKit.sendTextMessage(new CometChat.TextMessage('u', 'hi', CometChat.RECEIVER_TYPE.USER));
export function Screen(props: { user: CometChat.User }) {
  useCometChatEvents((event: CometChatEvent) => { void event.type; }, []);
  return (<><CometChatConversations hideOfflineNotices /><CometChatMessageList user={props.user} hideOfflineNotices /></>);
}
`
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          jsx: 'react-jsx',
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          noEmit: true,
          esModuleInterop: true,
        },
        files: ['consumer.tsx'],
      })
    );
    const sdkVersion = JSON.parse(readFileSync(join(resolve(sdkDir), 'package.json'), 'utf8')).version;
    try {
      execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', join(dir, 'tsconfig.json')], {
        stdio: 'pipe',
      });
      console.log(`Consumer: compiles against SDK ${sdkVersion} typings with skipLibCheck false`);
    } catch (error) {
      fail(`consumer does not compile against SDK ${sdkVersion}:\n${String(error.stdout ?? error)}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

process.exit(failed ? 1 : 0);
