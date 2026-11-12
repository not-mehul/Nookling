// "Take a picture": the pet's SVG drawn onto a card with its name and the
// date, as a PNG. Colours come from tokens, resolved at the moment the
// picture is taken, so it matches the theme on screen.

const PAINTED = ['fill', 'stroke', 'stop-color', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-width', 'transform', 'transform-origin', 'display', 'visibility'] as const;

/** A copy of the SVG with every computed paint written inline, so it draws the same off the page. */
export function inlineSvg(svg: SVGSVGElement, size: number, height = size): string {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll('*')];
  const to = [copy, ...copy.querySelectorAll('*')];
  from.forEach((el, i) => {
    const style = getComputedStyle(el);
    const target = to[i] as SVGElement;
    for (const prop of PAINTED) {
      const value = style.getPropertyValue(prop);
      if (value) target.style.setProperty(prop, value);
    }
    // Mid-animation poses don't belong in a portrait.
    target.style.removeProperty('animation');
  });
  copy.setAttribute('width', String(size));
  copy.setAttribute('height', String(height));
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(copy);
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** A 1080 by 1350 portrait card of the pet. Photo mode passes a backdrop (an SVG drawn on a 1080 × 1350 box) to draw behind it. */
export async function snapshot(svg: SVGSVGElement, name: string, caption: string, backdrop?: SVGSVGElement): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas');
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, token('--bg-grad-top'));
  grad.addColorStop(0.5, token('--bg-grad-mid'));
  grad.addColorStop(1, token('--bg-grad-bot'));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  if (backdrop) {
    const back = URL.createObjectURL(new Blob([inlineSvg(backdrop, W, H)], { type: 'image/svg+xml' }));
    try {
      ctx.drawImage(await loadImage(back), 0, 0, W, H);
    } finally {
      URL.revokeObjectURL(back);
    }
  }

  const markup = inlineSvg(svg, 820);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, (W - 820) / 2, 120, 820, 820);
  } finally {
    URL.revokeObjectURL(url);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = token('--text-heading');
  ctx.font = `italic 88px ${token('--font-serif') || 'serif'}`;
  ctx.fillText(name, W / 2, 1080);
  ctx.fillStyle = token('--text-muted');
  ctx.font = `36px ${token('--font-sans') || 'sans-serif'}`;
  ctx.fillText(caption, W / 2, 1150);
  ctx.font = `28px ${token('--font-mono') || 'monospace'}`;
  ctx.fillStyle = token('--text-faint');
  ctx.fillText('Nookling', W / 2, 1270);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No picture'))), 'image/png'));
}
