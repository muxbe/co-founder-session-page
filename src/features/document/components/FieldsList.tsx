'use client';

import type { Field } from '@/types';
import { FieldSection } from './FieldSection';

interface FieldsListProps {
  fields: Field[];
}

/**
 * Fields List Component
 * Renders all passport fields or empty state
 */
export function FieldsList({ fields }: FieldsListProps) {
  if (fields.length === 0) {
    return (
      <div className="notion-block text-[var(--text-muted)] text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <p>პასპორტის ველები გამოჩნდება საუბრის დროს...</p>
      </div>
    );
  }

  return (
    <>
      {fields.map((field) => (
        <FieldSection key={field.id} field={field} />
      ))}
    </>
  );
}
