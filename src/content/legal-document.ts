export type LegalText = string | { readonly text: string; readonly href: string };

export type LegalBlock =
  | { readonly type: "paragraph"; readonly text: readonly LegalText[] }
  | { readonly type: "list"; readonly items: readonly (readonly LegalText[])[] };

export type LegalSection = {
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  readonly slug: "terms" | "privacy";
  readonly title: string;
  readonly lastUpdated: string;
  readonly sections: readonly LegalSection[];
};

export const legalLastUpdated = "October 22, 2026";

export const contactEmail = "samuelbarrios1106@gmail.com";

export function paragraph(...text: LegalText[]): LegalBlock {
  return { type: "paragraph", text };
}

export function bullets(...items: LegalText[][]): LegalBlock {
  return { type: "list", items };
}

export function link(text: string, href: string): LegalText {
  return { text, href };
}
