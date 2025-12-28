'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  userName?: string;
}

export function ChatMessage({ message, userName = 'გიორგი' }: ChatMessageProps) {
  const isBot = message.type === 'bot';
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-[var(--background-alt)] text-[var(--text-muted)] text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col animate-fade-in">
      {/* Message Header */}
      <div
        className={cn(
          'flex items-center gap-2 mb-1.5',
          !isBot && 'self-end flex-row-reverse'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold',
            isBot ? 'bg-[#555] text-white' : 'bg-[var(--accent-hot)] text-white'
          )}
        >
          {isBot ? '🤖' : userName.charAt(0).toUpperCase()}
        </div>
        {/* Name */}
        <span className="text-[13px] font-semibold text-[#444]">
          {isBot ? 'Cofounder' : userName}
        </span>
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'message-bubble',
          isBot ? 'bot' : 'user self-end'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Enhanced examples display (Phase 5) */}
        {message.metadata?.is_example && message.metadata.examples && message.metadata.examples.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.metadata.examples.map((example, idx) => {
              // Support both string examples and object examples
              const isObjectExample = typeof example === 'object' && example !== null;
              const exampleText = isObjectExample ? (example as any).text : example;
              const whyGood = isObjectExample ? (example as any).why_good : null;
              const relevance = isObjectExample ? (example as any).relevance : null;

              return (
                <div
                  key={idx}
                  className="example-card pl-4 border-l-2 border-[var(--accent-yellow)] bg-yellow-50 p-3 rounded-r transition-all hover:bg-yellow-100 hover:shadow-sm"
                >
                  <div className="font-medium text-sm mb-1 text-gray-900">
                    {idx + 1}. {exampleText}
                  </div>
                  {whyGood && (
                    <div className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                      <span className="flex-shrink-0">✓</span>
                      <span>{whyGood}</span>
                    </div>
                  )}
                  {relevance && (
                    <div className="text-xs text-[var(--accent-hot)] mt-1 flex items-start gap-1">
                      <span className="flex-shrink-0">🎯</span>
                      <span>{relevance}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Suggestion indicator */}
        {message.metadata?.is_suggestion && !message.metadata.examples && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <span className="text-sm text-blue-600 font-medium">
              💬 რჩევა
            </span>
          </div>
        )}

        {/* Reference indicator */}
        {message.metadata?.references_field && (
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            🔗 მიუთითებს: {message.metadata.references_field}
          </div>
        )}
      </div>
    </div>
  );
}
