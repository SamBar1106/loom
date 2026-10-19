function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Original geometric placeholder. No third-party product photography. */
export function placeholderImage(label: string, hue: number): string {
  const safe = escapeXml(label.slice(0, 18));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <rect width="640" height="480" fill="hsl(${hue} 16% 93%)"/>
    <rect x="210" y="110" width="220" height="250" rx="18" fill="hsl(${hue} 14% 82%)"/>
    <rect x="248" y="150" width="144" height="110" rx="10" fill="hsl(${hue} 18% 96%)"/>
    <text x="320" y="320" text-anchor="middle" font-family="sans-serif" font-size="28" fill="hsl(${hue} 12% 32%)">${safe}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
