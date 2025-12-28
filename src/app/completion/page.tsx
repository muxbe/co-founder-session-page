'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompleteSessionParams } from '@/features/ai/gemini/tools';

// Extended type to include session_id
interface CompletionDataWithSession extends CompleteSessionParams {
  session_id?: string;
}

export default function CompletionPage() {
  const router = useRouter();
  const [completionData, setCompletionData] = useState<CompletionDataWithSession | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // Get completion data from session storage
    const storedData = sessionStorage.getItem('completionData');
    if (storedData) {
      setCompletionData(JSON.parse(storedData));
    }

    // Set current date
    setCurrentDate(
      new Date().toLocaleDateString('ka-GE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  const viewDocument = () => {
    // Navigate to the Idea Passport page
    if (completionData?.session_id) {
      router.push(`/idea/${completionData.session_id}`);
    } else {
      // Fallback to session page if no sessionId
      router.push('/session');
    }
  };

  const downloadDocument = () => {
    alert('დოკუმენტის ჩამოტვირთვა იწყება...');
    // TODO: Implement PDF download
  };

  const startNextStep = () => {
    alert('მომხმარებლის პორტრეტის შექმნა იწყება...');
    // TODO: Navigate to customer persona builder
  };

  const goToDashboard = () => {
    router.push('/');
  };

  if (!completionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper-bg)]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-[var(--ink-color)]">იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper-bg)]">
      {/* Header */}
      <header className="px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <div className="flex items-center gap-3 -rotate-2">
            <div className="logo-box">C</div>
            <span className="text-[22px] font-bold text-[var(--ink-color)]">Cofounder.ge</span>
          </div>

          {/* Navigation */}
          <nav>
            <ul className="flex gap-6 list-none">
              <li>
                <a href="#" className="text-base font-semibold text-[var(--ink-color)] relative active-nav">
                  დაფა
                </a>
              </li>
              <li>
                <a href="#" className="text-base font-semibold text-[#555] hover:text-[var(--accent-hot)]">
                  ფაილები
                </a>
              </li>
              <li>
                <a href="#" className="text-base font-semibold text-[#555] hover:text-[var(--accent-hot)]">
                  ამოცანები
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          {/* Notification */}
          <button className="w-11 h-11 border-2 border-[var(--ink-color)] rounded-full bg-white flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--ink-color)]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2c2420"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 px-4 py-2 border-2 border-[var(--ink-color)] rounded-[255px_15px_225px_15px] bg-white cursor-pointer transition-transform hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_var(--ink-color)]">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-yellow)] border-2 border-[var(--ink-color)] flex items-center justify-center font-bold">
              გ
            </div>
            <span className="font-medium">გიორგი</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[650px] text-center">
          {/* Success Icon */}
          <div className="text-[80px] mb-5 animate-bounce-in">🎉</div>

          <h1 className="text-[38px] font-bold text-[var(--ink-color)] mb-10 font-[var(--font-handwriting)] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
            იდეის პასპორტი მზადაა!
          </h1>

          {/* Document Preview */}
          <div className="bg-white border-2 border-[var(--ink-color)] rounded-sm p-10 shadow-[6px_6px_0px_rgba(0,0,0,0.1)] mb-10 relative rotate-1 document-preview">
            {/* Tape Effect */}
            <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 -rotate-[1.5deg] w-[120px] h-[35px] bg-white/50 border border-dashed border-[#bbb] backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.05)]" />

            {/* Header Row */}
            <div className="flex justify-between items-start mb-5">
              <div className="text-left">
                <div className="text-[45px] mb-2.5 drop-shadow-[2px_2px_0px_#eee]">📄</div>
                <div className="text-[22px] font-bold mb-1 text-[var(--ink-color)]">
                  იდეის პასპორტი
                </div>
                <div className="text-lg text-[#666] italic font-[var(--font-handwriting)]">
                  &quot;Cofounder.ge&quot;
                </div>
              </div>

              {/* Score Stamp */}
              <div className="w-20 h-20 border-[3px] border-[var(--accent-green)] rounded-[50%_45%_60%_40%/50%_60%_40%_50%] text-[var(--accent-green)] flex flex-col items-center justify-center -rotate-[15deg] shadow-[inset_0_0_10px_rgba(42,157,143,0.1)] opacity-0 animate-stamp-in">
                <span className="font-[var(--font-handwriting)] text-[32px] font-bold leading-none">
                  {completionData.readiness_score * 10}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">ქულა</span>
              </div>
            </div>

            {/* Overview Section */}
            <div className="bg-[#f8f9fa] border-l-[3px] border-[var(--accent-yellow)] p-4 my-5 text-left">
              <div className="text-sm font-bold text-[#888] mb-2 uppercase">მიმოხილვა:</div>
              <ul className="list-none text-sm text-[var(--ink-color)]">
                {completionData.fields_completed.map((fieldKey, index) => (
                  <li key={index} className="mb-1.5 pl-4 relative before:content-['•'] before:text-[var(--accent-hot)] before:font-bold before:absolute before:left-0">
                    {getFieldDisplayName(fieldKey)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[13px] text-[#999] mb-6 border-b-2 border-dashed border-[#eee] pb-4 text-left">
              შექმნილია: {currentDate}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center flex-wrap mt-5">
              <button
                onClick={viewDocument}
                className="px-6 py-2.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] text-base font-bold cursor-pointer transition-all flex items-center gap-2 border-2 border-[var(--ink-color)] bg-[var(--accent-hot)] text-white shadow-[3px_3px_0px_var(--ink-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_var(--ink-color)]"
              >
                👁 ნახვა
              </button>
              <button
                onClick={downloadDocument}
                className="px-6 py-2.5 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] text-base font-bold cursor-pointer transition-all flex items-center gap-2 border-2 border-[var(--ink-color)] bg-white text-[var(--ink-color)] shadow-[3px_3px_0px_rgba(0,0,0,0.05)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_var(--ink-color)]"
              >
                ⬇ ჩამოტვირთვა
              </button>
            </div>
          </div>

          {/* Recommendation Card */}
          <div className="bg-[var(--postit-yellow)] border-2 border-[var(--ink-color)] rounded-[2px_2px_25px_2px] p-8 shadow-[var(--shadow)] -rotate-1 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[28px]">🤖</div>
              <div className="text-xl font-bold font-[var(--font-handwriting)] tracking-wide">
                რეკომენდაცია:
              </div>
            </div>
            <div className="text-base leading-relaxed text-[var(--ink-color)] mb-6 text-left">
              {completionData.overall_assessment}
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={startNextStep}
                className="flex-1 min-w-[200px] px-5 py-3 rounded-lg text-[15px] font-bold cursor-pointer transition-all border-2 border-[var(--ink-color)] bg-[var(--accent-hot)] text-white shadow-[3px_3px_0px_var(--ink-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_var(--ink-color)]"
              >
                დიახ, დავიწყოთ
              </button>
              <button
                onClick={goToDashboard}
                className="flex-1 min-w-[200px] px-5 py-3 rounded-lg text-[15px] font-bold cursor-pointer transition-all border-2 border-[var(--ink-color)] bg-white text-[var(--ink-color)] hover:bg-[#f9f9f9]"
              >
                არა, დაფაზე დაბრუნება
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .logo-box {
          width: 50px;
          height: 50px;
          background: var(--accent-hot);
          border: 2px solid var(--ink-color);
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: var(--font-handwriting);
          font-weight: 700;
          font-size: 28px;
          box-shadow: 2px 2px 0px var(--ink-color);
        }

        .active-nav::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent-hot);
          border-radius: 20px;
          transform: rotate(-1deg);
        }

        .document-preview::before {
          content: '';
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes stamp-in {
          0% {
            transform: scale(2) rotate(0deg);
            opacity: 0;
          }
          80% {
            transform: scale(0.9) rotate(-15deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(-15deg);
            opacity: 1;
          }
        }

        .animate-stamp-in {
          animation: stamp-in 0.5s ease-out 0.8s forwards;
        }
      `}</style>
    </div>
  );
}

function getFieldDisplayName(fieldKey: string): string {
  const fieldNames: Record<string, string> = {
    user_experience: 'მომხმარებლის გამოცდილება',
    problem: 'პრობლემა',
    solution: 'გადაწყვეტა',
    target_users: 'სამიზნე აუდიტორია',
    value_proposition: 'ღირებულების შეთავაზება',
    competition: 'კონკურენცია',
    business_model: 'ბიზნეს მოდელი',
    mvp_features: 'MVP ფუნქციები',
    risks: 'რისკები',
    metrics: 'მეტრიკები',
  };
  return fieldNames[fieldKey] || fieldKey;
}
