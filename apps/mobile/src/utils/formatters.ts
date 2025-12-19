// apps/mobile/src/utils/formatters.ts
/**
 * Formats a focus area string into a hashtag format
 * @param focusArea - The focus area string to format
 * @returns The formatted hashtag string (e.g., "#react-native")
 */
export function formatFocusAreaTag(focusArea: string): string {
  return '#' + focusArea.toLowerCase().replace(/\s+/g, '-')
}
