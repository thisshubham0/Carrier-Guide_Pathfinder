import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, HeartHandshake, Send, ShieldCheck } from 'lucide-react';
import type { Career, MentorMessage, StudentProfile } from '../shared/types.ts';
import { t } from '../shared/i18n.ts';

interface MentorChatProps {
  profile: StudentProfile;
  messages: MentorMessage[];
  topCareers: Career[];
  prefillQuestion: string | null;
  onClearPrefill: () => void;
  onAppendMessages: (msgs: MentorMessage[]) => void;
}

export const MentorChat: React.FC<MentorChatProps> = ({
  profile,
  messages,
  topCareers,
  prefillQuestion,
  onClearPrefill,
  onAppendMessages,
}) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefillQuestion) {
      setInput(prefillQuestion);
      onClearPrefill();
    }
  }, [prefillQuestion, onClearPrefill]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const starterPrompts = [
    topCareers[0]
      ? `How can I start ${topCareers[0].title} on a tight budget?`
      : 'Which careers have the fastest free or low-cost entry routes?',
    topCareers[0] && topCareers[1]
      ? `Compare ${topCareers[0].title} and ${topCareers[1].title} honestly.`
      : 'What trades or diplomas pay well without a 4-year degree?',
    'What questions should I ask a school counsellor or working professional?',
  ];

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    setError(null);
    const userMsg: MentorMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    onAppendMessages([userMsg]);
    setInput('');
    setSending(true);

    try {
      const resp = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: [...messages, userMsg].slice(-8),
          profile,
          topCareerIds: topCareers.map((c) => c.id),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Could not reach the AI Mentor right now.');
      }
      const assistantMsg: MentorMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
        is_crisis: Boolean(data.is_crisis),
        next_step: data.next_step,
        sources_used: Array.isArray(data.sources_used) ? data.sources_used : [],
      };
      onAppendMessages([assistantMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'You appear to be offline. Reconnect to chat with the AI Mentor.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#0F766E]">
            Grounded in PathFinder&apos;s verified dataset · Private to you
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#0F172A] sm:text-3xl">
            {t(profile.language, 'mentor.title')}
          </h1>
        </div>
        <div className="text-xs text-[#475569]">
          Region: {profile.region.toUpperCase()} · Never shared in parent links
        </div>
      </div>

      {/* Chat Transcript Container */}
      <section
        aria-label="AI Career Mentor conversation"
        className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden"
        style={{ minHeight: '460px', maxHeight: '68vh' }}
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-4">
              <div className="max-w-xl space-y-1.5">
                <h2 className="font-display text-base font-semibold text-[#0F172A]">
                  Ask anything about your matched paths
                </h2>
                <p className="text-sm text-[#475569] leading-relaxed">
                  I explain options and trade-offs in plain language using your profile and our verified dataset. If I do not have reliable data on a specific college or local fee, I will tell you honestly.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-slate-50 px-3.5 py-2 text-left text-xs font-medium text-[#0F172A] hover:border-[#0F766E] hover:bg-teal-50/40 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            if (msg.is_crisis) {
              return (
                <div
                  key={msg.id}
                  role="alert"
                  className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                    <HeartHandshake className="h-5 w-5 text-[#B45309]" aria-hidden="true" />
                    <span>Support &amp; Immediate Help Resources</span>
                  </div>
                  <div className="whitespace-pre-line text-sm text-[#0F172A] leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-[#0F766E] text-white'
                      : 'border border-[#E2E8F0] bg-[#F7F9FB] text-[#0F172A]'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                  {!isUser && msg.sources_used && msg.sources_used.length > 0 && (
                    <div className="border-t border-slate-200/80 pt-2 text-[11px] text-[#475569]">
                      Grounded in: {msg.sources_used.join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-start" aria-live="polite">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7F9FB] px-4 py-3 text-xs text-[#475569]">
                Checking your profile and verified career data...
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Input Composer */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-[#E2E8F0] bg-white p-3 sm:p-4 flex items-center gap-2.5"
        >
          <label htmlFor="mentor-chat-input" className="sr-only">
            Ask the AI Career Mentor a question
          </label>
          <input
            id="mentor-chat-input"
            type="text"
            maxLength={750}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(profile.language, 'mentor.placeholder')}
            disabled={sending}
            className="min-h-[48px] flex-1 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] px-4 text-sm text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message to AI Mentor"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>

      <div className="flex items-start gap-2 text-xs text-[#475569]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
        <p>
          For big financial or educational commitments, always talk through your options with a human school counsellor, teacher, or trusted family member.
        </p>
      </div>
    </div>
  );
};
