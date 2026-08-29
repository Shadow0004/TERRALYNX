import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldCheck, HelpCircle, MessageSquare, Terminal } from 'lucide-react';
import { DistrictState, AIQueryResponse } from '../../types';
import { apiService } from '../../services/api';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  metrics?: Record<string, any>;
  zones?: string[];
  shelters?: string[];
}

interface DecisionAssistantProps {
  state: DistrictState;
}

export const DecisionAssistant: React.FC<DecisionAssistantProps> = ({ state }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `**TerraLynx Operational AI Decision Intelligence Online.**\n\nI am grounded strictly in the real-time simulation state of **${state.hazard.name} (Category ${state.hazard.category})** across **Purva Coastal District**.\n\nAsk me about priority evacuation sequencing, shelter capacity allocations, flooded road bypasses, or logistical resource deficits.`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sampleQuestions = [
    'Which areas should we evacuate first?',
    'Where should we establish a temporary shelter?',
    'What are our resource bottlenecks?',
    'Which road corridors are inaccessible?',
    'Give a briefing on Estuary Delta Lowlands',
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    // Add user message
    const userMsg: Message = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response: AIQueryResponse = await apiService.queryAI(q);
      const botMsg: Message = {
        sender: 'assistant',
        text: response.answer,
        metrics: response.grounded_metrics,
        zones: response.relevant_zones,
        shelters: response.relevant_shelters,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Error querying decision intelligence: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2334]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
              Operational Decision AI Assistant
            </h3>
            <p className="text-[11px] text-slate-400">
              Grounded strictly in deterministic district simulation state • No hallucination
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Grounded State Verified</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#1b2334]">
        <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Queries:</span>
        </span>
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#151d2e] hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-[#222e46] transition-colors whitespace-nowrap"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-950/80 border border-cyan-700/60 text-cyan-100'
                    : 'bg-[#141b2a] border border-[#232f48] text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-mono text-slate-400">
                  <span>{isUser ? 'OPS COMMANDER' : 'TERRALYNX AI'}</span>
                </div>

                <div className="whitespace-pre-line prose prose-invert prose-xs text-slate-200">
                  {m.text}
                </div>

                {/* Grounded Metrics Card */}
                {m.metrics && Object.keys(m.metrics).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1e293d] bg-[#0c101a] p-2 rounded-lg text-[10px] font-mono">
                    <span className="font-bold text-cyan-400 uppercase block mb-1">
                      Grounded Telemetry Citations:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-slate-300">
                      {Object.entries(m.metrics).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-slate-500">{k.replace('_', ' ')}: </span>
                          <span className="text-white font-semibold">
                            {typeof v === 'number' ? v.toLocaleString() : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#141b2a] border border-[#232f48] rounded-xl p-3 text-xs text-cyan-300 flex items-center space-x-2">
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying live scenario state & synthesizing decision metrics...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="pt-3 border-t border-[#1b2334] flex items-center space-x-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask an operational question (e.g. 'Which shelter has the most remaining capacity?')..."
          className="flex-1 bg-[#141b2a] border border-[#222e44] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
