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

        {/* Example indicator */}
        {message.metadata?.is_example && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--accent-hot)] font-medium">
              💡 მაგალითი შენი იდეისთვის
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
