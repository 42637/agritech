import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mic, MicOff, Volume2, Sparkles, Send, Bot } from 'lucide-react';
import { api } from '../services/api';
import type { Farm } from '../services/api';
import { voiceService } from '../services/voice';
import type { AudioRecordingController } from '../services/voice';

interface AskAgriScreenProps {
  selectedFarm: Farm | null;
  onBack: () => void;
}

const responseUsesSelectedScript = (text: string, language: string) => {
  const ranges: Record<string, [number, number]> = {
    te: [0x0c00, 0x0c7f],
    hi: [0x0900, 0x097f],
  };
  const range = ranges[language];
  if (!range) {
    const letters = Array.from(text).filter((character) => /\p{L}/u.test(character));
    const latin = letters.filter((character) => character.codePointAt(0)! < 128).length;
    return latin >= 8 && latin / Math.max(letters.length, 1) >= 0.65;
  }
  let native = 0;
  let otherIndic = 0;
  let allLetters = 0;
  for (const character of text) {
    if (!/\p{L}/u.test(character)) continue;
    allLetters++;
    const point = character.codePointAt(0)!;
    if (point >= range[0] && point <= range[1]) native++;
    else if (point >= 0x0900 && point <= 0x0d7f) otherIndic++;
  }
  return native >= 8 && otherIndic === 0 && native / Math.max(allLetters, 1) >= 0.65;
};

const isActionRecommendation = (text: string, language: string) => {
  const actionWords: Record<string, string[]> = {
    en: ['apply', 'check', 'keep', 'inspect', 'ensure', 'use', 'contact', 'avoid', 'irrigate', 'monitor', 'remove', 'test'],
    te: ['చేయండి', 'పెట్టండి', 'వేయండి', 'పరిశీలించండి', 'గమనించండి', 'తనిఖీ చేయండి', 'సంప్రదించండి', 'వాడండి', 'ఉపయోగించండి', 'కొనసాగించండి', 'తొలగించండి', 'నిర్వహించండి'],
    hi: ['करें', 'रखें', 'डालें', 'जाँचें', 'देखें', 'लगाएँ', 'संपर्क करें', 'उपयोग करें', 'बनाए रखें', 'हटाएँ', 'अपनाएँ'],
  };
  const lower = text.toLocaleLowerCase();
  return (actionWords[language] || actionWords.en).some((word) => lower.includes(word));
};

type AnswerBlock = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };

const parseAnswer = (answer: string): AnswerBlock[] => {
  const normalized = (answer || '').replace(/\r\n?/g, '\n').replace(/\s+(?=\d{1,2}[.)]\s)/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => { if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() }); paragraph = []; };
  const flushList = () => { if (list.length) blocks.push({ type: 'list', items: list }); list = []; };
  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    const item = line.match(/^(?:\d{1,2}[.)]|[-*•])\s+(.+)$/);
    if (item) { flushParagraph(); list.push(item[1].trim()); }
    else { flushList(); paragraph.push(line); }
  }
  flushParagraph();
  flushList();
  return blocks;
};

const renderInlineFormatting = (text: string) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
  part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : <React.Fragment key={index}>{part.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1$2')}</React.Fragment>
);

