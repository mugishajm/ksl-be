import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SignSequencePresenter, type SignPreviewItem } from "./SignSequencePresenter";
import { HandSkeletonOverlay } from "./HandSkeletonOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useLanguage } from "./context/LanguageContext";

const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw !== undefined && raw !== "") return `${raw.replace(/\/$/, "")}/api`;
  return "/api";
})();

// Icons
const IcCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
  </svg>
);
const IcSwap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" />
  </svg>
);
const IcType = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" />
  </svg>
);
const IcSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const IcStop = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const IcVolume = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const IcTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

interface ApiStatus { active: boolean; status?: string; started_at?: string | null; }
interface Prediction { letter: string; confidence: number; text: string; current_letter?: string; }

async function getUserMediaWithFallbacks(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false },
    { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
    { video: true, audio: false }
  ];
  let lastError: unknown;
  for (const c of attempts) {
    try { return await navigator.mediaDevices.getUserMedia(c); } catch (e) { lastError = e; }
  }
  throw lastError;
}

const translations = {
  kinyarwanda: {
    badge: "Gerageza",
    heroTitle1: "Gerageza",
    heroTitleItalic: "Ihindurangenga",
    heroTitle2: "mu gihe nyacyo",
    heroDesc: "Reba uko sisitemu yacu ikoresha ubwenge bw'ikoranabuhanga ihindura hagati y'ururimi rw'ibimenyetso n'indimi zivugwa mu kanya ako kanya.",
    tabSignToText: "Ikimenyetso mu magambo",
    tabTextToSign: "Amagambo ajya mu kimenyetso",
    leftCardCamera: "Ibisohoka bya Kamera",
    leftCardText: "Injiza Amagambo",
    rightCard: "Ibisohoka by'Ubuhinduzi",
    cameraTitle: "Igaragaza rya Kamera",
    cameraDesc: "Kanda hano kugirango wemerere kamera utangire gufata ibimenyetso bya KSL.",
    startCamera: "Murikira Kamera",
    startingCamera: "Gutangira...",
    outputLangLabel: "Ururimi rusohoka",
    addLetter: "+ Inyuguti",
    addSpace: "+ Akagabane",
    waitingGestures: "Gutegereza ibimenyetso...",
    clearAll: "Siba byose",
    speak: "Vuga",
    translatedWords: "Amagambo yahinduwe",
    translatedWordsDesc: "Ikimenyetso cyawe kizahindurwa amagambo hano",
    emptyMatrix: "Sequence Matrix Empty",
    accuracy: "Ukuri kw'isuzuma",
    hideLogs: "Hisha Logs",
    showLogs: "Pipeline Logs",
    textPlaceholder: "Andika hano amagambo ushaka guhindura...",
    translateBtn: "Hindura mu Kimenyetso",
    detection: "Detection",
    waiting: "Gutegereza...",
  },
  english: {
    badge: "Demo",
    heroTitle1: "Try",
    heroTitleItalic: "Real-time Translation",
    heroTitle2: "now",
    heroDesc: "See how our AI-powered system translates between sign language and spoken languages in real time.",
    tabSignToText: "Sign to Text",
    tabTextToSign: "Text to Sign",
    leftCardCamera: "Camera Input",
    leftCardText: "Enter Text",
    rightCard: "Translation Output",
    cameraTitle: "Camera View",
    cameraDesc: "Click below to allow camera access and start capturing KSL gestures.",
    startCamera: "Start Camera",
    startingCamera: "Starting...",
    outputLangLabel: "Output language",
    addLetter: "+ Letter",
    addSpace: "+ Space",
    waitingGestures: "Waiting for gestures...",
    clearAll: "Clear all",
    speak: "Speak",
    translatedWords: "Translated Words",
    translatedWordsDesc: "Your gesture will be translated into words here",
    emptyMatrix: "Sequence Matrix Empty",
    accuracy: "Recognition accuracy",
    hideLogs: "Hide Logs",
    showLogs: "Pipeline Logs",
    textPlaceholder: "Type text to convert to sign language...",
    translateBtn: "Translate to Sign",
    detection: "Detection",
    waiting: "Loading...",
  },
  french: {
    badge: "Démo",
    heroTitle1: "Essayez la",
    heroTitleItalic: "traduction en temps réel",
    heroTitle2: "maintenant",
    heroDesc: "Découvrez comment notre système basé sur l'IA traduit entre la langue des signes et les langues parlées en temps réel.",
    tabSignToText: "Signe en texte",
    tabTextToSign: "Texte en signe",
    leftCardCamera: "Entrée caméra",
    leftCardText: "Saisir du texte",
    rightCard: "Résultat de la traduction",
    cameraTitle: "Vue caméra",
    cameraDesc: "Cliquez ci-dessous pour autoriser l'accès à la caméra et commencer à capturer les gestes KSL.",
    startCamera: "Démarrer la caméra",
    startingCamera: "Démarrage...",
    outputLangLabel: "Langue de sortie",
    addLetter: "+ Lettre",
    addSpace: "+ Espace",
    waitingGestures: "En attente de gestes...",
    clearAll: "Tout effacer",
    speak: "Parler",
    translatedWords: "Mots traduits",
    translatedWordsDesc: "Votre geste sera traduit en mots ici",
    emptyMatrix: "Matrice de séquence vide",
    accuracy: "Précision de reconnaissance",
    hideLogs: "Masquer les logs",
    showLogs: "Logs pipeline",
    textPlaceholder: "Tapez le texte à convertir en langue des signes...",
    translateBtn: "Traduire en signe",
    detection: "Détection",
    waiting: "Chargement...",
  },
} as const;

