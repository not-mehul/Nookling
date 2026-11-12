<script lang="ts">
  import { IconTabs, ThemeToggle, Toast, konami, play, secretTaps } from 'dusk-dawn';
  import { cheer, hatchEgg } from './lib/delight';
  import Icon from './components/ui/Icon.svelte';
  import JournalView from './components/JournalView.svelte';
  import NookView from './components/NookView.svelte';
  import PantryView from './components/PantryView.svelte';
  import SettingsView from './components/SettingsView.svelte';
  import { t, type MessageKey } from './i18n/index.svelte';
  import { setHaptics } from './platform/haptics';
  import { setSound } from './platform/sound';
  import { applyTheme, shown, toggledTheme } from './platform/theme.svelte';
  import { petState } from './state/pet.svelte';
  import { settings } from './state/settings.svelte';
  import { ui, type Tab } from './state/ui.svelte';

  const TABS: { id: Tab; dom: string; panel: string; key: MessageKey }[] = [
    { id: 'nook', dom: 'tabNook', panel: 'viewNook', key: 'tabs.nook' },
    { id: 'pantry', dom: 'tabPantry', panel: 'viewPantry', key: 'tabs.pantry' },
    { id: 'journal', dom: 'tabJournal', panel: 'viewJournal', key: 'tabs.journal' },
    { id: 'settings', dom: 'tabSettings', panel: 'viewSettings', key: 'tabs.settings' },
  ];
  const ICONS = { nook: nookIcon, pantry: pantryIcon, journal: journalIcon, settings: settingsIcon };

  $effect(() => applyTheme(settings.current.theme));
  $effect(() => setSound(settings.current.sound));
  $effect(() => setHaptics(settings.current.haptics));
  // Easter eggs (style.md §11.3). The Konami code: a somersault and sparks.
  // Seven taps on the title: the fluff tickles its nose.
  let title = $state<HTMLElement>();
  let tricks = 0;
  $effect(() =>
    konami(() => {
      ui.go('nook');
      ui.trick = { kind: 'konami', n: ++tricks };
      hatchEgg('konami', t('egg.konami', { name: petState.pet?.name ?? 'Nookling' }));
    }),
  );
  function sneeze() {
    play(title, 'jelly');
    cheer(title, { count: 40, shapes: ['puffy', 'circle'], spread: 0.8 });
    if (ui.tab === 'nook') ui.trick = { kind: 'sneeze', n: ++tricks };
    hatchEgg('title', t('egg.title'));
  }

  // A new bedtime or Gentle mode: bring the pet up to now so the change shows at once.
  let rules = $state('');
  $effect(() => {
    const next = `${settings.current.bedtime}|${settings.current.wake}|${settings.current.gentle}`;
    if (rules && rules !== next) void petState.refresh();
    rules = next;
  });
</script>

{#snippet nookIcon()}<Icon name="nook" size={22} stroke={1.5} />{/snippet}
{#snippet pantryIcon()}<Icon name="pantry" size={22} stroke={1.5} />{/snippet}
{#snippet journalIcon()}<Icon name="journal" size={22} stroke={1.5} />{/snippet}
{#snippet settingsIcon()}<Icon name="settings" size={22} stroke={1.5} />{/snippet}

<!-- Edge to edge: a strip behind the status bar so text never scrolls under the clock. -->
<div class="status-scrim" aria-hidden="true"></div>

<div class="glow-layer" aria-hidden="true">
  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>
  <div class="glow glow-3"></div>
</div>

<div class="container">
  <header class="site-header compact">
    <div class="site-title">
      <h1 class="t-page-title" bind:this={title} use:secretTaps={{ count: 7, onunlock: sneeze }}><em>Nookling</em></h1>
    </div>
    <ThemeToggle dawn={!shown.dark} label={t('settings.dawnSwitch')} ontoggle={() => settings.update({ theme: toggledTheme() })} />
  </header>

  <nav class="app-tabs">
    <IconTabs
      tabs={TABS.map((tab) => ({ id: tab.id, domId: tab.dom, controls: tab.panel, label: t(tab.key), icon: ICONS[tab.id] }))}
      value={ui.tab}
      label={t('tabs.sections')}
      onselect={(id) => ui.go(id)}
    />
  </nav>

  <main>
    {#if ui.tab === 'nook'}
      <NookView />
    {:else if ui.tab === 'pantry'}
      <PantryView />
    {:else if ui.tab === 'journal'}
      <JournalView />
    {:else}
      <SettingsView />
    {/if}
  </main>
</div>

<Toast toast={ui.toast} onpause={() => ui.pauseToast()} onresume={() => ui.resumeToast()} onaction={() => ui.actOnToast()} />