export const AskAgriScreen: React.FC<AskAgriScreenProps> = ({ selectedFarm, onBack }) => {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<AudioRecordingController | null>(null);

  useEffect(() => {
    setResponse(null);
    voiceService.abortRecording();
    recordingRef.current = null;
    setIsListening(false);
    setIsTranscribing(false);
    setVoiceError('');
    voiceService.stop();
    setSpeaking(false);
    return () => voiceService.abortRecording();
  }, [language]);

  const handleToggleListen = () => {
    if (isListening) {
      recordingRef.current?.stop();
      setIsListening(false);
    } else if (!isTranscribing) {
      setVoiceError('');
      setIsListening(true);
      const rec = voiceService.startRecording(
        () => setIsListening(true),
        async (audio) => {
          setIsListening(false);
          setIsTranscribing(true);
          try {
            const result = await api.transcribeAudio(audio, language);
            if ((i18n.resolvedLanguage || i18n.language || 'en') !== language) return;
            const transcript = result.transcript?.trim();
            if (transcript) setQuestion(transcript);
            else setVoiceError('no-speech');
          } catch (error) {
            console.error(error);
            setVoiceError('transcription-failed');
          } finally {
            setIsTranscribing(false);
          }
        },
        (err) => {
          setIsListening(false);
          setVoiceError(err);
        },
      );
      recordingRef.current = rec;
    }
  };

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    try {
      let res = await api.askAI(q, selectedFarm?.id, language);
      if ((i18n.resolvedLanguage || i18n.language || 'en') !== language) return;
      if (!responseUsesSelectedScript(res.answer || '', language)) {
        const correctionInstruction = language === 'te'
          ? '\n\nదయచేసి ఈ రైతు ప్రశ్నకు తెలుగులో, తెలుగు లిపిలో మాత్రమే సమాధానం ఇవ్వండి. మలయాళం, గుజరాతీ లేదా ఇతర భాషలను ఉపయోగించవద్దు.'
          : language === 'hi'
            ? '\n\nकृपया किसान के इस प्रश्न का उत्तर केवल हिंदी और देवनागरी लिपि में दें। तेलुगु, मलयालम या किसी अन्य भाषा का उपयोग न करें।'
            : '\n\nPlease answer only in English using Latin script. Do not use another language or script.';
        const corrected = await api.askAI(`${q}${correctionInstruction}`, selectedFarm?.id, language);
        if ((i18n.resolvedLanguage || i18n.language || 'en') !== language) return;
        if (responseUsesSelectedScript(corrected.answer || '', language)) res = corrected;
      }
      res = {
        ...res,
        recommendations: Array.isArray(res.recommendations)
          ? res.recommendations.filter((item: string) =>
              responseUsesSelectedScript(item, language) && isActionRecommendation(item, language))
          : [],
      };
      if (!responseUsesSelectedScript(res.answer || '', language)) {
        setResponse({
          ...res,
          language,
          answer: t('wrongLanguageReply'),
          recommendations: [],
        });
      } else {
        setResponse(res);
      }
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
      voiceService.speak(response.answer, language, () => setSpeaking(false));
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
            <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">{t('askScreenTitle')}</h2>
            <p className="text-xs text-[#5A6E65]">{t('askScreenSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Voice Mic Hero Card */}
      <div className="bg-gradient-to-br from-[#E7F7E4] via-[#F2FBF0] to-white border border-[#BDEBB4] rounded-3xl p-6 text-center space-y-4 shadow-sm">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <button
            onClick={handleToggleListen}
            disabled={isTranscribing}
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
            {isListening ? t('listeningPrompt') : isTranscribing ? t('voiceProcessing') : t('tapToSpeak')}
          </h3>
          <p className="text-xs text-[#5A6E65] mt-1">
            {t('askTopics')}
          </p>
          {voiceError && (
            <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold text-rose-700">
              {t(`voiceError_${voiceError}`, { defaultValue: t('voiceError_unknown') })}
            </p>
          )}
        </div>

        <div className="relative flex items-center mt-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder={t('questionPlaceholder')}
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
        <p className="text-xs font-bold text-gray-500">{t('popularQuestions')}</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            t('questionFertilizer'),
            t('questionPest'),
            t('questionSoil'),
            t('questionRain')
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
          <p className="text-xs font-bold text-[#102D20]">{t('aiAnalyzing')}</p>
        </div>
      )}

      {response && !loading && (
        <div className="bg-white border border-green-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-[#102D20]">{t('aiAnswer')}</h4>
            </div>

            <button
              onClick={handleSpeakAnswer}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                speaking ? 'bg-rose-100 text-rose-700' : 'bg-[#E7F7E4] text-[#087A3D] hover:bg-[#087A3D] hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{speaking ? t('stopSpeaking') : t('listenAnswer')}</span>
            </button>
          </div>

          <div className="space-y-3 text-sm text-[#102D20] leading-relaxed font-medium">
            {parseAnswer(response.answer || '').map((block, index) => block.type === 'list'
              ? <ol key={index} className="list-decimal pl-5 space-y-2 marker:font-bold marker:text-[#087A3D]">
                  {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineFormatting(item)}</li>)}
                </ol>
              : <p key={index}>{renderInlineFormatting(block.text)}</p>)}
          </div>

          {response.recommendations && response.recommendations.length > 0 &&
            !parseAnswer(response.answer || '').some((block) => block.type === 'list') && (
            <div className="bg-[#E7F7E4]/60 rounded-2xl p-3 space-y-1.5 border border-green-100">
              <p className="text-[11px] font-bold text-[#07552F]">{t('actionItems')}</p>
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
