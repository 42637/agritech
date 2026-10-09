import React, { useState } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, Sparkles, Send, Bot } from 'lucide-react';
import { api } from '../services/api';
import type { Farm } from '../services/api';
import { voiceService } from '../services/voice';

interface AskAgriScreenProps {
  selectedFarm: Farm | null;
  onBack: () => void;
}

export const AskAgriScreen: React.FC<AskAgriScreenProps> = ({ selectedFarm, onBack }) => {
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [speaking, setSpeaking] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const handleToggleListen = () => {
    if (isListening) {
      if (recognitionInstance) recognitionInstance.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      const rec = voiceService.startListening(
        'en',
        (transcript) => {
          setQuestion(transcript);
        },
        (err) => {
          console.error(err);
          setIsListening(false);
        }
      );
      setRecognitionInstance(rec);
    }
  };

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await api.askAI(q, selectedFarm?.id, 'en');
      setResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakAnswer = () => {
    if (!response?.answer) return;
    if (speaking) {
      voiceService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      voiceService.speak(response.answer, 'en', () => setSpeaking(false));
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-[#E7F7E4] flex items-center justify-center text-[#087A3D]">
            <Sparkles className="w-6 h-6 fill-[#087A3D]" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Ask AgriSmart AI</h2>
            <p className="text-xs text-[#5A6E65]">Voice & NVIDIA AI Farming Assistant</p>
          </div>
        </div>
      </div>

      {/* Voice Mic Hero Card */}
      <div className="bg-gradient-to-br from-[#E7F7E4] via-[#F2FBF0] to-white border border-[#BDEBB4] rounded-3xl p-6 text-center space-y-4 shadow-sm">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <button
            onClick={handleToggleListen}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 ${
              isListening ? 'bg-rose-600 ring-4 ring-rose-300 animate-pulse' : 'bg-[#087A3D] hover:bg-[#07552F]'
            }`}
          >
            {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
          </button>

          {isListening && (
            <span className="absolute -inset-2 rounded-full border-2 border-rose-500 animate-ping opacity-75 pointer-events-none" />
          )}
        </div>

        <div>
          <h3 className="font-extrabold text-base text-[#102D20]">
            {isListening ? "Listening... Speak now" : "Tap Microphone & Speak"}
          </h3>
          <p className="text-xs text-[#5A6E65] mt-1">
            Ask about crop pests, fertilizer doses, weather impact, or soil health in English, Telugu, or Hindi.
          </p>
        </div>

        <div className="relative flex items-center mt-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Type your agricultural question..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-xs font-semibold text-[#102D20] focus:outline-hidden focus:border-[#087A3D] focus:ring-2 focus:ring-[#087A3D]/20 shadow-2xs"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="absolute right-2 w-8 h-8 rounded-xl bg-[#087A3D] text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500">Popular Farmer Questions:</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            "Best fertilizer dose for Paddy in Kharif season?",
            "How to treat stem borer pest in crop?",
            "What crops fit my farm's 6.5 pH soil?",
            "Rain forecast impact on spraying schedule?"
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="flex-none bg-white border border-green-200 hover:bg-green-50 text-xs font-semibold text-[#102D20] px-3 py-2 rounded-xl transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-green-100 rounded-3xl p-6 text-center space-y-3">
          <Bot className="w-10 h-10 text-[#087A3D] mx-auto animate-bounce" />
          <p className="text-xs font-bold text-[#102D20]">NVIDIA AI is analyzing your farm context...</p>
        </div>
      )}

      {response && !loading && (
        <div className="bg-white border border-green-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-[#102D20]">AgriSmart AI Answer</h4>
            </div>

            <button
              onClick={handleSpeakAnswer}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                speaking ? 'bg-rose-100 text-rose-700' : 'bg-[#E7F7E4] text-[#087A3D] hover:bg-[#087A3D] hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{speaking ? 'Stop' : 'Listen to Answer'}</span>
            </button>
          </div>

          <p className="text-xs text-[#102D20] leading-relaxed font-medium whitespace-pre-line">
            {response.answer}
          </p>

          {response.recommendations && response.recommendations.length > 0 && (
            <div className="bg-[#E7F7E4]/60 rounded-2xl p-3 space-y-1.5 border border-green-100">
              <p className="text-[11px] font-bold text-[#07552F]">Key Action Items:</p>
              <ul className="text-xs text-[#102D20] space-y-1 list-disc pl-4 font-medium">
                {response.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
