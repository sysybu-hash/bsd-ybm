/** Semi-transparent RGBA for LED/button glows from a hex primary. */
export function hexToGlow(hex: string, alpha = 0.45): string {
  const h = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(0, 70, 148, ${alpha})`;
}
