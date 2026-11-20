import { DocsBody, DocsPage, MarkdownCopyButton, ViewOptionsPopover } from "fumadocs-ui/layouts/spacious/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { basePath, repoUrl } from "@/lib/shared";
import { source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = `${basePath}/llms.mdx${page.url}.md`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
      <p className="mb-2 text-lg text-fd-muted-foreground">{page.data.description}</p>
      <div className="mb-4 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`${repoUrl}/blob/main/apps/docs/content/docs/${encodeURI(page.path)}`}
        />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}
