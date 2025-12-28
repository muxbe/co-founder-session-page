'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/features/chat/hooks';
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
import { ExperienceModal } from '@/components/ExperienceModal'; // 🆕 Phase 4
import { DocumentPanel } from '@/features/document'; // 🆕 Phase 6

export default function SessionPage() {
  const {
    state,
    isTyping,
    startSession,
    submitIdea,
    submitAnswer,
    handleExperienceComplete, // 🆕 Phase 4
  } = useChat();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Set current date on client side only (prevents hydration mismatch)
  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('ka-GE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, isTyping]);

  // Initialize session on mount (with protection against double initialization)
  useEffect(() => {
    const initSession = async () => {
      // Prevent double initialization in React Strict Mode
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;

      try {
        const session = await createSession();
        setSessionId(session.id);
        setIsOfflineMode(false);
        startSession(session.id);
      } catch (error) {
        console.error('Failed to create session (Supabase unreachable), using offline mode:', error);
        // Create a local-only session
        const localSessionId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        setSessionId(localSessionId);
        setIsOfflineMode(true);
        startSession(localSessionId);
      }
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Handle message submission (idea or answer)
  const handleMessageSubmit = async (message: string) => {
    console.log('[SessionPage] handleMessageSubmit called, sessionId:', sessionId, 'status:', state.status);
    if (!sessionId) {
      console.error('[SessionPage] ERROR: sessionId is null!');
      return;
    }

    // Save to Supabase (skip if offline)
    if (!isOfflineMode) {
      try {
        await saveMessage(sessionId, 'user', message);

        // If this is the first message (idea), update session idea
        if (state.status === 'ready') {
          await updateSessionIdea(sessionId, message);
        }
      } catch (error) {
        console.error('Failed to save message (offline mode):', error);
        setIsOfflineMode(true); // Switch to offline mode on error
      }
    }

    // Update local state (works in both online and offline mode)
    console.log('[SessionPage] Calling', state.status === 'ready' ? 'submitIdea' : 'submitAnswer');
    if (state.status === 'ready') {
      submitIdea(message);
    } else {
      submitAnswer(message);
    }
  };

  // Calculate progress
  const progress = state.fields.length > 0
    ? Math.round(
        (state.fields.filter((f) => f.status === 'complete').length / state.fields.length) * 100
      )
    : 0;

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
        {isOfflineMode && (
          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            📴 ოფლაინ რეჟიმი
          </div>
        )}
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
                state.status === 'ready'
                  ? 'აღწერე შენი ბიზნეს იდეა...'
                  : 'დაწერე პასუხი...'
              }
              disabled={
                state.status !== 'ready' && state.status !== 'chatting'
              }
              isTextarea={true}
              autoFocus={state.status === 'ready' && state.messages.length > 0}
            />
          </div>
        </div>

        {/* Right Panel - Document (40%) - 🆕 Phase 6: Now using DocumentPanel component */}
        <DocumentPanel
          fields={state.fields}
          currentDate={currentDate}
          status={state.status}
          userExperience={state.conversationState?.userExperience}
        />
      </div>

      {/* 🆕 Phase 4: Experience Modal */}
      <ExperienceModal
        isOpen={state.showExperienceModal || false}
        onComplete={handleExperienceComplete}
      />
    </div>
  );
}
