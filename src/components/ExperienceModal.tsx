'use client';

import { useState } from 'react';
import { UserExperience } from '@/types';

interface ExperienceModalProps {
  isOpen: boolean;
  onComplete: (experience: UserExperience) => void;
}

export function ExperienceModal({ isOpen, onComplete }: ExperienceModalProps) {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState<Partial<UserExperience>>({});

  if (!isOpen) return null;

  const handleSelect = (field: keyof UserExperience, value: string) => {
    const updatedExperience = { ...experience, [field]: value };
    setExperience(updatedExperience);

    // Move to next step
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete - all 4 questions answered
      onComplete(updatedExperience as UserExperience);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">👋 გაიცანით!</h2>
          <p className="text-blue-100 mt-1">რამდენიმე კითხვა თქვენს შესახებ</p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            კითხვა {step} / 4
          </p>
        </div>

        {/* Question Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                რა არის თქვენი როლი?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelect('role', 'student')}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="font-medium text-gray-900">სტუდენტი</div>
                  <div className="text-xs text-gray-500">მოსწავლე ან სტუდენტი</div>
                </button>
                <button
                  onClick={() => handleSelect('role', 'employed')}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="text-2xl mb-1">💼</div>
                  <div className="font-medium text-gray-900">დასაქმებული</div>
                  <div className="text-xs text-gray-500">მუშაობ კომპანიაში</div>
                </button>
                <button
                  onClick={() => handleSelect('role', 'founder')}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="text-2xl mb-1">🚀</div>
                  <div className="font-medium text-gray-900">დამფუძნებელი</div>
                  <div className="text-xs text-gray-500">ბიზნესის მფლობელი</div>
                </button>
                <button
                  onClick={() => handleSelect('role', 'other')}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="text-2xl mb-1">✨</div>
                  <div className="font-medium text-gray-900">სხვა</div>
                  <div className="text-xs text-gray-500">არცერთი ზემოთ</div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                გაქვთ ბიზნესის გამოცდილება?
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSelect('business_experience', 'none')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">არა, არ მაქვს</div>
                  <div className="text-xs text-gray-500">პირველი ბიზნესია</div>
                </button>
                <button
                  onClick={() => handleSelect('business_experience', '1-2_years')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">1-2 წელი</div>
                  <div className="text-xs text-gray-500">მცირე გამოცდილება მაქვს</div>
                </button>
                <button
                  onClick={() => handleSelect('business_experience', '3-5_years')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">3-5 წელი</div>
                  <div className="text-xs text-gray-500">საშუალო გამოცდილება</div>
                </button>
                <button
                  onClick={() => handleSelect('business_experience', '5+_years')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">5+ წელი</div>
                  <div className="text-xs text-gray-500">დიდი გამოცდილება მაქვს</div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                რამდენად იცნობთ სტარტაპებს?
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSelect('startup_knowledge', 'beginner')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">დამწყები</div>
                  <div className="text-xs text-gray-500">ახლახან დავიწყე შესწავლა</div>
                </button>
                <button
                  onClick={() => handleSelect('startup_knowledge', 'intermediate')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">საშუალო</div>
                  <div className="text-xs text-gray-500">ვიცი ძირითადი პრინციპები</div>
                </button>
                <button
                  onClick={() => handleSelect('startup_knowledge', 'expert')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">ექსპერტი</div>
                  <div className="text-xs text-gray-500">მაქვს სიღრმისეული ცოდნა</div>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                რა ეტაპზეა იდეა?
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSelect('idea_stage', 'just_idea')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">მხოლოდ იდეა</div>
                  <div className="text-xs text-gray-500">ჯერ არაფერი გაკეთებულა</div>
                </button>
                <button
                  onClick={() => handleSelect('idea_stage', 'validating')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">ვალიდაცია</div>
                  <div className="text-xs text-gray-500">ვამოწმებ ბაზარს</div>
                </button>
                <button
                  onClick={() => handleSelect('idea_stage', 'building')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">ვაშენებ</div>
                  <div className="text-xs text-gray-500">MVP-ს ვქმნი</div>
                </button>
                <button
                  onClick={() => handleSelect('idea_stage', 'launched')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-900">გაშვებული</div>
                  <div className="text-xs text-gray-500">მომხმარებლები მყავს</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back Button (only show after step 1) */}
        {step > 1 && (
          <div className="px-6 pb-6">
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <span>←</span> უკან
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
