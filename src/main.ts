// ============================================================
// Nookling — app entry point: applies preferences and mounts the UI.
// ============================================================

import { App as CapacitorApp } from '@capacitor/app';
import { mount } from 'svelte';
import App from './App.svelte';
import { listenForLinks } from './platform/incoming';
import { isNative } from './platform/output';
import { applyTheme } from './platform/theme.svelte';
import { petState } from './state/pet.svelte';
import { reminders } from './state/reminders.svelte';
import { settings } from './state/settings.svelte';
import { ui } from './state/ui.svelte';
import './styles/app.css';

function start(): void {
  // Apply the theme before the first paint; App.svelte keeps it in sync afterwards.
  applyTheme(settings.current.theme);
  mount(App, { target: document.getElementById('app')! });
  void petState.init();

  if (isNative) {
    // Android back: close the topmost overlay, then return to the Nook, then exit (style.md §14).
    void CapacitorApp.addListener('backButton', () => {
      if (!ui.back()) void CapacitorApp.exitApp();
    });
    // Coming back to the app: replay the time it was away, quietly, for the welcome-back line.
    void CapacitorApp.addListener('resume', () => {
      void petState.refresh(Date.now());
      void reminders.clear();
      void reminders.check();
    });
    // Leaving: hand the next two days of reminders to the phone (src/domain/reminders.ts).
    void CapacitorApp.addListener('pause', () => void petState.refresh().then(() => reminders.plan()));
    void reminders.clear();
    void reminders.check();
    // nookling:// links from the other apps only ever open the Nook (style.md §14.1).
    void listenForLinks(() => ui.go('nook'));
  }
}

start();
