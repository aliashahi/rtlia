import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  detectDirection,
  proseFromTokens,
  resolveMarkdownDirection,
  resolvePreviewDirection,
  type ProseToken,
} from '../src/direction';

const persian = `
سلام دنیا

این یک نوشتار آزمایشی است.

\`\`\`javascript
function greet(name) {
  return "Hello " + name;
}
\`\`\`

> نقل قول
`;

describe('detectDirection', () => {
  it('keeps empty and English text left to right', () => {
    assert.equal(detectDirection(''), 'ltr');
    assert.equal(detectDirection('Hello world'), 'ltr');
  });

  it('detects Persian, Arabic, and Hebrew', () => {
    assert.equal(detectDirection('سلام دنیا'), 'rtl');
    assert.equal(detectDirection('مرحبا بالعالم'), 'rtl');
    assert.equal(detectDirection('שלום עולם'), 'rtl');
  });

  it('follows whichever script has more letters', () => {
    assert.equal(detectDirection('سلام Hello'), 'ltr');
    assert.equal(detectDirection('سلام دنیا Hello'), 'rtl');
  });
});

describe('resolveMarkdownDirection', () => {
  it('ignores English inside code when the prose is RTL', () => {
    assert.equal(resolveMarkdownDirection(persian, 'auto'), 'rtl');
  });

  it('lets front matter override the setting and the detected script', () => {
    const forcedLeft = `---\ndirection: ltr\n---\n\n${persian}`;
    const forcedRight = '---\ndirection: "rtl"\n---\n\nHello only.';
    assert.equal(resolveMarkdownDirection(forcedLeft, 'rtl'), 'ltr');
    assert.equal(resolveMarkdownDirection(forcedRight, 'ltr'), 'rtl');
  });

  it('uses an explicit mode when front matter is absent', () => {
    assert.equal(resolveMarkdownDirection('Hello', 'rtl'), 'rtl');
    assert.equal(resolveMarkdownDirection(persian, 'ltr'), 'ltr');
  });
});

describe('preview tokens', () => {
  it('skips fenced code and inline code while reading front matter', () => {
    const tokens: ProseToken[] = [
      { type: 'front_matter', meta: { content: 'direction: rtl' } },
      {
        type: 'inline',
        children: [
          { type: 'text', content: 'Hello ' },
          { type: 'code_inline', content: 'سلام' },
          { type: 'text', content: 'world' },
        ],
      },
      { type: 'fence', content: 'سلام '.repeat(20) },
    ];

    assert.equal(proseFromTokens(tokens), 'Hello world');
    assert.equal(resolvePreviewDirection({
      prose: proseFromTokens(tokens),
      frontMatter: 'direction: rtl',
      mode: 'auto',
    }), 'rtl');
  });
});
