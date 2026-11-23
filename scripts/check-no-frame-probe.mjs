/**
 * Fails the build when the offline state-contract frame probe reached the
 * published bundle (offline TEST-PLAN §3.3, §6 "No probe in published builds").
 * tsup defines __CC_FRAME_PROBE__ as false, so the probe and every reference to
 * the page's __ccFrameProbe global must be gone from dist/.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const offenders = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(c?js|mjs)$/.test(name)) {
      const text = readFileSync(path, 'utf8');
      if (text.includes('__ccFrameProbe') || text.includes('__CC_FRAME_PROBE__')) offenders.push(path);
    }
  }
}
walk(dist);
if (offenders.length > 0) {
  console.error(`Frame probe found in the published bundle:\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log('check-no-frame-probe: dist/ has no frame probe');
