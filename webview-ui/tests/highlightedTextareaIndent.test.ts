import { describe, test, expect } from 'vitest';
import { indentLines, outdentLines } from '../src/components/HighlightedTextarea';

describe('HighlightedTextarea Tab-to-indent', () => {
  describe('indentLines', () => {
    test('indents a single line, shifting caret by 4', () => {
      const result = indentLines('hello', 2, 2);
      expect(result.text).toBe('    hello');
      expect(result.start).toBe(6);
      expect(result.end).toBe(6);
    });

    test('indents every line touched by a multi-line selection', () => {
      const text = 'line1\nline2\nline3';
      // selection spans from inside line1 to inside line3
      const start = 2; // inside "line1"
      const end = text.indexOf('line3') + 2; // inside "line3"
      const result = indentLines(text, start, end);
      expect(result.text).toBe('    line1\n    line2\n    line3');
    });

    test('does not indent a line outside the selection', () => {
      const text = 'a\nb\nc';
      const start = 0; // start of "a"
      const end = 1; // end of "a" — selection is just line "a"
      const result = indentLines(text, start, end);
      expect(result.text).toBe('    a\nb\nc');
    });
  });

  describe('outdentLines', () => {
    test('removes 4 leading spaces from a single line', () => {
      const result = outdentLines('    hello', 6, 6);
      expect(result.text).toBe('hello');
    });

    test('removes only the leading whitespace that exists (fewer than 4 spaces)', () => {
      const result = outdentLines('  hello', 4, 4);
      expect(result.text).toBe('hello');
    });

    test('removes a leading tab character', () => {
      const result = outdentLines('\thello', 3, 3);
      expect(result.text).toBe('hello');
    });

    test('outdents every line touched by a multi-line selection', () => {
      const text = '    line1\n    line2\n    line3';
      const start = 6; // inside "line1"
      const end = text.lastIndexOf('line3') + 2;
      const result = outdentLines(text, start, end);
      expect(result.text).toBe('line1\nline2\nline3');
    });

    test('does not move the caret when there is no leading whitespace to remove', () => {
      const result = outdentLines('hello', 2, 2);
      expect(result.text).toBe('hello');
      expect(result.start).toBe(2);
      expect(result.end).toBe(2);
    });

    test('clamps caret to line start when it was inside the removed whitespace', () => {
      // caret at offset 2, inside the 4 leading spaces
      const result = outdentLines('    hello', 2, 2);
      expect(result.text).toBe('hello');
      expect(result.start).toBe(0);
      expect(result.end).toBe(0);
    });
  });

  test('indent then outdent round-trips back to the original text', () => {
    const original = 'line1\n  line2\nline3';
    const indented = indentLines(original, 0, original.length);
    const restored = outdentLines(indented.text, indented.start, indented.end);
    expect(restored.text).toBe(original);
  });
});
