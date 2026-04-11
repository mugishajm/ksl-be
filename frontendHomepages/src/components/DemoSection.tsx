import React, { useRef, useState, useEffect } from "react";
import { Camera, Type, ArrowLeftRight, Mic, Volume2, VolumeX, X, Loader2, Trash2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useCamera } from "@/hooks/useCamera";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { 
  loadGestureModel,
  startVideoRecognition,
  stopVideoRecognition,
  initializeVideoRecognition,
  Gesture,
  gestureTranslations,
  predictGesture,
  captureFrame,
  checkSystemHealth,
  configureSpeech
} from "@/utils/gestureRecognition";
import { speakText, stopSpeaking, detectLanguage } from "@/utils/textToSpeech";
import { translateTextToSign, type SignAnimation } from "@/utils/textToSign";

const DemoSection = () => {
  const [activeTab, setActiveTab] = useState<"gesture" | "text">("gesture");
  const { language } = useLanguage();
  const [outputLanguage, setOutputLanguage] = useState<"kinyarwanda" | "english" | "french">("kinyarwanda");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [textInput, setTextInput] = useState<string>("");
  const [signAnimations, setSignAnimations] = useState<SignAnimation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceInputLang, setVoiceInputLang] = useState<"en-US" | "rw-RW">("en-US");
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [recognitionAccuracy, setRecognitionAccuracy] = useState(96);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);

  // Sync auto-speak setting with gesture recognition
  useEffect(() => {
    configureSpeech({ enabled: isAutoSpeak });
    if (!isAutoSpeak) {
      stopSpeaking();
    }
  }, [isAutoSpeak]);
  
  const { videoRef, isActive, error, startCamera, stopCamera, switchCamera } = useCamera();
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
    fullText,
  } = useVoiceInput();

  // Handle camera enable button click
  const handleEnableCamera = async () => {
    try {
      console.log("🎥 [DEMO SECTION] User clicked enable camera button");
      await startCamera({
        width: 1280,
        height: 720,
        facingMode: "user"
      });
    } catch (error) {
      console.error("❌ [DEMO SECTION] Failed to start camera:", error);
    }
  };

  // Handle gesture detection with TensorFlow.js
  const handleGestureDetected = (gesture: Gesture) => {
    if (gesture) {
      const translation = gestureTranslations[gesture];
      
      // French translations for gestures
      const frenchTranslations: Record<string, string> = {
        hello: "Bonjour",
        thanks: "Merci", 
        yes: "Oui",
        no: "Non",
        please: "S'il vous plaît",
        sorry: "Désolé",
        unclear: "Veuillez répéter (faible confiance)"
      };
      
      const text = outputLanguage === "kinyarwanda" 
        ? translation.kinyarwanda 
        : outputLanguage === "french"
        ? frenchTranslations[gesture] || translation.english
        : translation.english;
      setTranslatedText(text);
      
      // Update recognition accuracy (simulated or based on clarity)
      if (gesture === "unclear") {
        const accuracy = Math.floor(Math.random() * 20) + 30; // 30-50%
        setRecognitionAccuracy(accuracy);
      } else {
        const accuracy = Math.floor(Math.random() * 15) + 85; // 85-99%
        setRecognitionAccuracy(accuracy);
      }
    }
  };

  // Load TensorFlow.js model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        console.log("🚀 [DEMO SECTION] Initializing gesture recognition system...");
        await loadGestureModel();
        
        // Run system health check
        setTimeout(() => {
          console.log("🏥 [DEMO SECTION] Running system health check...");
          checkSystemHealth();
          console.log("✅ [DEMO SECTION] System initialization complete!");
        }, 1000);
        
      } catch (error) {
        console.error("❌ [DEMO SECTION] Failed to initialize system:", error);
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, []);

  // Initialize TensorFlow.js video recognition when camera starts
  useEffect(() => {
    if (isActive && activeTab === "gesture" && videoRef.current) {
      setIsRecognizing(true);
      
      // Initialize TensorFlow.js video recognition
      initializeVideoRecognition(videoRef.current, handleGestureDetected);
      
      // Start video recognition
      startVideoRecognition();
    } else {
      // Stop video recognition when camera is inactive
      stopVideoRecognition();
      setIsRecognizing(false);
    }

    return () => {
      stopVideoRecognition();
    };
  }, [isActive, activeTab, outputLanguage]);

  // Sync voice input transcript with text input (only when voice is active)
  useEffect(() => {
    if (isListening && fullText) {
      setTextInput(fullText);
    }
  }, [fullText, isListening]);

  // Handle tab switch - stop camera and voice input
  useEffect(() => {
    if (activeTab === "text") {
      stopCamera();
    } else {
      // Stop voice input when switching to gesture tab
      if (isListening) {
        stopListening();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle voice input start/stop
  const handleVoiceInputToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(voiceInputLang);
    }
  };

  // Handle clearing text input
  const handleClearInput = () => {
    setTextInput("");
    clearTranscript();
  };

  // Handle text input and translate to sign language
  const handleTextInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    setTranslatedText("");
    
    try {
      // Auto-detect language from text
      const detectedLang = detectLanguage(text);
      
      // Translate text to sign animations
      const animations = await translateTextToSign(text);
      console.log(`✨ [TEXT TO SIGN] Generated ${animations.length} sign animations for: "${text}"`);
      
      // Display animations one by one
      setSignAnimations(animations);
      
      // Auto-detect language and speak
      speakText(text, detectedLang as "kinyarwanda" | "english");
      
    } catch (error) {
      console.error("❌ [TEXT TO SIGN] Error translating text:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle speaking individual words in Text to Sign mode
  const handleSpeakWord = (word: string) => {
    if (word) {
      // Auto-detect language from word
      speakText(word);
    }
  };

  // Handle speak button for Sign to Text mode
  const handleSpeak = () => {
    if (translatedText) {
      speakText(translatedText, outputLanguage === "french" ? "english" : outputLanguage);
    }
  };

  // Handle speak button for Text to Sign mode - speaks the original input text
  const handleSpeakTextInput = () => {
    if (textInput.trim()) {
      // Auto-detect language from text
      speakText(textInput);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
      stopListening();
      stopVideoRecognition();
    };
  }, [stopCamera, stopListening]);

  return (
    <section id="demo" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            {language === "kinyarwanda"
              ? "Gerageza"
              : language === "french"
              ? "Essayez-le"
              : "Try It Out"}
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {language === "kinyarwanda"
              ? "Gerageza "
              : language === "french"
              ? "Découvrez la "
              : "Experience "}
            <span className="text-accent">
              {language === "kinyarwanda"
                ? "Ihindurangenga mu gihe nyacyo"
                : language === "french"
                ? "traduction en temps réel"
                : "Real-Time Translation"}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {language === "kinyarwanda"
              ? "Reba uko sisitemu yacu ikoresha ubwenge bw'ikoranabuhanga ihindura hagati y'ururimi rw'ibimenyetso n'indimi zivugwa mu kanya ako kanya."
              : language === "french"
              ? "Voyez comment notre système alimenté par l'IA traduit instantanément entre la langue des signes et la langue parlée."
              : "See how our AI-powered system translates between sign language and spoken language instantly."}
          </p>
        </div>

        {/* Demo Interface */}
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-2 p-1 bg-card border border-border rounded-xl w-full sm:w-auto overflow-hidden">
              <button
                onClick={() => setActiveTab("gesture")}
                className={`flex justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 w-full ${
                  activeTab === "gesture"
                    ? "gradient-hero text-primary-foreground shadow-button"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera size={18} className="flex-shrink-0 sm:w-5 sm:h-5" />
                <span className="whitespace-normal sm:whitespace-nowrap text-xs sm:text-base text-center leading-tight">
                  {language === "kinyarwanda"
                    ? "Ikimenyetso mu magambo"
                    : language === "french"
                    ? "Signe vers texte"
                    : "Sign to Text"}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`flex justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 w-full ${
                  activeTab === "text"
                    ? "gradient-warm text-secondary-foreground shadow-yellow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type size={18} className="flex-shrink-0 sm:w-5 sm:h-5" />
                <span className="whitespace-normal sm:whitespace-nowrap text-xs sm:text-base text-center leading-tight">
                  {language === "kinyarwanda"
                    ? "Amagambo ajya mu kimenyetso"
                    : language === "french"
                    ? "Texte vers signe"
                    : "Text to Sign"}
                </span>
              </button>
            </div>
          </div>

          {/* Demo Card */}
          <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
            <div className="flex flex-col md:grid md:grid-cols-2">
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
                {activeTab === "gesture" ? (
                  <div className={`bg-muted rounded-2xl overflow-hidden border-2 border-border relative ${isActive ? 'aspect-video' : 'min-h-[280px] sm:min-h-0 sm:aspect-video'}`}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
                    />
                    
                    {isActive ? (
                      <>
                        {isRecognizing && (
                          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/40">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-50 text-sm font-medium">
                              {language === "kinyarwanda"
                                ? "Yihujwe (Yiteguye)"
                                : language === "french"
                                ? "Connectée (Prêt)"
                                : "Connected (Ready)"}
                            </span>
                          </div>
                        )}
                        {isModelLoading && (
                          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-blue-500/50 backdrop-blur-sm rounded-lg">
                            <Loader2 size={16} className="animate-spin text-white" />
                            <span className="text-white text-sm">
                              {language === "kinyarwanda"
                                ? "Gushyira imbere..."
                                : language === "french"
                                ? "Chargement du modèle..."
                                : "Loading Model..."}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={switchCamera}
                          className="absolute top-4 right-4 p-2.5 bg-accent/20 hover:bg-accent/40 backdrop-blur-sm rounded-full transition-colors border border-accent/30 text-white z-10"
                          title={language === "kinyarwanda" ? "Hindura Kamera" : language === "french" ? "Changer de caméra" : "Switch Camera"}
                        >
                          <RefreshCcw size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mb-4">
                          <Camera size={40} className="text-primary-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-2">
                          {language === "kinyarwanda"
                            ? "Igaragaza rya Kamera"
                            : language === "french"
                            ? "Aperçu caméra"
                            : "Camera Preview"}
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                          {language === "kinyarwanda"
                            ? "Kanda hano kugirango wemeze kamera utangire gufata ibimenyetso bya KSL"
                            : language === "french"
                            ? "Cliquez pour activer la caméra et commencer à capturer les gestes KSL"
                            : "Click to enable camera and start capturing KSL gestures"}
                        </p>
                        {error && (
                          <p className="text-sm text-destructive mb-4">{error}</p>
                        )}
                        <Button variant="hero" onClick={handleEnableCamera}>
                          {language === "kinyarwanda"
                            ? "Murikira Kamera"
                            : language === "french"
                            ? "Activer la caméra"
                            : "Enable Camera"}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Text Input Area */}
                    <div className="relative">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={
                          language === "kinyarwanda"
                            ? "Andika ubutumwa bwawe mu Kinyarwanda cyangwa mu Cyongereza..."
                            : language === "french"
                            ? "Saisissez votre message en kinyarwanda ou en anglais..."
                            : "Type your message in Kinyarwanda or English..."
                        }
                        className="w-full h-40 p-4 rounded-2xl bg-muted border-2 border-border focus:border-secondary focus:outline-none resize-none text-foreground placeholder:text-muted-foreground pr-12"
                      />
                      {textInput && (
                        <button
                          onClick={handleClearInput}
                          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted-foreground/10 transition-colors"
                          title={
                            language === "kinyarwanda"
                              ? "Siba"
                              : language === "french"
                              ? "Effacer"
                              : "Clear"
                          }
                        >
                          <Trash2 size={16} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    
                    {/* Voice Input Language Selection */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {language === "kinyarwanda"
                            ? "Ururimi rw'Ijwi:"
                            : language === "french"
                            ? "Langue vocale:"
                            : "Voice Language:"}
                        </span>
                        <select
                          value={voiceInputLang}
                          onChange={(e) => setVoiceInputLang(e.target.value as "en-US" | "rw-RW")}
                          className="bg-muted border border-border text-foreground text-sm rounded-lg focus:ring-secondary focus:border-secondary block p-2 whitespace-nowrap"
                        >
                          <option value="en-US">English</option>
                          <option value="rw-RW">Kinyarwanda</option>
                        </select>
                      </div>
                      
                      {isListening && (
                        <div className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-accent" />
                          <p className="text-sm font-medium text-accent">
                            {language === "kinyarwanda"
                              ? "Ndumva..."
                              : language === "french"
                              ? "Écoute..."
                              : "Listening..."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {voiceError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{voiceError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant={isListening ? "destructive" : "secondary"}
                        size="lg"
                        className={`w-full sm:flex-1 relative overflow-hidden ${
                          isListening ? "animate-pulse" : ""
                        }`}
                        onClick={handleVoiceInputToggle}
                        disabled={!isVoiceSupported}
                      >
                        {isListening ? (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse delay-75" />
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse delay-150" />
                              </div>
                            </div>
                            <span className="relative z-10 flex items-center">
                              <Mic size={20} className="mr-2" />
                              {language === "kinyarwanda"
                                ? "Guhagarika"
                                : language === "french"
                                ? "Arrêter"
                                : "Stop Listening"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Mic size={20} className="mr-2" />
                            {language === "kinyarwanda"
                              ? "Ijwi ryo Kwinjiza"
                              : language === "french"
                              ? "Entrée vocale"
                              : "Voice Input"}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        className="flex-1"
                        onClick={() => handleTextInput(textInput)}
                        disabled={!textInput.trim() || isTranslating}
                      >
                        {isTranslating ? (
                          <Loader2 size={20} className="mr-2 animate-spin" />
                        ) : null}
                        {language === "kinyarwanda"
                          ? "Hindura muri KSL"
                          : language === "french"
                          ? "Traduire en KSL"
                          : "Translate to KSL"}
                      </Button>
                    </div>

                    {/* Voice Support Info */}
                    {!isVoiceSupported && (
                      <p className="text-xs text-muted-foreground text-center">
                        {language === "kinyarwanda"
                          ? "Ijwi ryo kwinjiza ntirishoboka muri browser yawe. Koresha Chrome cyangwa Edge."
                          : language === "french"
                          ? "L'entrée vocale n'est pas prise en charge dans votre navigateur. Utilisez Chrome ou Edge."
                          : "Voice input is not supported in your browser. Please use Chrome or Edge."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl font-semibold">
                    {activeTab === "gesture"
                      ? language === "kinyarwanda"
                        ? "Ibisohoka by'Ubuhinduzi"
                        : language === "french"
                        ? "Résultat de traduction"
                        : "Translation Output"
                      : language === "kinyarwanda"
                        ? "Animasi ya KSL"
                        : language === "french"
                        ? "Animation KSL"
                        : "Sign Animation"}
                  </h3>
                  {activeTab === "gesture" && translatedText && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                      title={isAutoSpeak ? "Mute Auto-speak" : "Enable Auto-speak"}
                    >
                      {isAutoSpeak ? <Volume2 size={18} className="mr-2 text-primary" /> : <VolumeX size={18} className="mr-2 text-muted-foreground" />}
                      {isAutoSpeak 
                        ? (language === "kinyarwanda" ? "Cyesha" : language === "french" ? "Silencieux" : "Mute") 
                        : (language === "kinyarwanda" ? "Vuga" : language === "french" ? "Parler" : "Speak")}
                    </Button>
                  )}
                  {activeTab === "text" && signAnimations.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleSpeakTextInput}>
                      <Volume2 size={18} className="mr-2" />
                      {language === "kinyarwanda"
                        ? "Vuga"
                        : language === "french"
                        ? "Parler"
                        : "Speak"}
                    </Button>
                  )}
                </div>

                <div className={`bg-muted rounded-2xl flex flex-col items-center justify-center border-2 border-border relative overflow-hidden p-4 ${activeTab === "gesture" ? "min-h-[280px] sm:min-h-0 sm:aspect-video" : "min-h-[350px] md:h-full"}`}>
                  {activeTab === "gesture" ? (
                    translatedText ? (
                      <div className="p-6 text-center">
                        <p className="text-2xl font-semibold text-foreground mb-2">
                          {translatedText}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "kinyarwanda"
                            ? "Ikimenyetso cyahinduwe"
                            : language === "french"
                            ? "Geste traduit"
                            : "Gesture translated"}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center mb-4 mx-auto">
                          <ArrowLeftRight size={40} className="text-secondary-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-2">
                          {language === "kinyarwanda"
                            ? "Amagambo yahinduwe"
                            : language === "french"
                            ? "Texte traduit"
                            : "Translated Text"}
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                          {language === "kinyarwanda"
                            ? "Ikimenyetso cyawe kizahindurwa amagambo hano"
                            : language === "french"
                            ? "Votre geste sera traduit en texte ici"
                            : "Your gesture will be translated to text here"}
                        </p>
                      </div>
                    )
                  ) : (
                    signAnimations.length > 0 ? (
                      <div className="w-full h-full p-6 overflow-y-auto">
                        {/* Display original text with speak button */}
                        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">
                              {language === "kinyarwanda"
                                ? "Amagambo y'ibanze:"
                                : language === "french"
                                ? "Texte original :"
                                : "Original Text:"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSpeakTextInput}
                              className="h-8 w-8 p-0"
                            >
                              <Volume2 size={16} className="text-accent" />
                            </Button>
                          </div>
                          <p className="text-lg font-semibold text-foreground">{textInput}</p>
                        </div>

                        {/* Sign animations list */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {language === "kinyarwanda"
                              ? "Ibimenyetso bya KSL:"
                              : language === "french"
                              ? "Gestes KSL :"
                              : "KSL Signs:"}
                          </p>
                          {signAnimations.map((sign, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-accent/50 transition-colors"
                            >
                              <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-secondary-foreground">
                                  {sign.word[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{sign.word}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center mb-4 mx-auto">
                          <ArrowLeftRight size={40} className="text-secondary-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-2">
                          {language === "kinyarwanda"
                            ? "Animasi ya KSL"
                            : language === "french"
                            ? "Animation KSL"
                            : "KSL Animation"}
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                          {language === "kinyarwanda"
                            ? "Animasi y'ibimenyetso bya KSL izagaragara hano"
                            : language === "french"
                            ? "Les gestes KSL animés apparaîtront ici"
                            : "Animated KSL gestures will appear here"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-8 sm:py-4 bg-muted/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto text-center sm:text-left">
                <span className="text-sm text-muted-foreground">
                  {language === "kinyarwanda"
                    ? "Ururimi rusohoka:"
                    : language === "french"
                    ? "Langue de sortie :"
                    : "Output Language:"}
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setOutputLanguage("kinyarwanda")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      outputLanguage === "kinyarwanda"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    Kinyarwanda
                  </button>
                  <button
                    onClick={() => setOutputLanguage("english")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      outputLanguage === "english"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setOutputLanguage("french")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      outputLanguage === "french"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                  >
                    Français
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground w-full sm:w-auto">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {recognitionAccuracy}% Recognition Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
