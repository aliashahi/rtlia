import * as vscode from 'vscode';
import { resolveMarkdownDirection, type DirectionMode } from './direction';
import { extendMarkdownIt, readDirectionMode } from './plugin';

export function activate(context: vscode.ExtensionContext): { extendMarkdownIt: typeof extendMarkdownIt } {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.name = 'Rtlia direction';
  status.command = 'rtlia.setDirection';
  context.subscriptions.push(status);

  const refresh = () => {
    updateStatus(status);
    void refreshPreviews();
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('rtlia.openPreview', openPreview),
    vscode.commands.registerCommand('rtlia.setDirection', () => setDirection(markdownDocument())),
    vscode.window.onDidChangeActiveTextEditor(() => updateStatus(status)),
    vscode.window.onDidChangeVisibleTextEditors(() => updateStatus(status)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'markdown') {
        updateStatus(status);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('rtlia')) {
        refresh();
      }
    }),
  );

  updateStatus(status);
  return { extendMarkdownIt };
}

async function openPreview(): Promise<void> {
  const document = markdownDocument();
  if (!document) {
    void vscode.window.showInformationMessage('Open a Markdown file to preview it right to left.');
    return;
  }
  await vscode.commands.executeCommand('markdown.showPreviewToSide', document.uri);
}

async function setDirection(document: vscode.TextDocument | undefined): Promise<void> {
  const config = vscode.workspace.getConfiguration('rtlia', document?.uri);
  const current = readDirectionMode(document?.uri);
  const picked = await vscode.window.showQuickPick(
    [
      directionItem('auto', 'Auto', 'Detect from the document. Code is ignored.', current),
      directionItem('rtl', 'Right to Left', 'Persian, Arabic, Hebrew, and other RTL text. Code stays left to right.', current),
      directionItem('ltr', 'Left to Right', 'Keep the preview left to right.', current),
    ],
    {
      title: 'Rtlia preview direction',
      placeHolder: 'A front matter direction value overrides this setting for that file',
    },
  );
  if (!picked) {
    return;
  }

  const inspected = config.inspect<string>('direction');
  const target = inspected?.workspaceFolderValue !== undefined && document
    ? vscode.ConfigurationTarget.WorkspaceFolder
    : inspected?.workspaceValue !== undefined
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;
  await config.update('direction', picked.mode, target);
}

function directionItem(
  mode: DirectionMode,
  label: string,
  detail: string,
  current: DirectionMode,
): vscode.QuickPickItem & { mode: DirectionMode } {
  const selected = mode === current;
  return {
    mode,
    label: selected ? `$(check) ${label}` : label,
    description: selected ? 'Current' : undefined,
    detail,
  };
}

function updateStatus(status: vscode.StatusBarItem): void {
  const document = markdownDocument();
  if (!document) {
    status.hide();
    return;
  }

  const mode = readDirectionMode(document.uri);
  const direction = resolveMarkdownDirection(document.getText(), mode);
  const modeLabel = mode === 'auto' ? 'auto' : mode.toUpperCase();
  status.text = direction === 'rtl' ? '$(preview) RTL' : '$(preview) LTR';
  status.tooltip = direction === 'rtl'
    ? `Rtlia preview is right to left (${modeLabel}). Click to change.`
    : `Rtlia preview is left to right (${modeLabel}). Click to change.`;
  status.show();
}

function markdownDocument(): vscode.TextDocument | undefined {
  const active = vscode.window.activeTextEditor?.document;
  if (active?.languageId === 'markdown') {
    return active;
  }
  return vscode.window.visibleTextEditors.find((editor) => editor.document.languageId === 'markdown')?.document;
}

async function refreshPreviews(): Promise<void> {
  try {
    await vscode.commands.executeCommand('markdown.preview.refresh');
  } catch (error) {
    console.error('[rtlia] Could not refresh the Markdown preview.', error);
  }
}