export default function InterpreterPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<"sign-to-text" | "text-to-sign">("sign-to-text");
  const [status, setStatus] = useState<ApiStatus>({ active: false, status: "idle", started_at: null });
  const [prediction, setPrediction] = useState<Prediction>({ letter: "", confidence: 0, text: "", current_letter: "" });
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [outputLang, setOutputLang] = useState("rw");
  const [textInput, setTextInput] = useState("");
  const [signPreviewItems, setSignPreviewItems] = useState<SignPreviewItem[]>([]);
  const [signSourceSnapshot, setSignSourceSnapshot] = useState("");
  const [signPreviewNote, setSignPreviewNote] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camRef = useRef(false);

  const getJson = useCallback(async <T,>(path: string): Promise<T> => {
    const r = await fetch(`${API_BASE}${path}`);
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json() as Promise<T>;
  }, []);

  const refresh = async () => {
    try {
      const [s, l, p] = await Promise.all([
        getJson<ApiStatus>("/status"),
        getJson<{ logs: string[] }>("/logs"),
        getJson<Prediction>("/prediction"),
      ]);
      setStatus(s);
      setLogs(l.logs);
      setPrediction({ letter: p.current_letter || p.letter || "", confidence: p.confidence || 0, text: p.text || "" });
      if (!camRef.current) setError("");
    } catch (e) {
      if (!camRef.current) {
        const net = e instanceof TypeError && String(e.message).toLowerCase().includes("fetch");
        setError(net ? "Cannot reach API — run: python api_server.py" : (e instanceof Error ? e.message : "API error"));
      }
    }
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 2000);
    return () => clearInterval(id);
  }, []);

  // Frame send loop
  useEffect(() => {
    if (!cameraActive) return;
    const vid = videoRef.current;
    const can = canvasRef.current;
    if (!vid || !can) return;
    const id = setInterval(async () => {
      if (vid.videoWidth === 0) return;
      can.width = vid.videoWidth; can.height = vid.videoHeight;
      const ctx = can.getContext("2d"); if (!ctx) return;
      ctx.drawImage(vid, 0, 0, can.width, can.height);
      const image = can.toDataURL("image/jpeg", 0.75);
      try {
        await fetch(`${API_BASE}/analyze-frame`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });
      } catch { }
    }, 250);
    return () => clearInterval(id);
  }, [cameraActive]);

  const startInterpreter = async () => {
    setLoading(true); setError("");
    try {
      const stream = await getUserMediaWithFallbacks();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
      }
      camRef.current = true; setCameraActive(true);
      await fetch(`${API_BASE}/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "letter" }),
      });
      void refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Camera failed"); }
    setLoading(false);
  };

  const stopInterpreter = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/stop`, { method: "POST" });
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
      camRef.current = false; setCameraActive(false);
      void refresh();
    } catch { }
    setLoading(false);
  };

  const commitLetter = () => fetch(`${API_BASE}/commit-letter`, { method: "POST" }).then(() => refresh()).catch(() => { });
  const commitSpace = () => fetch(`${API_BASE}/commit-space`, { method: "POST" }).then(() => refresh()).catch(() => { });
  const clearText = () => fetch(`${API_BASE}/clear`, { method: "POST" }).then(() => refresh()).catch(() => { });

  const fetchFingerSpelling = async () => {
    try {
      const r = await fetch(`${API_BASE}/text-to-sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      setSignPreviewItems(data.items || []);
      setSignSourceSnapshot(textInput);
      setSignPreviewNote(data.note || "");
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not fetch signs"); }
  };

  const speakResult = () => {
    if (!prediction.text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(prediction.text));
  };

  const runDuration = useMemo(() => {
    if (!status.started_at || !cameraActive) return "00:00:00";
    const s = Math.max(0, Math.floor((Date.now() - Date.parse(status.started_at)) / 1000));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, "0")).join(":");
  }, [status, cameraActive]);

  return (
    /* ─── ROOT: deep navy matching reference ─── */
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden flex flex-col custom-scrollbar">

      <Header />

      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="flex-1 pt-24 md:pt-32 pb-20 container mx-auto px-6 flex flex-col items-center">

        {/* Hero text */}
        <div className="text-center max-w-3xl mb-14 space-y-5">
          <span className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest">
            {t.badge}
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
            {t.heroTitle1}{" "}
            <span className="text-amber-400 italic">{t.heroTitleItalic}</span>
            {" "}{t.heroTitle2}
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            {t.heroDesc}
          </p>
        </div>

        {/* ─── Tab switcher ─── */}
        <div className="bg-slate-900/70 border border-white/5 p-1.5 rounded-full flex gap-1 shadow-xl mb-12">
          <button
            onClick={() => setActiveTab("sign-to-text")}
            className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "sign-to-text"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-400 hover:text-white"
              }`}
          >
            <IcCamera /> {t.tabSignToText}
          </button>
          <button
            onClick={() => setActiveTab("text-to-sign")}
            className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "text-to-sign"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-400 hover:text-white"
              }`}
          >
            <IcType /> {t.tabTextToSign}
          </button>
        </div>

        {/* ─── Two panel cards ─── */}
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">

          {/* LEFT card: Input */}
          <div className="bg-slate-800/60 border border-white/5 rounded-3xl p-8 flex flex-col gap-6 backdrop-blur-sm">
            <h3 className="font-bold text-base text-white">
              {activeTab === "sign-to-text" ? t.leftCardCamera : t.leftCardText}
            </h3>

            {activeTab === "sign-to-text" ? (
              /* Camera view */
              <div className="relative bg-slate-900/50 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center border border-white/5">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? "opacity-100" : "opacity-0"}`}
                />
                <HandSkeletonOverlay videoRef={videoRef} active={cameraActive} />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraActive && (
                  <div className="relative z-10 flex flex-col items-center text-center px-6 gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-float">
                      <IcCamera />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white/70 mb-1">{t.cameraTitle}</p>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
                        {t.cameraDesc}
                      </p>
                    </div>
                    <button
                      onClick={startInterpreter}
                      disabled={loading}
                      className="px-8 py-3 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? t.startingCamera : t.startCamera}
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <button
                    onClick={stopInterpreter}
                    className="absolute bottom-4 right-4 z-20 p-3 bg-red-500/80 text-white rounded-xl shadow-lg hover:bg-red-500 active:scale-90 transition-all"
                  >
                    <IcStop />
                  </button>
                )}
              </div>
            ) : (
              /* Text input */
              <div className="flex flex-col gap-4 flex-1">
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={t.textPlaceholder}
                  className="flex-1 min-h-[180px] bg-slate-900/50 border border-white/5 rounded-2xl p-5 text-white placeholder:text-slate-600 text-base font-medium resize-none focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
                <button
                  onClick={fetchFingerSpelling}
                  className="h-12 rounded-full bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-[0.98] transition-all"
                >
                  {t.translateBtn}
                </button>
              </div>
            )}

            {/* Language selector */}
            {activeTab === "sign-to-text" && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.outputLangLabel}</span>
                <div className="flex bg-slate-900/60 border border-white/5 rounded-full p-1 gap-1">
                  {[["rw", "Kinyarwanda"], ["en", "English"]].map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setOutputLang(v)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${outputLang === v ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT card: Output */}
          <div className="bg-slate-700/40 border border-white/5 rounded-3xl p-8 flex flex-col gap-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">{t.rightCard}</h3>
              {cameraActive && (
                <div className="text-xs font-black text-slate-400 tabular-nums">
                  ⏱ {runDuration}
                </div>
              )}
            </div>

            {activeTab === "sign-to-text" ? (
              <div className="flex-1 bg-slate-900/40 rounded-2xl border border-white/5 p-6 flex flex-col min-h-[240px] relative">
                {cameraActive ? (
                  <>
                    {/* Live detection display */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <span className="text-4xl font-black text-emerald-400">{prediction.letter || "—"}</span>
                        </div>
                        <span className="text-[9px] text-slate-600 uppercase tracking-widest mt-1">Detection</span>
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <button onClick={commitLetter} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors border border-white/5">
                          {t.addLetter}
                        </button>
                        <button onClick={commitSpace} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors border border-white/5">
                          {t.addSpace}
                        </button>
                      </div>
                    </div>
                    {/* Translation text */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <p className="text-2xl font-bold leading-relaxed text-white">
                        {prediction.text || <span className="text-slate-700 italic">{t.waitingGestures}</span>}
                        <span className="inline-block w-0.5 h-7 bg-emerald-400 ml-1 animate-pulse align-middle" />
                      </p>
                    </div>
                    {/* Footer actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <button onClick={clearText} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors">
                        <IcTrash /> {t.clearAll}
                      </button>
                      <button onClick={speakResult} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors border border-white/5">
                        <IcVolume /> {t.speak}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Idle state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <IcSwap />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/60 mb-1">{t.translatedWords}</p>
                      <p className="text-xs text-slate-500 max-w-[160px]">{t.translatedWordsDesc}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text-to-Sign output */
              <div className="flex-1 bg-slate-900/40 rounded-2xl border border-white/5 p-6 flex flex-col min-h-[240px] overflow-hidden">
                {signPreviewItems.length > 0 ? (
                  <SignSequencePresenter items={signPreviewItems} sourceSnapshot={signSourceSnapshot} note={signPreviewNote} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-30">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <IcSwap />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.emptyMatrix}</p>
                  </div>
                )}
              </div>
            )}

            {/* Confidence + accuracy pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                {t.accuracy} {Math.round(prediction.confidence * 100) || 95}%
              </div>
              <button
                onClick={() => setShowLogs(p => !p)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-300 transition-colors underline underline-offset-4"
              >
                {showLogs ? t.hideLogs : t.showLogs}
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full max-w-5xl mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400/50 hover:text-red-400">✕</button>
          </div>
        )}

        {/* Logs drawer */}
        {showLogs && (
          <div className="w-full max-w-5xl mt-6 rounded-3xl bg-slate-950 border border-white/5 p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Pipeline Telemetry</span>
              <button onClick={() => setLogs([])} className="text-xs text-slate-700 hover:text-slate-400 transition-colors uppercase tracking-widest">Flush</button>
            </div>
            <div className="h-48 overflow-y-auto custom-scrollbar font-mono text-xs text-emerald-400/70 space-y-1.5">
              {logs.length > 0 ? logs.map((l, i) => (
                <div key={i} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded">
                  <span className="text-slate-800 w-10 shrink-0">{String(i).padStart(4, "0")}</span>
                  <span className="break-all">{l}</span>
                </div>
              )) : <p className="text-slate-800 italic">Waiting for backend streams...</p>}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
