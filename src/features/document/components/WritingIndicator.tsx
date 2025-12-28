'use client';

interface WritingIndicatorProps {
  text?: string;
}

/**
 * Writing Indicator Component
 * Shows animated dots when AI is writing content
 *
 * Features:
 * - Animated pulsing dots
 * - Customizable text
 * - Matches Notion-style aesthetics
 */
export function WritingIndicator({ text = 'იწერება' }: WritingIndicatorProps) {
  return (
    <div className="notion-block text-[var(--accent-yellow)] flex items-center gap-2">
      <span className="writing-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
