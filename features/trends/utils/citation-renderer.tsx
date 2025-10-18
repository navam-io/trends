import React from 'react';

/**
 * Parse text with <cite> tags and render them as superscript citation numbers
 *
 * Example input: 'OpenAI <cite index="1-7">unveiled</cite> Sora 2'
 * Example output: OpenAI unveiled[1] Sora 2
 */
export function parseCitationsToReact(text: string): React.ReactNode {
  if (!text) return text;

  // Split by <cite> tags while preserving the tags
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Regex to match <cite index="...">content</cite>
  const citeRegex = /<cite\s+index="([^"]+)">([^<]*)<\/cite>/g;
  let match;

  while ((match = citeRegex.exec(text)) !== null) {
    // Add text before the cite tag
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Extract citation index and content
    const indexValue = match[1]; // e.g., "41-1" or "1-7-8"
    const content = match[2]; // The cited text

    // Extract just the first number from the index (e.g., "41" from "41-1")
    const citationNumber = indexValue.split('-')[0];

    // Add the content with a superscript citation number
    parts.push(
      <React.Fragment key={`cite-${match.index}`}>
        {content}
        <sup className="text-blue-600 font-semibold mx-0.5 cursor-help" title={`Citation ${citationNumber}`}>
          [{citationNumber}]
        </sup>
      </React.Fragment>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last cite tag
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

/**
 * Strip cite tags completely and return plain text
 * Useful for cases where we just want the text content
 */
export function stripCiteTags(text: string): string {
  if (!text) return text;
  return text.replace(/<cite\s+index="[^"]+">([^<]*)<\/cite>/g, '$1');
}
