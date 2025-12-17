'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { UserExperience } from '@/types';

interface ExperienceCardsProps {
  onComplete: (experience: UserExperience) => void;
}

type Step = 'role' | 'experience' | 'stage';

const ROLES = [
  { value: 'student', label: 'სტუდენტი', icon: '🎓' },
  { value: 'employed', label: 'დასაქმებული', icon: '💼' },
  { value: 'founder', label: 'ფაუნდერი', icon: '🚀' },
  { value: 'other', label: 'სხვა', icon: '👤' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'none', label: 'არ მაქვს' },
  { value: '1-2_years', label: '1-2 წელი' },
  { value: '3-5_years', label: '3-5 წელი' },
  { value: '5+_years', label: '5+ წელი' },
] as const;

const IDEA_STAGES = [
  { value: 'just_idea', label: 'უბრალოდ იდეა', description: 'ჯერ მხოლოდ ვფიქრობ' },
  { value: 'validating', label: 'ვამოწმებ', description: 'ვკითხავ ხალხს, ვიკვლევ' },
  { value: 'building', label: 'ვაშენებ', description: 'უკვე ვქმნი პროდუქტს' },
  { value: 'launched', label: 'გავუშვი', description: 'უკვე მაქვს მომხმარებლები' },
] as const;

export function ExperienceCards({ onComplete }: ExperienceCardsProps) {
  const [step, setStep] = useState<Step>('role');
  const [experience, setExperience] = useState<Partial<UserExperience>>({});

  const handleRoleSelect = (role: UserExperience['role']) => {
    setExperience((prev) => ({ ...prev, role }));
    setStep('experience');
  };

  const handleExperienceSelect = (business_experience: UserExperience['business_experience']) => {
    // Determine startup_knowledge based on business_experience
    const startup_knowledge: UserExperience['startup_knowledge'] =
      business_experience === 'none' ? 'beginner' :
      business_experience === '1-2_years' ? 'beginner' :
      business_experience === '3-5_years' ? 'intermediate' : 'expert';

    setExperience((prev) => ({ ...prev, business_experience, startup_knowledge }));
    setStep('stage');
  };

  const handleStageSelect = (idea_stage: UserExperience['idea_stage']) => {
    const finalExperience: UserExperience = {
      role: experience.role!,
      business_experience: experience.business_experience!,
      startup_knowledge: experience.startup_knowledge!,
      idea_stage,
    };
    onComplete(finalExperience);
  };

  return (
    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm max-w-lg animate-fade-in">
      {/* Step 1: Role Selection */}
      {step === 'role' && (
        <>
          <p className="mb-4 font-medium">რა აღწერს შენ საუკეთესოდ?</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleSelect(role.value)}
                className={cn(
                  'experience-card p-4 rounded-xl border-2 border-[var(--border)] text-center',
                  'hover:border-[var(--accent-yellow)] hover:bg-[var(--accent-yellow-light)]',
                  'transition-all duration-200'
                )}
              >
                <span className="text-2xl block mb-2">{role.icon}</span>
                <span className="text-sm font-medium">{role.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 2: Business Experience */}
      {step === 'experience' && (
        <>
          <p className="mb-4 font-medium">რა გამოცდილება გაქვს ბიზნესში?</p>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => handleExperienceSelect(level.value)}
                className={cn(
                  'w-full p-3 rounded-xl border-2 border-[var(--border)] text-left',
                  'hover:border-[var(--accent-yellow)] hover:bg-[var(--accent-yellow-light)]',
                  'transition-all duration-200'
                )}
              >
                <span className="font-medium">{level.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 3: Idea Stage */}
      {step === 'stage' && (
        <>
          <p className="mb-4 font-medium">რა ეტაპზეა შენი იდეა?</p>
          <div className="space-y-2">
            {IDEA_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => handleStageSelect(stage.value)}
                className={cn(
                  'w-full p-3 rounded-xl border-2 border-[var(--border)] text-left',
                  'hover:border-[var(--accent-yellow)] hover:bg-[var(--accent-yellow-light)]',
                  'transition-all duration-200'
                )}
              >
                <span className="font-medium block">{stage.label}</span>
                <span className="text-sm text-[var(--text-muted)]">{stage.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {['role', 'experience', 'stage'].map((s, i) => (
          <div
            key={s}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              step === s ? 'bg-[var(--accent-yellow)]' :
              ['role', 'experience', 'stage'].indexOf(step) > i ? 'bg-[var(--accent-green)]' :
              'bg-[var(--border)]'
            )}
          />
        ))}
      </div>
    </div>
  );
}
