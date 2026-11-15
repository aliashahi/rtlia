# Rtlia

Rtlia is a right-to-left Markdown preview for VS Code, Cursor, and other compatible editors. Persian, Arabic, Hebrew, and other RTL prose is aligned from the right. Code stays left to right.

It styles the editor's own Markdown preview, in the spirit of [rtlmd](https://github.com/dariubs/rtlmd). Links, images, and scroll sync stay on the built-in preview.

## Preview

Open a Markdown file and run **Rtlia: Open RTL Preview to the Side**, or click the preview icon in the editor title bar. The status bar shows `RTL` or `LTR`. Click it to change the direction.

`examples/sample.md` is a short Persian document with a list, a quote, a table, and a code block.

## Direction

The default is `auto`.

- Letters in fenced and inline code are ignored.
- If RTL letters (Arabic, Persian, Hebrew, and related scripts) are at least as common as Latin letters, the preview is right to left.
- Otherwise it stays left to right.

Set the default with **Rtlia: Set Preview Direction**, or in settings:

```json
{
  "rtlia.direction": "auto"
}
```

`rtl` forces right to left. `ltr` forces left to right. Code blocks stay left to right in every mode.

One file can override the setting with front matter:

```markdown
---
direction: rtl
---
```

`direction` accepts `rtl` or `ltr`.

## Develop

```bash
npm install
npm test
```

Then press F5 (**Run Extension**). The Extension Development Host opens `examples/sample.md`. Run **Rtlia: Open RTL Preview to the Side**.
