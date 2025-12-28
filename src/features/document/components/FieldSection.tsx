'use client';

import type { Field } from '@/types';
import { ExpandableContent } from './ExpandableContent';
import { WritingIndicator } from './WritingIndicator';

interface FieldSectionProps {
  field: Field;
}

/**
 * Field Section Component
 * Renders a single field with its content, writing indicator, or placeholder
 */
export function FieldSection({ field }: FieldSectionProps) {
  return (
    <div className="animate-fade-in">
      {/* Field Header */}
      <div className="notion-h2">
        {field.icon} {field.name}
        {field.status === 'complete' && (
          <span
            className="text-[var(--accent-green)] animate-pop ml-2"
            title="დასრულებული"
          >
            ✓
          </span>
        )}
      </div>

      {/* Field Content */}
      {field.content ? (
        <ExpandableContent
          content={field.content}
          fieldKey={field.field_key}
          maxLength={150}
        />
      ) : field.status === 'active' ? (
        <WritingIndicator text="იწერება" />
      ) : (
        <div className="notion-block notion-placeholder">
          დააჭირეთ რომ დაწეროთ...
        </div>
      )}
    </div>
  );
}
