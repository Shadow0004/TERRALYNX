import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Cpu,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import { DistrictState, AIQueryResponse } from '../../types';
import { apiService } from '../../services/api';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  metrics?: Record<string, any>;
  zones?: string[];
  shelters?: string[];
  modelUsed?: string;
}

interface DecisionAssistantProps {
  state: DistrictState;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', desc: 'Fast, reasoning-rich operational intelligence' },
  { id: 'gemini-3.7-flash', name: 'Google Gemini 3.7 Flash', desc: 'Next-gen agentic multivariable reasoning' },
  { id: 'deterministic', name: 'Deterministic Ops Engine', desc: 'Zero-API key local verification engine' },
];

export const DecisionAssistant: React.FC<DecisionAssistantProps> = ({ state }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `### ⚡ TerraLynx Gemini Decision Intelligence Online\n\nI am grounded in live operational telemetry for **${state.hazard.name} (Category ${state.hazard.category})** across **${state.zones.length} administrative zones**.\n\nAsk me strategic operational questions regarding priority evacuation sequencing, highground temporary shelter suitability, flooded road bypass corridors, or critical resource deficits.`,
      modelUsed: 'Google Gemini 2.5 Flash',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Load saved API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('terralynx_gemini_api_key') || '';
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('terralynx_gemini_api_key', newKey);
    setShowKeyModal(false);
  };

  const sampleQuestions = [
    'Which zones should we evacuate first and why?',
    'Where should we establish temporary shelters?',
    'What are our critical resource deficits and bottlenecks?',
    'Which road corridors are flooded or high-risk?',
    'Summarize demographic vulnerabilities across low-elevation zones',
    'How should we reallocate ambulances for medically dependent residents?',
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    // Add user message
    const userMsg: Message = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response: AIQueryResponse = await apiService.queryAI(
        q,
        apiKey || undefined,
        selectedModel
      );
      const botMsg: Message = {
        sender: 'assistant',
        text: response.answer,
        metrics: response.grounded_metrics,
        zones: response.relevant_zones,
        shelters: response.relevant_shelters,
        modelUsed: response.model_used || 'Google Gemini 2.5 Flash',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Decision intelligence query failed: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 flex flex-col h-[calc(100vh-140px)] min-h-[550px] relative">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1b2334] gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-900 to-blue-900 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Operational Decision AI Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold flex items-center space-x-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                <span>Gemini 2.5</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-modal decision intelligence grounded in real-time district telemetry & elevation physics
            </p>
          </div>
        </div>

        {/* Model Selector & Key Config Controls */}
        <div className="flex items-center space-x-2">
          {/* Model Selector Dropdown */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#151e30] border border-[#243350] rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition-colors ${
              apiKey
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'API Key Active' : 'Set Gemini Key'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#1b2334]">
        <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Tactical Queries:</span>
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
                className={`max-w-3xl rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-950/80 border border-cyan-700/60 text-cyan-100'
                    : 'bg-[#141b2a] border border-[#232f48] text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between space-x-2 mb-2 pb-1.5 border-b border-[#1f2b42] text-[10px] font-mono text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    {isUser ? (
                      <span className="font-bold text-cyan-400">OPS COMMANDER</span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span className="font-bold text-white">
                          {m.modelUsed || 'Google Gemini 2.5 Flash'}
                        </span>
                        <span className="text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-700/40 text-[9px]">
                          Verified Grounded
                        </span>
                      </div>
                    )}
                  </div>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.text, idx)}
                      className="text-slate-400 hover:text-white p-0.5 rounded transition-colors flex items-center space-x-1"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                <div className="whitespace-pre-line prose prose-invert prose-xs text-slate-200 leading-normal">
                  {m.text}
                </div>

                {/* Grounded Metrics Citations Card */}
                {m.metrics && Object.keys(m.metrics).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1e293d] bg-[#0c101a] p-2.5 rounded-lg text-[10px] font-mono">
                    <span className="font-bold text-cyan-400 uppercase block mb-1.5 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Grounded Telemetry Citations:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-slate-300">
                      {Object.entries(m.metrics).map(([k, v]) => (
                        <div key={k} className="bg-[#121927] p-1.5 rounded border border-[#1a2538]">
                          <div className="text-[9px] text-slate-400 uppercase">
                            {k.replace(/_/g, ' ')}
                          </div>
                          <div className="text-white font-semibold mt-0.5">
                            {typeof v === 'number' ? v.toLocaleString() : String(v)}
                          </div>
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
            <div className="bg-[#141b2a] border border-[#232f48] rounded-xl p-3.5 text-xs text-cyan-300 flex items-center space-x-3 shadow-lg animate-pulse">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>
                Gemini is analyzing scenario state, calculating risk derivatives & synthesizing tactical recommendations...
              </span>
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
          placeholder="Ask an operational question (e.g. 'How should we sequence evacuation for Daya river floodplains?')..."
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

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-[#263553] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2 border-b border-[#1b253b] pb-3">
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-600/40">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white font-mono text-sm">
                  Google Gemini API Configuration
                </h4>
                <p className="text-[11px] text-slate-400">
                  Connect your Gemini API Key for operational intelligence
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <label className="block font-mono text-[11px] text-slate-400">
                Gemini API Key (Optional / Defaults to server env):
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#141b2c] border border-[#222e44] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-400">
                Get a free key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-mono"
                >
                  Google AI Studio
                </a>
                . Keys are saved locally in your browser session.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1b253b]">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveKey(apiKey)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
