'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Session } from '@/types';

// PassportField from database (different from Field type)
interface PassportField {
  id: string;
  session_id: string;
  field_key: string;
  question: string;
  content: string | null;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Mapping from field_key to display name and icon
const FIELD_DISPLAY_MAP: Record<string, { name: string; icon: string }> = {
  idea: { name: 'იდეა', icon: '💡' },
  problem: { name: 'პრობლემა', icon: '🔥' },
  solution: { name: 'გამოსავალი', icon: '✨' },
  target_users: { name: 'სამიზნე აუდიტორია', icon: '🎯' },
  value_proposition: { name: 'უნიკალური ღირებულება', icon: '💎' },
  competition: { name: 'კონკურენცია', icon: '⚔️' },
  revenue_model: { name: 'შემოსავლის მოდელი', icon: '💰' },
  business_model: { name: 'ბიზნეს მოდელი', icon: '📊' },
  mvp_features: { name: 'MVP ფუნქციები', icon: '🚀' },
  risks: { name: 'რისკები', icon: '⚠️' },
  metrics: { name: 'მეტრიკები', icon: '📈' },
  test_problem: { name: 'პრობლემა', icon: '🔥' },
};

function getFieldDisplay(fieldKey: string): { name: string; icon: string } {
  return FIELD_DISPLAY_MAP[fieldKey] || { name: fieldKey, icon: '📝' };
}

export default function IdeaPassportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [fields, setFields] = useState<PassportField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  // Fetch session and fields data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/idea/${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch idea data');
        }

        const data = await response.json();
        setSession(data.session);
        setFields(data.fields || []);

        // Set first field as active
        if (data.fields && data.fields.length > 0) {
          setActiveSection(data.fields[0].field_key);
        }
      } catch (err) {
        console.error('Error fetching idea data:', err);
        setError('იდეის მონაცემები ვერ ჩაიტვირთა');
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 200) {
          current = section.getAttribute('id') || '';
        }
      });

      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper-bg)]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">📄</div>
          <p className="text-[var(--ink-color)] text-lg">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper-bg)]">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-[var(--ink-color)] text-lg mb-4">{error || 'იდეა ვერ მოიძებნა'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[var(--accent-hot)] text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            მთავარზე დაბრუნება
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--paper-bg)] bg-[radial-gradient(#e5e5f7_1px,transparent_1px)] bg-[length:20px_20px] overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 px-10 py-5 flex justify-between items-center bg-white border-b-2 border-[var(--ink-color)]">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 -rotate-2 hover:rotate-0 transition-transform">
            <div className="w-[50px] h-[50px] bg-[var(--accent-hot)] border-2 border-[var(--ink-color)] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] flex items-center justify-center text-white font-[var(--font-handwriting)] font-bold text-[28px] shadow-[2px_2px_0px_var(--ink-color)]">
              C
            </div>
            <span className="text-[22px] font-bold text-[var(--ink-color)]">Cofounder.ge</span>
          </Link>

          {/* Navigation */}
          <nav>
            <ul className="flex gap-6 list-none">
              <li>
                <a href="#" className="text-base font-semibold text-[var(--accent-hot)] relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-[3px] after:bg-[var(--accent-hot)] after:rounded-[20px] after:-rotate-1">
                  დაფა
                </a>
              </li>
              <li>
                <a href="#" className="text-base font-semibold text-[var(--ink-color)] hover:text-[var(--accent-hot)] transition">
                  ფაილები
                </a>
              </li>
              <li>
                <a href="#" className="text-base font-semibold text-[var(--ink-color)] hover:text-[var(--accent-hot)] transition">
                  ამოცანები
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          {/* Notification */}
          <button className="w-[45px] h-[45px] border-2 border-[var(--ink-color)] rounded-full bg-white flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--ink-color)] transition-all">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2c2420" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 px-4 py-2 border-2 border-[var(--ink-color)] rounded-[255px_15px_225px_15px] bg-white cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_var(--ink-color)]">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-yellow)] border-2 border-[var(--ink-color)] flex items-center justify-center font-bold">
              გ
            </div>
            <span className="font-medium">გიორგი</span>
          </div>
        </div>
      </header>

      {/* Main Content - Fixed sidebar, scrollable content */}
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-5 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-[60px] overflow-hidden">
        {/* Sidebar Navigation - Fixed, no scroll */}
        <aside className="hidden lg:block p-2.5 py-10 h-[calc(100vh-80px)] overflow-y-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#666] hover:text-[var(--accent-hot)] mb-8 transition"
          >
            ← დაფაზე დაბრუნება
          </Link>

          <div className="mb-8 pl-2.5">
            <div className="text-sm text-[#888] font-[var(--font-handwriting)]">პროექტი:</div>
            <div className="text-[28px] font-bold text-[var(--ink-color)] leading-tight">
              {session.idea_title || 'იდეის პასპორტი'}
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex flex-col gap-3 lg:flex-col overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            {fields.map((field) => {
              const display = getFieldDisplay(field.field_key);
              return (
                <a
                  key={field.id}
                  href={`#${field.field_key}`}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg text-base font-semibold
                    transition-all whitespace-nowrap
                    ${activeSection === field.field_key
                      ? 'bg-[var(--accent-yellow)] border-2 border-[var(--ink-color)] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] -rotate-1'
                      : 'text-[var(--ink-color)] border-2 border-transparent hover:bg-[rgba(233,196,106,0.2)] hover:pl-5'
                    }
                  `}
                >
                  <span>{display.icon} {display.name}</span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content Stream - Scrollable */}
        <div className="flex flex-col gap-[60px] pb-24 py-10 h-[calc(100vh-80px)] overflow-y-auto">
          {fields.map((field, index) => {
            const display = getFieldDisplay(field.field_key);
            return (
              <section
                key={field.id}
                id={field.field_key}
                className="bg-white rounded-xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative scroll-mt-[120px]"
              >
                {/* Paperclip */}
                <div className="paperclip" />

                {/* Section Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <span className="text-[32px] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                      {display.icon}
                    </span>
                    <h2 className="text-[26px] font-bold text-[var(--ink-color)] font-[var(--font-handwriting)]">
                      {display.name}
                    </h2>
                  </div>
                  <button className="bg-transparent border-2 border-[#e5e7eb] text-[#9ca3af] px-4 py-1.5 rounded-[20px] cursor-pointer font-bold text-sm transition-all hover:bg-white hover:text-[var(--accent-hot)] hover:border-[var(--accent-hot)]">
                    ✎ შეცვლა
                  </button>
                </div>

                {/* Section Body */}
                <div className="text-lg leading-[1.8] text-[#374151]">
                  {field.content ? (
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatContent(field.content)
                      }}
                    />
                  ) : (
                    <p className="text-[#9ca3af] italic">
                      ჯერ არ არის შევსებული...
                    </p>
                  )}
                </div>

                {/* Show stamp on first section only */}
                {index === 0 && field.content && (
                  <div className="absolute bottom-8 right-8 border-[3px] border-[var(--accent-green)] text-[var(--accent-green)] px-3 py-2 -rotate-[15deg] font-bold font-[var(--font-handwriting)] rounded-lg opacity-60 pointer-events-none">
                    CORE VALUE
                  </div>
                )}
              </section>
            );
          })}

          {/* Empty state if no fields */}
          {fields.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-lg text-[#666]">
                ჯერ არ არის ველები. დაიწყეთ სესია იდეის პასპორტის შესაქმნელად.
              </p>
              <Link
                href="/session"
                className="inline-block mt-6 px-6 py-3 bg-[var(--accent-hot)] text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                სესიის დაწყება
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Format content for display - converts markdown-like text to HTML
 */
function formatContent(content: string): string {
  if (!content) return '';

  // Convert line breaks to paragraphs
  let formatted = content
    .split('\n\n')
    .map(para => `<p>${para}</p>`)
    .join('');

  // Convert bullet points
  formatted = formatted.replace(
    /<p>[-•]\s*(.+?)<\/p>/g,
    '<li>$1</li>'
  );

  // Wrap consecutive li elements in ul
  formatted = formatted.replace(
    /(<li>.+?<\/li>)+/g,
    '<ul class="list-disc pl-5 my-4">$&</ul>'
  );

  // Convert numbered lists
  formatted = formatted.replace(
    /<p>(\d+)\.\s*(.+?)<\/p>/g,
    '<li>$2</li>'
  );

  // Bold text
  formatted = formatted.replace(
    /\*\*(.+?)\*\*/g,
    '<strong>$1</strong>'
  );

  // Single line breaks to br
  formatted = formatted.replace(
    /([^>])\n([^<])/g,
    '$1<br/>$2'
  );

  return formatted;
}
