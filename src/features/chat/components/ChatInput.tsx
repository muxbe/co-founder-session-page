'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isTextarea?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({
  onSubmit,
  placeholder = 'დაწერე პასუხი...',
  disabled = false,
  isTextarea = true,
  autoFocus = false,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus) {
      if (isTextarea && textareaRef.current) {
        textareaRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [autoFocus, isTextarea]);

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && !disabled) {
      onSubmit(trimmedValue);
      setValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Submit on Enter (without Shift for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const inputClasses = cn(
    'flex-1 px-4 py-3.5 rounded-lg transition-colors duration-200',
    'bg-white text-[var(--text-primary)]',
    'border-2 border-[var(--ink-color)]',
    'placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:border-[var(--accent-hot)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'font-[inherit] text-base',
    isTextarea && 'resize-none min-h-[54px] max-h-[150px]'
  );

  return (
    <div className="flex gap-4 items-center">
      {isTextarea ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={inputClasses}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className={cn(
          'h-[54px] px-8 rounded-lg flex items-center justify-center',
          'bg-[var(--accent-hot)] text-white',
          'border-2 border-[var(--ink-color)]',
          'font-bold text-xl cursor-pointer',
          'hover:scale-105 transition-transform duration-100',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          'focus:outline-none'
        )}
      >
        ➤
      </button>
    </div>
  );
}
