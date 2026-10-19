export function tenantPath(slug: string, section = ""): string {
  return section ? `/t/${slug}/${section}` : `/t/${slug}`;
}

export function isSection(pathname: string, href: string, end = false): boolean {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
