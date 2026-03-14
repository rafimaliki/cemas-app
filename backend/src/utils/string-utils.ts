/**
 * Capitalizes the first letter of each word in a string
 * @param str The input string
 * @returns The string with first letter of each word capitalized
 */
export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
} 