'use client';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--accent-yellow)] flex items-center justify-center text-lg flex-shrink-0">
        🤖
      </div>

      {/* Typing bubble */}
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">
          გიორგი
        </div>
        <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm inline-block">
          <div className="writing-dots flex gap-1">
            <span className="dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
            <span className="dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
            <span className="dot w-2 h-2 bg-[var(--text-muted)] rounded-full"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
