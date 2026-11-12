// Navigation and transient UI state shared between components.

import type { Food } from '../domain/foods';
import type { NooklingLink } from '../platform/incoming';

export type Tab = 'nook' | 'pantry' | 'journal' | 'settings';
export type ToastKind = 'success' | 'error' | 'info' | 'celebrate';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  message: string;
  kind: ToastKind;
  key: number;
  action?: ToastAction;
  /** Fading out. */
  leaving?: boolean;
}

/** How long a toast stays (style.md §8.12): longer when it offers an action. */
export const TOAST_MS = 4000;
export const TOAST_ACTION_MS = 6000;
/** --dur-exit */
const TOAST_EXIT_MS = 160;

class UiState {
  tab = $state<Tab>('nook');
  /** A food given from the Pantry, for the Nook to feed once it is showing. */
  pendingFood = $state.raw<Food | null>(null);
  /** A dish or a book from a sibling app, waiting for a yes in the Nook. */
  incoming = $state.raw<Exclude<NooklingLink, { kind: 'open' }> | null>(null);
  toast = $state.raw<Toast | null>(null);
  /** An easter egg for the Nook to act out: the Konami code, or a sneeze from the title. */
  trick = $state.raw<{ kind: 'konami' | 'sneeze'; n: number } | null>(null);
  /** Overlays (dialogs, sheets) register here so the Android back button can close them. */
  private closers: (() => void)[] = [];
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private toastKey = 0;

  /** Shows one toast, replacing any current one. */
  notify(message: string, kind: ToastKind = 'info', action?: ToastAction): void {
    this.toast = { message, kind, key: ++this.toastKey, action };
    this.resumeToast();
  }

  /** Holds the toast on screen while it is touched. */
  pauseToast(): void {
    clearTimeout(this.toastTimer);
  }

  resumeToast(): void {
    clearTimeout(this.toastTimer);
    const toast = this.toast;
    if (!toast) return;
    this.toastTimer = setTimeout(() => this.dismissToast(toast.key), toast.action ? TOAST_ACTION_MS : TOAST_MS);
  }

  dismissToast(key: number): void {
    const toast = this.toast;
    if (toast?.key !== key || toast.leaving) return;
    clearTimeout(this.toastTimer);
    this.toast = { ...toast, action: undefined, leaving: true };
    setTimeout(() => {
      if (this.toast?.key === key) this.toast = null;
    }, TOAST_EXIT_MS);
  }

  /** Runs the toast's action and closes it. */
  actOnToast(): void {
    const toast = this.toast;
    if (!toast?.action) return;
    clearTimeout(this.toastTimer);
    this.toast = null;
    toast.action.run();
  }

  give(food: Food): void {
    this.pendingFood = food;
    this.go('nook');
  }

  go(tab: Tab): void {
    this.tab = tab;
    globalThis.scrollTo?.({ top: 0 });
  }

  pushOverlay(close: () => void): () => void {
    this.closers.push(close);
    return () => {
      this.closers = this.closers.filter((c) => c !== close);
    };
  }

  /** Handles Android back: the topmost overlay, then back to the Nook. False when the app should exit. */
  back(): boolean {
    const close = this.closers.pop();
    if (close) {
      close();
      return true;
    }
    if (this.tab !== 'nook') {
      this.go('nook');
      return true;
    }
    return false;
  }
}

export const ui = new UiState();
