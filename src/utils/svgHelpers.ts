const BLOCKED_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
]);

export function sanitizeSvgMarkup(rawSvg: string): string {
  const trimmed = (rawSvg || '').trim();
  if (!trimmed.includes('<svg')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0d1020"/></svg>';
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0d1020"/></svg>';
    }

    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const walk = (node: Element) => {
      const children = Array.from(node.children);
      for (const child of children) {
        if (BLOCKED_TAGS.has(child.tagName.toLowerCase())) {
          child.remove();
          continue;
        }
        for (const attr of Array.from(child.attributes)) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase();
          if (name.startsWith('on') || val.startsWith('javascript:') || val.startsWith('data:text/html')) {
            child.removeAttribute(attr.name);
          }
          if ((name === 'href' || name === 'xlink:href') && !val.startsWith('#')) {
            child.removeAttribute(attr.name);
          }
        }
        walk(child);
      }
    };

    walk(svg);
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0d1020"/></svg>';
  }
}

export function svgToDataUrl(rawSvg: string): string {
  const clean = sanitizeSvgMarkup(rawSvg);
  const encoded = encodeURIComponent(clean);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function downloadSvgFile(rawSvg: string, filename: string): void {
  const clean = sanitizeSvgMarkup(rawSvg);
  const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvgAsPng(
  rawSvg: string,
  filename: string,
  width = 1280,
  height = 1280
): Promise<void> {
  return new Promise((resolve, reject) => {
    const clean = sanitizeSvgMarkup(rawSvg);
    const img = new Image();
    const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          if (!pngBlob) {
            reject(new Error('PNG export failed'));
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
          resolve();
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG'));
    };

    img.src = url;
  });
}
