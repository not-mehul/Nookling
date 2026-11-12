import { describe, expect, it } from 'vitest';
import { buildLink, parseLink } from '../../src/platform/links';
import { readNooklingLink } from '../../src/platform/incoming';

describe('nookling:// links', () => {
  it('reads open, and falls back to open for anything else', () => {
    expect(readNooklingLink('nookling://open?source=mise')).toEqual({ kind: 'open' });
    expect(readNooklingLink('nookling://feed?food=cake')).toEqual({ kind: 'open' });
    expect(readNooklingLink('mise://open?id=1')).toBeNull();
  });

  it('builds links the other apps can read', () => {
    const link = buildLink('nookling', 'open', {}, 'mise');
    expect(link).toBe('nookling://open?source=mise');
    expect(parseLink(link, 'nookling')?.source).toBe('mise');
  });
});
