'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/features/chat/hooks/useChat';
import {
  ChatMessage,
  TypingIndicator,
  ChatInput,
} from '@/features/chat/components';
import {
  createSession,
  saveMessage,
  updateSessionIdea,
  updateSessionExperience,
} from '@/features/session';
import type { UserExperience } from '@/types';

export default function SessionPage() {
  const {
    state,
    isTyping,
    startSession,
    submitIdea,
    submitAnswer,
  } = useChat();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, isTyping]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createSession();
        setSessionId(session.id);
        startSession(session.id);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    };

    if (!isInitialized) {
      initSession();
    }
  }, [isInitialized, startSession]);

  // Handle message submission (idea or answer)
  const handleMessageSubmit = async (message: string) => {
    if (!sessionId) return;

    // Save to Supabase
    try {
      await saveMessage(sessionId, 'user', message);

      // If this is the first message (idea), update session idea
      if (state.status === 'intro') {
        await updateSessionIdea(sessionId, message);
        submitIdea(message);
      } else {
        // Otherwise it's an answer to a question
        submitAnswer(message);
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Calculate progress
  const progress = state.fields.length > 0
    ? Math.round(
        (state.fields.filter((f) => f.status === 'complete').length / state.fields.length) * 100
      )
    : 0;

  // Get status text
  const getStatusText = () => {
    switch (state.status) {
      case 'intro':
        return 'დაწყება';
      case 'analyzing':
        return 'ანალიზი...';
      case 'in-progress':
        return 'მიმდინარე';
      case 'session-complete':
        return 'დასრულებული';
      default:
        return 'მიმდინარე';
    }
  };

  const closeWorkflow = () => {
    if (confirm('გამოსვლა?')) {
      window.location.href = '/';
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--paper-bg)]">
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-3 flex justify-between items-center bg-white border-b border-[var(--border)]">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 -rotate-2">
            <div className="logo-box">C</div>
            <span className="text-lg font-bold text-[var(--ink-color)]">Cofounder.ge</span>
          </div>

          {/* Navigation */}
          <nav>
            <ul className="flex gap-5 list-none">
              <li>
                <a href="#" className="text-[15px] font-medium text-[#555] hover:text-[var(--accent-hot)]">
                  დაფა
                </a>
              </li>
              <li>
                <a href="#" className="text-[15px] font-medium text-[#555] hover:text-[var(--accent-hot)]">
                  ფაილები
                </a>
              </li>
              <li>
                <a href="#" className="text-[15px] font-medium text-[#555] hover:text-[var(--accent-hot)]">
                  ამოცანები
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification */}
          <button className="w-9 h-9 border border-[#ddd] rounded-md bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50">
            🔔
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded bg-[var(--accent-yellow)] flex items-center justify-center font-bold text-xs">
              გ
            </div>
            <span className="text-sm font-medium">გიორგი</span>
          </div>
        </div>
      </header>

      {/* Progress Bar Row */}
      <div className="flex-shrink-0 bg-white px-8 py-2.5 border-b border-[var(--border)] flex items-center gap-5">
        <div className="text-sm font-semibold text-[#555] min-w-[120px]">
          იდეის პასპორტი
        </div>
        <div className="flex-1 flex items-center gap-2.5">
          <div className="flex-1 h-2 bg-[#f0f0f0] rounded overflow-hidden">
            <div
              className="h-full bg-[var(--accent-hot)] rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[13px] font-semibold text-[#888] font-[var(--font-handwriting)]">
            {progress}%
          </div>
        </div>
        <button
          onClick={closeWorkflow}
          className="bg-transparent border-none text-lg text-[#999] cursor-pointer hover:text-[#666]"
        >
          ✕
        </button>
      </div>

      {/* Main Content - 60/40 Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[60%_40%] overflow-hidden">
        {/* Left Panel - Chat (60%) */}
        <div className="flex flex-col bg-[var(--chat-bg)] border-r border-[var(--border)] h-full overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            {/* Render all messages */}
            {state.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Scroll anchor */}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 px-10 py-6 bg-white border-t border-[#ddd] shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
            <ChatInput
              onSubmit={handleMessageSubmit}
              placeholder={
                state.status === 'intro'
                  ? 'აღწერე შენი ბიზნეს იდეა...'
                  : 'დაწერე პასუხი...'
              }
              disabled={
                state.status !== 'intro' && state.status !== 'in-progress' && !isTyping
              }
              isTextarea={true}
              autoFocus={state.status === 'intro' && state.messages.length > 0}
            />
          </div>
        </div>

        {/* Right Panel - Document (40%) */}
        <div className="hidden lg:block bg-white overflow-y-auto h-full">
          <div className="p-10">
            <div className="notion-page">
              {/* Icon and Title */}
              <div className="notion-icon">📄</div>
              <div className="notion-title">იდეის პასპორტი</div>

              {/* Properties */}
              <div className="notion-properties">
                <div className="property-row">
                  <div className="property-label">📅 შექმნილია</div>
                  <div className="property-value">
                    {new Date().toLocaleDateString('ka-GE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="property-row">
                  <div className="property-label">👤 ავტორი</div>
                  <div className="property-value">გიორგი</div>
                </div>
                <div className="property-row">
                  <div className="property-label">🏷 სტატუსი</div>
                  <div className="property-value">
                    <span className="status-pill">{getStatusText()}</span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              {state.fields.length > 0 ? (
                state.fields.map((field) => (
                  <div key={field.id}>
                    <div className="notion-h2">
                      {field.icon} {field.name}
                      {field.status === 'complete' && (
                        <span className="text-[var(--accent-green)] animate-pop">✓</span>
                      )}
                    </div>
                    {field.content ? (
                      <div className={`notion-callout ${
                        field.field_key === 'problem' ? 'bg-pink' : 'bg-warm'
                      }`}>
                        <div className="callout-icon">
                          {field.field_key === 'problem' ? '🛑' : '✨'}
                        </div>
                        <div className="callout-content">{field.content}</div>
                      </div>
                    ) : field.status === 'active' ? (
                      <div className="notion-block text-[var(--accent-yellow)] flex items-center gap-2">
                        <span className="writing-dots">
                          <span className="dot">.</span>
                          <span className="dot">.</span>
                          <span className="dot">.</span>
                        </span>
                        <span className="text-sm">იწერება</span>
                      </div>
                    ) : (
                      <div className="notion-block notion-placeholder">
                        დააჭირეთ რომ დაწეროთ...
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Default placeholder fields
                <>
                  <div className="notion-h2">🔥 პრობლემა</div>
                  <div className="notion-block notion-placeholder">
                    დააჭირეთ რომ დაწეროთ...
                  </div>

                  <div className="notion-h2">💡 გადაწყვეტა</div>
                  <div className="notion-block notion-placeholder">
                    დააჭირეთ რომ დაწეროთ...
                  </div>

                  <div className="notion-h2">🎯 სამიზნე მომხმარებელი</div>
                  <div className="notion-block notion-placeholder">
                    დააჭირეთ რომ დაწეროთ...
                  </div>

                  <div className="notion-h2">🚀 MVP ფუნქციები</div>
                  <div className="notion-block notion-placeholder">
                    დააჭირეთ რომ დაწეროთ...
                  </div>
                </>
              )}

              {/* Cursor hint */}
              <div className="mt-5 text-[#d3d1cb] text-sm">
                Type &apos;/&apos; for commands
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
