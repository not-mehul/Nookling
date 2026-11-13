import { describe, expect, it } from 'vitest';
import { buildLink, parseLink } from '../../src/platform/links';
import { readNooklingLink } from '../../src/platform/incoming';

describe('nookling:// links', () => {
  it('reads open, and falls back to open for anything else', () => {
    expect(readNooklingLink('nookling://open?source=mise')).toEqual({ kind: 'open' });
    expect(readNooklingLink('nookling://feed?food=cake')).toEqual({ kind: 'open' });
    expect(readNooklingLink('mise://open?id=1')).toBeNull();
  });

  it('reads a dish from Mise and a book from BookShelf, and opens for anything empty', () => {
    expect(readNooklingLink('nookling://cooked?dish=Lentil%20soup&source=mise')).toEqual({ kind: 'cooked', dish: 'Lentil soup' });
    expect(readNooklingLink('nookling://read?title=The%20Hobbit&author=Tolkien&source=bookshelf')).toEqual({ kind: 'read', title: 'The Hobbit', author: 'Tolkien' });
    expect(readNooklingLink('nookling://cooked?dish=%20%20')).toEqual({ kind: 'open' });
    expect(readNooklingLink('nookling://read')).toEqual({ kind: 'open' });
    const long = readNooklingLink(`nookling://cooked?dish=${'a'.repeat(500)}`);
    expect(long?.kind === 'cooked' && long.dish.length).toBe(120);
  });

  it('builds links the other apps can read', () => {
    const link = buildLink('nookling', 'open', {}, 'mise');
    expect(link).toBe('nookling://open?source=mise');
    expect(parseLink(link, 'nookling')?.source).toBe('mise');
  });
});
