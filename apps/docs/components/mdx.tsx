import { Callout as BaseCallout } from "fumadocs-ui/components/callout";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

function Callout({ className, ...props }: ComponentProps<typeof BaseCallout>) {
  return <BaseCallout className={`ps-3 [&>div[role=none]]:hidden ${className ?? ""}`} {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return { ...defaultMdxComponents, Callout, ...components } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
