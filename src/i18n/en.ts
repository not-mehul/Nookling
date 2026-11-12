// English, the source language. Sentence case everywhere (style.md §12);
// mono labels are set in caps by CSS.

const en = {
  'app.name': 'Nookling',
  'app.tagline': 'A small round friend, kept in a warm corner of your phone.',

  'tabs.sections': 'Sections',
  'tabs.nook': 'Nook',
  'tabs.pantry': 'Pantry',
  'tabs.journal': 'Journal',
  'tabs.settings': 'Settings',

  'action.close': 'Close',

  'time.days': { one: '{count} day', other: '{count} days' },

  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.themeSystem': 'System',
  'settings.themeDusk': 'Dusk',
  'settings.themeDawn': 'Dawn',
  'settings.dawnSwitch': 'Dawn theme',
  'settings.about': 'About',
  'settings.version': 'Version {version}',
  'settings.private': 'Private.',
  'settings.privateText': 'Your nookling lives on this phone. There is no account and no server, and the app never uses the network.',
  'settings.credit': 'Designed and built by Mehul Sen.',
} as const;

export default en;
