// Detect language from text (simple heuristic)
export const detectLanguage = (text: string): "kinyarwanda" | "english" => {
  if (!text) return "english";
  
  // Common Kinyarwanda characters and words
  const kinyarwandaIndicators = [
    /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i, // Accented characters
    /\b(muraho|murakoze|yego|oya|nyamuneka|mbabarira|murakaza|mwiriwe|amakuru|ni|n'|cya|kwa|mu|ku|na|no|cyangwa)\b/i, // Common Kinyarwanda words
  ];
  
  const hasKinyarwandaChars = kinyarwandaIndicators.some(pattern => pattern.test(text));
  
  return hasKinyarwandaChars ? "kinyarwanda" : "english";
};

// Get available voices (with loading support)
const getVoices = (): SpeechSynthesisVoice[] => {
  let voices = window.speechSynthesis.getVoices();
  
  // If voices not loaded yet, wait for them
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
    };
  }
  
  return voices;
};

export const speakText = (text: string, language?: "kinyarwanda" | "english") => {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Auto-detect language if not provided
  const detectedLang = language || detectLanguage(text);
  
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = getVoices();
  
  // Set language and voice based on detected/provided language
  if (detectedLang === "kinyarwanda") {
    // Try to find a Kinyarwanda voice, fallback to a generic African language voice or default
    const kinyarwandaVoice = voices.find(voice => 
      voice.lang.includes("rw") || 
      voice.lang.includes("kin") ||
      voice.lang.includes("sw") // Swahili as fallback (closer to Kinyarwanda)
    );
    
    if (kinyarwandaVoice) {
      utterance.voice = kinyarwandaVoice;
    }
    utterance.lang = "rw-RW";
  } else {
    // Find best English voice
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith("en") && voice.localService
    ) || voices.find(voice => voice.lang.startsWith("en"));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.lang = "en-US";
  }

  // Google Translate-like settings
  utterance.rate = 0.95; // Slightly slower for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Handle errors gracefully
  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event);
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};

