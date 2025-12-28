'use client';

import type { UserExperience } from '@/types';

interface DocumentHeaderProps {
  userExperience?: UserExperience;
}

/**
 * Get role icon based on user experience
 */
function getRoleIcon(experience?: UserExperience): string {
  if (!experience) return '📄';

  switch (experience.role) {
    case 'student':
      return '🎓';
    case 'employed':
      return '💼';
    case 'founder':
      return '🚀';
    default:
      return '📄';
  }
}

/**
 * Get role display name in Georgian
 */
function getRoleName(experience?: UserExperience): string {
  if (!experience) return '';

  switch (experience.role) {
    case 'student':
      return 'სტუდენტი';
    case 'employed':
      return 'დასაქმებული';
    case 'founder':
      return 'ფაუნდერი';
    default:
      return '';
  }
}

/**
 * Get startup knowledge level
 */
function getKnowledgeLevel(experience?: UserExperience): string {
  if (!experience?.startup_knowledge) return '';

  switch (experience.startup_knowledge) {
    case 'beginner':
      return 'დამწყები';
    case 'intermediate':
      return 'შუალედური';
    case 'expert':
      return 'ექსპერტი';
    default:
      return '';
  }
}

/**
 * Document Header Component
 * Shows icon, title, and experience badge
 */
export function DocumentHeader({ userExperience }: DocumentHeaderProps) {
  const icon = getRoleIcon(userExperience);
  const roleName = getRoleName(userExperience);
  const knowledgeLevel = getKnowledgeLevel(userExperience);

  return (
    <div>
      {/* Icon with experience badge */}
      <div className="notion-icon relative">
        {icon}
        {userExperience && roleName && (
          <div
            className="absolute -top-1 -right-1 bg-[var(--accent-blue)] text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm"
            title={`${roleName} • ${knowledgeLevel}`}
          >
            {roleName}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="notion-title">იდეის პასპორტი</div>

      {/* Experience level indicator (subtle) */}
      {userExperience && knowledgeLevel && (
        <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
          <span>📊</span>
          <span>სტარტაპ ცოდნა: {knowledgeLevel}</span>
        </div>
      )}
    </div>
  );
}
