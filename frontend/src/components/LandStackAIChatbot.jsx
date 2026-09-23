import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Mic, MicOff, Volume2, VolumeX,
  X, Sparkles, Bot, User, CheckCircle2, AlertCircle,
  HelpCircle, ChevronDown, Layers, FileText, Compass, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Comprehensive LandStack domain knowledge base for statutory services and application knowledge
const LANDSTACK_SERVICES_KB = [
  {
    keywords: ['ulpin', 'bhu-aadhaar', 'bhu aadhaar', 'unique land parcel', 'identifier'],
    title: 'Unique Land Parcel Identification Number (ULPIN / Bhu-Aadhaar)',
    answer: `**ULPIN (Unique Land Parcel Identification Number)**, also known as **Bhu-Aadhaar**, is a 14-digit alphanumeric national standard identifier for every surveyed land parcel in India.\n\n- **How it works**: It is derived mathematically from the GIS polygon centroid coordinates (latitude and longitude) of the parcel boundary.\n- **Significance**: Acts as the single source of truth across all 10 statutory departments (Revenue, Registration, Survey, Municipal, etc.), preventing boundary overlaps, duplicate registrations, and fraudulent property sales.\n- **How to find**: You can search any parcel by entering its 14-digit ULPIN in the LandStack search bar, or locate it interactively on the Cadastral GIS Map.`
  },
  {
    keywords: ['patta', 'chitta', 'mutation', 'name transfer', 'ownership change', 'ror'],
    title: 'Patta Mutation & Land Title Transfer',
    answer: `**Patta Mutation** is the formal statutory process to update the Record of Rights (RoR) in the Revenue Department when land ownership changes through sale, gift, partition, or inheritance.\n\n- **Required Documents**:\n  1. Registered Sale Deed / Settlement Deed (Registration Dept)\n  2. Current Patta / Chitta copy\n  3. Encumbrance Certificate (EC) with clear title\n  4. FMB Sketch (Field Measurement Book) from Survey Dept\n  5. Masked Aadhaar / Photo ID of transferor & transferee\n- **Timeline**: Statutory time limit is 15–30 days. You can initiate this directly under **Government Services → Patta Transfer & Mutation** in LandStack and track real-time status.`
  },
  {
    keywords: ['survey', 'fmb', 'sub-division', 'cadastral', 'boundary', 'sub division'],
    title: 'Cadastral Survey & Sub-Division (FMB Sketch)',
    answer: `The **Survey & Land Records Department** maintains the spatial geometry and Field Measurement Book (FMB) sketches of all parcels.\n\n- **Sub-Division Process**: When a parcel is partitioned, a licensed surveyor carries out DGPS / Electronic Total Station (ETS) field measurement to generate new sub-division boundaries (e.g. 124/3B → 124/3B1, 124/3B2).\n- **Cadastral GIS Map**: On LandStack, switch to the **Cadastral GIS Map** to inspect boundary vectors, satellite overlays, and adjacent parcel numbers in real time.`
  },
  {
    keywords: ['encumbrance', 'ec', 'registration', 'sro', 'sub-registrar', 'mortgage', 'sale deed'],
    title: 'Encumbrance Certificate (EC) & Registration Verification',
    answer: `An **Encumbrance Certificate (EC)** details all registered financial liabilities, mortgages, court attachments, or sales registered on a parcel over a specified timeframe (e.g., last 30 years).\n\n- **Form 15**: Issued when registered transactions, liens, or mortgages exist on the parcel.\n- **Form 16 (Nil EC)**: Issued when no encumbrance exists, certifying a clear marketable title.\n- **Verification**: In LandStack, view the **Registration Department** card for any parcel to verify registered document numbers, SRO office, and active mortgage status.`
  },
  {
    keywords: ['building', 'planning', 'fsi', 'far', 'setback', 'approval', 'zone', 'zoning'],
    title: 'Town & Country Planning / Building Permission',
    answer: `The **Local Planning Authority (DTCP / CMDA / Town Planning)** and Municipal Corporation govern spatial zoning and building permissions.\n\n- **Key Parameters**:\n  1. **Land Use Zoning**: Residential (R1/R2), Commercial, Industrial, Agricultural, Mixed.\n  2. **FSI / FAR**: Floor Space Index permitted on the plot.\n  3. **Setbacks & Road Width**: Mandatory front and side setbacks based on abutting road width.\n  4. **Height Restriction**: Maximum permissible height.\n- You can apply for automated **Planning & Building Permission NOC** via LandStack Services.`
  },
  {
    keywords: ['tax', 'property tax', 'assessment', 'local body', 'municipality', 'corporation'],
    title: 'Property Tax & Local Body Assessment',
    answer: `**Local Bodies (Corporations, Municipalities, Town Panchayats)** manage municipal assessments and property tax levies.\n\n- In LandStack's **Local Bodies** and **Municipal Administration** cards, you can view the unique Property ID, Assessment Number, Ward Number, Annual Tax amount, and current payment status (Paid / Arrears).`
  },
  {
    keywords: ['agriculture', 'forest', 'wetland', 'nanjai', 'punjai', 'crz', 'environment'],
    title: 'Agriculture, Forest & Environmental Clearances',
    answer: `LandStack connects environmental and agricultural authorities to prevent unauthorized conversion of protected eco-zones:\n\n- **Agriculture**: Tracks Nanjai (wet/irrigated) vs Punjai (dry) land, crop type, and groundwater sources.\n- **Forest**: Checks whether parcel is within 500m buffer zone of Reserved Forests or Eco-Sensitive Zones (ESZ).\n- **Environment / CRZ**: Flags Coastal Regulation Zones (CRZ), waterbodies, or flood-prone zones requiring statutory green clearances.`
  },
  {
    keywords: ['10 departments', 'statutory departments', 'departments', 'department records'],
    title: 'The 10 Integrated Statutory Departments',
    answer: `LandStack synchronizes data across all **10 statutory departments**:\n\n1. **Revenue Department**: Patta, survey numbers, RoR, mutation status.\n2. **Survey & Land Records**: Cadastral map, FMB sketches, boundary coordinates.\n3. **Registration Department**: Sale deeds, SRO records, Encumbrance (EC).\n4. **Local Bodies**: Property ID, assessment numbers, ward tax status.\n5. **Public Works (PWD)**: Road widths, canals, right-of-way (ROW), acquisitions.\n6. **Municipal Administration**: Building usage, water & sewerage, municipal sanctions.\n7. **Agriculture & Forest**: Soil/crop classification and forest/buffer zone clearances.\n8. **Electricity Department**: Transformer ID, pole ID, 11 kV grid corridors.\n9. **Environment Authorities**: CRZ, wetlands, flood zones, eco-sensitive restrictions.\n10. **Town & Country Planning**: Master plan zoning, permitted use, FSI/FAR.`
  },
  {
    keywords: ['search', 'aadhaar', 'lookup', 'how to search', 'find land'],
    title: 'How to Search Land Records on LandStack',
    answer: `On the Citizen Dashboard or GIS Map, enter any of the following in the universal search bar:\n\n- **14-digit ULPIN** (e.g. \`33TNCHN0000123456\`)\n- **Survey Number** (e.g. \`124/3B\` or \`125/4A\`)\n- **Aadhaar Number** (e.g. \`4819\` or full masked Aadhaar)\n\nThe platform immediately renders the **10 Statutory Department Cards**, allowing you to click any department to inspect verified parameters.`
  },
  {
    keywords: ['offline', 'sync', 'no internet', 'connectivity'],
    title: 'Offline GIS & Synchronization Capability',
    answer: `LandStack features built-in **Offline-First PWA caching and IndexedDB synchronization**.\n\n- Field officers and citizens can view previously loaded cadastral boundaries and draft service applications even with zero network connectivity.\n- When network connectivity restores, the system automatically queues and synchronizes all pending mutations and audit logs to the central state cadastre.`
  }
];

