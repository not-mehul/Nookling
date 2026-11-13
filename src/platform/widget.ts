// The home-screen widget (android/.../NooklingWidget.java): each time the
// app is put away, it gets the pet's name, a line about it and a small
// picture of it as it looks right now. Android only; elsewhere a no-op.

import { registerPlugin } from '@capacitor/core';
import { inlineSvg } from '../lib/snapshot';
import { isNative } from './output';

interface WidgetPlugin {
  update(options: { name: string; line: string; png?: string }): Promise<{ widgets: number }>;
}
const Widget = registerPlugin<WidgetPlugin>('NooklingWidget');

/** A small PNG of the pet on screen, as base64, or undefined if it isn't on screen. */
async function picture(size = 256): Promise<string | undefined> {
  const svg = document.querySelector<SVGSVGElement>('#petButton svg.pet');
  if (!svg) return undefined;
  const url = URL.createObjectURL(new Blob([inlineSvg(svg, size)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d')?.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function updateWidget(name: string, line: string): Promise<void> {
  if (!isNative) return;
  try {
    await Widget.update({ name, line, png: await picture() });
  } catch {
    // An older build without the widget: nothing to do.
  }
}
