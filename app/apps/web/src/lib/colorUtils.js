// Utilidades de conversión de color para el panel de Apariencia.
// Los CSS variables del tema usan valores HSL separados por espacios
// (ej. "346 32% 42%"); el selector visual del admin usa hex.

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// hex (#rgb | #rrggbb) → { h, s, l } (0-360, 0-100, 0-100)
export function hexToHsl(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6) return { h: 0, s: 0, l: 0 };
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const light = (max + min) / 2;
  const d = max - min;
  if (d !==  0) {
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue *= 60;
  }
  return { h: Math.round(hue), s: Math.round(sat * 100), l: Math.round(light * 100) };
}

// { h, s, l } → "#rrggbb"
export function hslToHex({ h, s, l }) {
  const hh = clamp(h, 0, 360) / 360;
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (ss === 0) {
    r = g = b = ll;
  } else {
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }
  const toHex = (x) =>
    Math.round(clamp(x, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Cadena HSL del tema ("346 32% 42%") → "#rrggbb"
export function hslStringToHex(str) {
  if (!str || typeof str !== 'string') return '#000000';
  const parts = str.trim().split(/\s+/);
  if (parts.length < 3) return '#000000';
  return hslToHex({
    h: Number(parts[0].replace('%', '')),
    s: Number(parts[1].replace('%', '')),
    l: Number(parts[2].replace('%', '')),
  });
}

// hex → cadena HSL del tema ("h s% l%")
export function hexToHslString(hex) {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

// Luminancia relativa para decidir texto claro/oscuro sobre un color.
export function relativeLuminance(hex) {
  const { h, s, l } = hexToHsl(hex);
  // Aproximación usando lightness; suficiente para elegir contraste.
  return l / 100;
}

// Devuelve un color de texto (HSL string) con buen contraste sobre `bgHex`.
export function contrastText(bgHex) {
  return relativeLuminance(bgHex) > 0.6 ? '20 18% 17%' : '30 40% 98%';
}