export const LandStackAIChatbot = () => {
  const { t, currentLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Namaste! I am the **LandStack AI Assistant**.\n\nI am specialized strictly in **Indian Land Governance, ULPIN / Bhu-Aadhaar, Cadastral GIS, and 10 Statutory Department Services**.\n\nHow can I help you today? You can type your question or use the **voice microphone**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Setup Web Speech API Recognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentLang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Edge, or a Web Speech-compatible browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSpeakText = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick English or Indian voice if present
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const generateAnswer = (userQuery) => {
    const qLower = userQuery.toLowerCase().trim();

    // Check strict guardrails against non-land / non-services topics
    const generalOffTopic = [
      'recipe', 'cook', 'movie', 'song', 'cricket', 'football', 'joke', 'capital of',
      'weather today', 'write code', 'python', 'javascript', 'prime minister of uk', 'dating'
    ];

    const isOffTopic = generalOffTopic.some(off => qLower.includes(off));
    if (isOffTopic) {
      return `I am the **LandStack AI Assistant**, specialized **strictly in Indian Land Governance, ULPIN, land records, mutation, registration, and platform services**.\n\nI cannot answer queries outside the scope of LandStack services. Please ask me about:\n- How to apply for Patta Mutation or Name Transfer\n- What is ULPIN (Bhu-Aadhaar) and how to search it\n- Verification of Encumbrance Certificates (EC)\n- 10 Statutory Department records and GIS maps.`;
    }

    // Match against knowledge base
    let bestMatch = null;
    let maxKeywordHits = 0;

    for (const item of LANDSTACK_SERVICES_KB) {
      let hits = 0;
      for (const kw of item.keywords) {
        if (qLower.includes(kw)) {
          hits += 1;
        }
      }
      if (hits > maxKeywordHits) {
        maxKeywordHits = hits;
        bestMatch = item;
      }
    }

    if (bestMatch && maxKeywordHits > 0) {
      return `### ${bestMatch.title}\n\n${bestMatch.answer}`;
    }

    // Default specialized response guiding user
    return `Thank you for your query regarding **"${userQuery}"**.\n\nOn the **LandStack Platform**, you can access verified cadastral services across 10 statutory departments:\n\n1. **Search Cadastre**: Enter your 14-digit ULPIN, Survey Number, or Aadhaar on the Dashboard to see 10 Department records.\n2. **Apply for Services**: Navigate to **Government Services** to apply for Patta Transfer, Sub-division, Encumbrance, or Planning NOC.\n3. **Interactive Cadastral Map**: Navigate to **Cadastral GIS Map** to inspect boundary polygons, switch to satellite imagery, or track current GPS location.\n\nWould you like guidance on Patta Mutation, ULPIN lookup, or Encumbrance verification?`;
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    const newMsgId = Date.now();

    const userMsg = {
      id: newMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');

    // Generate intelligent assistant response
    setTimeout(() => {
      const responseText = generateAnswer(userText);
      const assistantMsg = {
        id: newMsgId + 1,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 450);
  };

  const quickPrompts = [
    'How do I apply for Patta Mutation?',
    'What is ULPIN / Bhu-Aadhaar?',
    'How to verify Encumbrance Certificate (EC)?',
    'Explain the 10 Statutory Departments',
    'How to search by Survey or Aadhaar Number?'
  ];

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white font-bold text-xs rounded-full shadow-2xl shadow-blue-900/40 hover:scale-105 transition-all duration-300 active:scale-95 border border-blue-400/30"
            title="Open LandStack AI Assistant"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <Bot className="w-5 h-5 text-blue-200" />
            <span className="tracking-wide">{t('ai_sahayak')}</span>
          </button>
        )}
      </div>

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">LandStack {t('ai_sahayak')}</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Voice & Text
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  {t('ai_subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isSpeaking) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                title="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Pills Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputQuery(prompt);
                }}
                className="text-[10px] font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-2.5 py-1 rounded-full transition shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-700 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-xs">
                    {msg.text}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/40 text-[10px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                          speakingMsgId === msg.id ? 'text-blue-700 font-bold bg-blue-50' : 'hover:text-blue-700'
                        }`}
                        title={speakingMsgId === msg.id ? 'Stop audio' : 'Listen with Voice'}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-blue-600 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Listening Ripple Status */}
          {isListening && (
            <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700 animate-pulse shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                <span className="font-bold">{t('ai_listening')}</span>
              </div>
              <button
                onClick={() => recognitionRef.current?.stop()}
                className="text-[10px] font-bold underline"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Box Footer with Voice & Text buttons */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl border transition ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={isListening ? 'Stop listening' : 'Speak your query (Voice Input)'}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4 text-blue-700" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={t('ai_input_placeholder')}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl shadow-md shadow-blue-700/25 transition shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              {t('ai_disclaimer')}
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default LandStackAIChatbot;
