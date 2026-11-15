export type Direction = 'rtl' | 'ltr';
export type DirectionMode = 'auto' | Direction;

export interface ProseToken {
  type: string;
  content?: string;
  children?: ProseToken[] | null;
  meta?: { content?: unknown };
}

const SKIPPED_BLOCKS = new Set(['front_matter', 'fence', 'code_block']);

const RTL_LETTERS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const LATIN_LETTERS = /\p{Script=Latin}/gu;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const DIRECTION_LINE = /^direction:\s*['"]?(rtl|ltr)['"]?\s*$/im;

export function directionFromFrontMatter(frontMatter: string | undefined): Direction | undefined {
  if (!frontMatter) {
    return undefined;
  }
  const match = frontMatter.match(DIRECTION_LINE);
  const value = match?.[1]?.toLowerCase();
  return value === 'rtl' || value === 'ltr' ? value : undefined;
}

export function frontMatterFromMarkdown(markdown: string): string | undefined {
  return markdown.match(FRONT_MATTER)?.[1];
}

export function proseFromMarkdown(markdown: string): string {
  const body = markdown.replace(FRONT_MATTER, '');
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
}

export function proseFromTokens(tokens: readonly ProseToken[]): string {
  let prose = '';
  for (const token of tokens) {
    if (SKIPPED_BLOCKS.has(token.type)) {
      continue;
    }
    if (token.type === 'inline' && token.children) {
      for (const child of token.children) {
        if (child.type === 'code_inline') {
          continue;
        }
        if (child.type === 'text' || child.type === 'html_inline') {
          prose += child.content ?? '';
        }
      }
      continue;
    }
    if (token.children?.length) {
      prose += proseFromTokens(token.children);
    }
  }
  return prose;
}

export function frontMatterFromTokens(tokens: readonly ProseToken[]): string | undefined {
  const token = tokens.find((candidate) => candidate.type === 'front_matter');
  const content = token?.meta?.content;
  return typeof content === 'string' ? content : undefined;
}

export function detectDirection(text: string): Direction {
  const rtl = text.match(RTL_LETTERS)?.length ?? 0;
  const latin = text.match(LATIN_LETTERS)?.length ?? 0;
  if (rtl === 0) {
    return 'ltr';
  }
  return rtl >= latin ? 'rtl' : 'ltr';
}

export function resolvePreviewDirection(input: {
  prose: string;
  frontMatter?: string;
  mode: DirectionMode;
}): Direction {
  const fromFrontMatter = directionFromFrontMatter(input.frontMatter);
  if (fromFrontMatter) {
    return fromFrontMatter;
  }
  if (input.mode === 'rtl' || input.mode === 'ltr') {
    return input.mode;
  }
  return detectDirection(input.prose);
}

export function resolveMarkdownDirection(markdown: string, mode: DirectionMode): Direction {
  return resolvePreviewDirection({
    prose: proseFromMarkdown(markdown),
    frontMatter: frontMatterFromMarkdown(markdown),
    mode,
  });
}
