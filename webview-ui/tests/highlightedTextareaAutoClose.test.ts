import { describe, test, expect } from 'vitest';
import {
  computeAutoCloseInsertion,
  computeBackspaceDeletion,
  computeEnterInsertion,
} from '../src/components/HighlightedTextarea';

describe('HighlightedTextarea auto-close brackets/quotes', () => {
  describe('computeAutoCloseInsertion', () => {
    test('inserts a bracket pair with the caret between them', () => {
      const result = computeAutoCloseInsertion('(', 'foo', 3, 3);
      expect(result?.text).toBe('foo()');
      expect(result?.start).toBe(4);
      expect(result?.end).toBe(4);
    });

    test('auto-surrounds a selection with the pair instead of replacing it', () => {
      const result = computeAutoCloseInsertion('{', 'hello world', 0, 5);
      expect(result?.text).toBe('{hello} world');
      expect(result?.start).toBe(1);
      expect(result?.end).toBe(6);
    });

    test('auto-closes a quote when not adjacent to a word character', () => {
      const result = computeAutoCloseInsertion('"', 'a  b', 2, 2);
      expect(result?.text).toBe('a "" b');
      expect(result?.start).toBe(3);
    });

    test('skips auto-closing a quote when the character before the caret is a word character', () => {
      const result = computeAutoCloseInsertion('"', 'abc', 3, 3);
      expect(result).toBeNull();
    });

    test('skips auto-closing a quote when the character after the caret is a word character', () => {
      const result = computeAutoCloseInsertion('"', 'abc', 0, 0);
      expect(result).toBeNull();
    });
  });

  describe('computeBackspaceDeletion', () => {
    test('removes an empty bracket pair as a unit', () => {
      const result = computeBackspaceDeletion('foo()bar', 4, 4);
      expect(result?.text).toBe('foobar');
      expect(result?.start).toBe(3);
      expect(result?.end).toBe(3);
    });

    test('removes an empty quote pair as a unit', () => {
      const result = computeBackspaceDeletion('a""b', 2, 2);
      expect(result?.text).toBe('ab');
      expect(result?.start).toBe(1);
    });

    test('does nothing when the pair is not empty', () => {
      const result = computeBackspaceDeletion('foo(x)bar', 4, 4);
      expect(result).toBeNull();
    });

    test('does nothing when there is an active selection', () => {
      const result = computeBackspaceDeletion('()', 0, 2);
      expect(result).toBeNull();
    });

    test('does nothing at the start of the text', () => {
      const result = computeBackspaceDeletion('()', 0, 0);
      expect(result).toBeNull();
    });
  });

  describe('computeEnterInsertion', () => {
    test('copies the current line indentation onto the new line', () => {
      const result = computeEnterInsertion('    hello', 9, 9);
      expect(result.text).toBe('    hello\n    ');
      expect(result.start).toBe(14);
    });

    test('adds one more indent level after an opening bracket', () => {
      const result = computeEnterInsertion('{', 1, 1);
      expect(result.text).toBe('{\n    ');
      expect(result.start).toBe(6);
    });

    // Regression: quotes are self-pairing (the same "\"" closes a string as opens one), so
    // treating "char before caret is a key in the pairs map" as "an open bracket was just
    // typed" incorrectly added an extra indent level after a *closing* quote too — e.g.
    // pressing Enter right after `"JoltAPI"` indented the next line as if `"` were `{`.
    test('does not add an indent level after a quote (quotes are not brackets)', () => {
      const result = computeEnterInsertion('{"name": "JoltAPI"', 19, 19);
      expect(result.text).toBe('{"name": "JoltAPI"\n');
      expect(result.start).toBe(20);
    });

    test('splits a fresh empty pair onto three lines with the caret indented in the middle', () => {
      const result = computeEnterInsertion('{}', 1, 1);
      expect(result.text).toBe('{\n    \n}');
      expect(result.start).toBe(6);
    });

    test('preserves the surrounding indentation level when splitting a nested pair', () => {
      const result = computeEnterInsertion('  {}', 3, 3);
      expect(result.text).toBe('  {\n      \n  }');
    });

    test('replaces an active selection with the newline', () => {
      const result = computeEnterInsertion('hello world', 5, 11);
      expect(result.text).toBe('hello\n');
      expect(result.start).toBe(6);
    });
  });
});
