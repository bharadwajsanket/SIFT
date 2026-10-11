import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCleanPlainText } from './aiPlainText.ts';

describe('AI Overview Plain-Text Extraction', () => {
  it('preserves clean paragraphs with standard double line breaks', () => {
    const input = 'First paragraph with some text.\n\nSecond paragraph following the first.';
    const expected = 'First paragraph with some text.\n\nSecond paragraph following the first.';
    assert.strictEqual(getCleanPlainText(input), expected);
  });

  it('strips bold, italic, and inline code formatting', () => {
    const input = 'This is **bold**, this is *italic*, and this is `inline code`.';
    const expected = 'This is bold, this is italic, and this is inline code.';
    assert.strictEqual(getCleanPlainText(input), expected);
  });

  it('preserves code blocks and list items while removing delimiters', () => {
    const input = 'Here is how to run it:\n\n```bash\nnpm install\nnpm run dev\n```\n\nFeatures:\n- Fast\n- Local';
    const output = getCleanPlainText(input);
    assert.ok(output.includes('npm install\nnpm run dev'));
    assert.ok(!output.includes('```'));
    assert.ok(output.includes('- Fast\n- Local'));
  });

  it('handles markdown links and headings cleanly', () => {
    const input = '## Overview\n\nVisit [SIFT Docs](https://github.com/example/sift) for details.';
    const expected = 'Overview\n\nVisit SIFT Docs for details.';
    assert.strictEqual(getCleanPlainText(input), expected);
  });

  it('handles empty or blank content gracefully', () => {
    assert.strictEqual(getCleanPlainText(''), '');
    assert.strictEqual(getCleanPlainText('   \n\n  '), '');
  });
});
