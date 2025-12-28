'use client';

import { useState, useRef, useEffect } from 'react';

interface ExpandableContentProps {
  content: string;
  fieldKey: string;
  maxLength?: number;
}

/**
 * Expandable Content Component
 * KEY FEATURE: Truncates content and expands on hover
 *
 * Features:
 * - Truncates at maxLength characters (default: 150)
 * - Expands smoothly on hover
 * - Collapses on mouse leave
 * - Shows hint for truncated content
 */
export function ExpandableContent({
  content,
  fieldKey,
  maxLength = 150,
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Determine if content needs truncation
  useEffect(() => {
    setShouldTruncate(content.length > maxLength);
  }, [content, maxLength]);

  // Determine background color based on field key
  const getBgClass = () => {
    switch (fieldKey) {
      case 'problem':
        return 'bg-pink';
      case 'solution':
        return 'bg-warm';
      case 'target_users':
        return 'bg-blue';
      case 'competitive_advantage':
        return 'bg-purple';
      case 'revenue_model':
        return 'bg-green';
      default:
        return 'bg-warm';
    }
  };

  // Get icon based on field key
  const getIcon = () => {
    switch (fieldKey) {
      case 'problem':
        return '🛑';
      case 'solution':
        return '✨';
      case 'target_users':
        return '🎯';
      case 'competitive_advantage':
        return '💪';
      case 'revenue_model':
        return '💰';
      default:
        return '✨';
    }
  };

  // Truncate content if needed
  const displayContent = shouldTruncate && !isExpanded
    ? content.substring(0, maxLength) + '...'
    : content;

  return (
    <div
      ref={contentRef}
      className={`notion-callout ${getBgClass()} relative group cursor-pointer transition-all duration-300`}
      onMouseEnter={() => shouldTruncate && setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        maxHeight: isExpanded ? 'none' : shouldTruncate ? '100px' : 'auto',
        overflow: 'hidden',
      }}
    >
      <div className="callout-icon">{getIcon()}</div>
      <div className="callout-content">
        {displayContent}

        {/* Hover hint - only show when truncated and not expanded */}
        {shouldTruncate && !isExpanded && (
          <div className="absolute bottom-2 right-3 text-[10px] text-[var(--text-muted)] bg-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            ჰოვერი სრულად სანახავად
          </div>
        )}
      </div>
    </div>
  );
}
