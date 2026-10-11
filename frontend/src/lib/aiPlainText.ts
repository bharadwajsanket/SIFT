/**
 * Clean plain-text converter for AI Overview responses.
 * Preserves paragraphs, lists, and code content while stripping markdown markup.
 */
export function getCleanPlainText(markdown: string): string {
  if (!markdown) return '';

  return markdown
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove code block backtick delimiters (keep code content intact)
    .replace(/^```[a-zA-Z0-9_-]*\s*$/gm, '')
    // Remove markdown headers (#, ##, ###, etc.)
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Strip inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Strip bold and italic markup
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Strip markdown links: [text](url) -> text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Strip blockquote markers
    .replace(/^>\s+/gm, '')
    // Collapse 3+ newlines into double newlines (paragraphs)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
