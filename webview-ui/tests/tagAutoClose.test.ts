import { describe, it, expect } from 'vitest';
import { computeTagClose } from '../src/components/HighlightedTextarea';

/** Types `>` at the caret marked by `|` and returns the resulting text with the new caret. */
function typeAngle(input: string, language = 'xml'): string | null {
  const caret = input.indexOf('|');
  const text = input.replace('|', '');
  const result = computeTagClose(text, caret, caret, language);
  if (!result) {return null;}
  return result.text.slice(0, result.start) + '|' + result.text.slice(result.start);
}

describe('computeTagClose', () => {
  it('closes a simple opening tag and parks the caret inside', () => {
    expect(typeAngle('<user|')).toBe('<user>|</user>');
  });

  it('closes a tag that has attributes', () => {
    expect(typeAngle('<user id="1" active|')).toBe('<user id="1" active>|</user>');
  });

  it('handles namespaced, dotted, and underscored names', () => {
    expect(typeAngle('<soap:Envelope|')).toBe('<soap:Envelope>|</soap:Envelope>');
    expect(typeAngle('<ns.Item|')).toBe('<ns.Item>|</ns.Item>');
    expect(typeAngle('<_private|')).toBe('<_private>|</_private>');
  });

  it('closes a nested tag mid-document', () => {
    expect(typeAngle('<root>\n  <child|\n</root>')).toBe('<root>\n  <child>|</child>\n</root>');
  });

  it('does not close a closing tag', () => {
    expect(typeAngle('<root>text</root|')).toBeNull();
  });

  it('does not close a self-closing tag', () => {
    expect(typeAngle('<br /|')).toBeNull();
  });

  it('does not close comments or declarations', () => {
    expect(typeAngle('<!-- a comment --|')).toBeNull();
    expect(typeAngle('<?xml version="1.0" ?|')).toBeNull();
    expect(typeAngle('<!DOCTYPE html|')).toBeNull();
  });

  it('does nothing when the tag before the caret is already closed', () => {
    expect(typeAngle('<root>some text|')).toBeNull();
  });

  it('does nothing with no opening tag at all', () => {
    expect(typeAngle('2 |')).toBeNull();
    expect(typeAngle('|')).toBeNull();
  });

  it('skips void elements in html mode but not in xml mode', () => {
    expect(typeAngle('<br|', 'html')).toBeNull();
    expect(typeAngle('<IMG src="a.png"|', 'html')).toBeNull();
    expect(typeAngle('<br|', 'xml')).toBe('<br>|</br>');
  });

  it('closes non-void html elements', () => {
    expect(typeAngle('<div class="x"|', 'html')).toBe('<div class="x">|</div>');
  });

  it('stays out of the way in json and plain-text modes', () => {
    expect(typeAngle('<user|', 'json')).toBeNull();
    expect(typeAngle('<user|', 'text')).toBeNull();
  });

  it('does nothing when there is a selection', () => {
    expect(computeTagClose('<user>abc</user>', 6, 9, 'xml')).toBeNull();
  });
});
