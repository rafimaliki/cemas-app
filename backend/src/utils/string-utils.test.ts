import { describe, it, expect } from 'vitest';
import { capitalizeWords } from './string-utils.js';

describe('String Utils', () => {
  describe('capitalizeWords', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(capitalizeWords('')).toBe('');
    });

    it('should handle single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    it('should handle already capitalized words', () => {
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle mixed case words', () => {
      expect(capitalizeWords('hElLo wOrLd')).toBe('Hello World');
    });
  });
}); 