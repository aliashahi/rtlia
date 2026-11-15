import * as vscode from 'vscode';
import {
  frontMatterFromTokens,
  proseFromTokens,
  resolvePreviewDirection,
  type DirectionMode,
  type ProseToken,
} from './direction';

interface MarkdownItLike {
  renderer: {
    render: (tokens: ProseToken[], options: unknown, env: unknown) => string;
  };
}

export function extendMarkdownIt(md: MarkdownItLike): MarkdownItLike {
  const originalRender = md.renderer.render.bind(md.renderer);
  md.renderer.render = (tokens, options, env) => {
    const html = originalRender(tokens, options, env);
    try {
      const direction = resolvePreviewDirection({
        prose: proseFromTokens(tokens),
        frontMatter: frontMatterFromTokens(tokens),
        mode: readDirectionMode(documentUri(env)),
      });
      return `<div class="rtlia-root" dir="${direction}">${html}</div>`;
    } catch (error) {
      console.error('[rtlia] Could not set preview direction.', error);
      return html;
    }
  };
  return md;
}

export function readDirectionMode(resource: vscode.Uri | undefined): DirectionMode {
  const value = vscode.workspace.getConfiguration('rtlia', resource).get<unknown>('direction', 'auto');
  return value === 'rtl' || value === 'ltr' || value === 'auto' ? value : 'auto';
}

function documentUri(env: unknown): vscode.Uri | undefined {
  if (!env || typeof env !== 'object' || !('currentDocument' in env)) {
    return undefined;
  }
  const current = (env as { currentDocument?: unknown }).currentDocument;
  return current instanceof vscode.Uri ? current : undefined;
}
