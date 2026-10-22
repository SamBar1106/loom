import { Link } from "react-router-dom";
import { SiteFooter, legalLinkClassName } from "@/components/layout/site-footer";
import type { LegalBlock, LegalDocument, LegalText } from "@/content/legal-document";
import { usePageTitle } from "@/pages/use-page-title";

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function LegalTextRun({ value }: { value: LegalText }) {
  if (typeof value === "string") return value;
  if (isInternalHref(value.href)) {
    return (
      <Link className={legalLinkClassName} to={value.href}>
        {value.text}
      </Link>
    );
  }
  return (
    <a className={legalLinkClassName} href={value.href} rel="noreferrer">
      {value.text}
    </a>
  );
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="leading-7">
          {block.text.map((part, index) => (
            <LegalTextRun key={index} value={part} />
          ))}
        </p>
      );
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {block.items.map((item, index) => (
            <li key={index}>
              {item.map((part, partIndex) => (
                <LegalTextRun key={partIndex} value={part} />
              ))}
            </li>
          ))}
        </ul>
      );
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  usePageTitle(document.title);

  return (
    <div data-page={document.slug} className="flex min-h-svh flex-col bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-2">
          <p className="font-heading text-sm font-medium tracking-tight text-muted-foreground">Loom</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{document.title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {document.lastUpdated}</p>
        </header>
        {document.sections.map((section) => (
          <section key={section.id} className="flex flex-col gap-3" id={section.id}>
            <h2 className="font-heading text-lg font-semibold tracking-tight">{section.heading}</h2>
            {section.blocks.map((block, index) => (
              <LegalBlockView key={`${section.id}-${index}`} block={block} />
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
