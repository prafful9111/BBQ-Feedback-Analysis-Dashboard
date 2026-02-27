import type { ReactNode } from 'react';

const SENTIMENT_SPAN_PATTERN = /<span\s+style=\"color:\s*(green|red);?\">([\s\S]*?)<\/span>/gi;

export const renderSentimentSummary = (summary: string): ReactNode[] => {
  const nodes: ReactNode[] = [];

  SENTIMENT_SPAN_PATTERN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null = SENTIMENT_SPAN_PATTERN.exec(summary);

  while (match) {
    const fullMatch = match[0];
    const sentimentColor = match[1];
    const text = match[2];

    if (match.index > lastIndex) {
      nodes.push(summary.slice(lastIndex, match.index));
    }

    nodes.push(
      <span key={`${match.index}-${fullMatch.length}`} className={sentimentColor === 'green' ? 'text-green-600' : 'text-red-600'}>
        {text}
      </span>,
    );

    lastIndex = match.index + fullMatch.length;
    match = SENTIMENT_SPAN_PATTERN.exec(summary);
  }

  if (lastIndex < summary.length) {
    nodes.push(summary.slice(lastIndex));
  }

  return nodes;
};
