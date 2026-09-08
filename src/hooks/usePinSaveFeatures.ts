import { useEffect, useState } from 'react';
import {
  getPinSaveFeatures,
  resolvePinSaveFeatures,
  PIN_SAVE_FEATURES_DISABLED,
  type PinSaveFeatures,
} from '../utils/pinSaveFeatures';

/**
 * usePinSaveFeatures — whether Pin Message / Save Message are enabled for this app.
 *
 * Returns everything-off on first render and re-renders once the SDK resolves, so
 * gating on it never flashes an option that then disappears. Resolution is cached
 * process-wide, so mounting this in many components costs one SDK call in total.
 */
export function usePinSaveFeatures(): PinSaveFeatures {
  const [features, setFeatures] = useState<PinSaveFeatures>(() => getPinSaveFeatures());

  useEffect(() => {
    // Already resolved (usually — CometChatUIKit.init warms it): nothing to await.
    // This matters because the hook runs once per message bubble.
    if (getPinSaveFeatures() !== PIN_SAVE_FEATURES_DISABLED) return;

    let cancelled = false;
    void resolvePinSaveFeatures().then(resolved => {
      if (!cancelled) setFeatures(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return features;
}
