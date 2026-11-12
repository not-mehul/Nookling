// A small buzz on boops, chomps and cuddles, when Settings allows it.
// Android only; the web build stays still.

import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from './output';

let enabled = true;

export function setHaptics(on: boolean): void {
  enabled = on;
}

export function buzz(kind: 'light' | 'medium' | 'tick' = 'light'): void {
  if (!enabled || !isNative) return;
  const task = kind === 'tick' ? Haptics.selectionChanged() : Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  void task.catch(() => undefined);
}
