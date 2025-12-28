'use client';

import type { Field, UserExperience } from '@/types';
import { DocumentHeader } from './DocumentHeader';
import { DocumentProperties } from './DocumentProperties';
import { FieldsList } from './FieldsList';

interface DocumentPanelProps {
  fields: Field[];
  currentDate?: string;
  status: string;
  userExperience?: UserExperience;
}

/**
 * Main Document Panel Component
 * Displays the business idea passport in Notion-style format
 */
export function DocumentPanel({
  fields,
  currentDate,
  status,
  userExperience,
}: DocumentPanelProps) {
  return (
    <div className="hidden lg:block bg-white overflow-y-auto h-full">
      <div className="p-10">
        <div className="notion-page">
          {/* Header with icon and title */}
          <DocumentHeader userExperience={userExperience} />

          {/* Properties section */}
          <DocumentProperties currentDate={currentDate} status={status} />

          {/* Fields list */}
          <FieldsList fields={fields} />

          {/* Cursor hint */}
          <div className="mt-5 text-[#d3d1cb] text-sm">
            Type &apos;/&apos; for commands
          </div>
        </div>
      </div>
    </div>
  );
}
