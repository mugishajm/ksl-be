import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import kslLogo from "@/assets/ksl-logo.png";
import { useLanguage, type Language } from "@/context/LanguageContext";

const languageContent: Record<
  Language,
  {
    headlinePrefix: string;
    description: string;
    hello: { label: string; translation: string };
    thanks: { label: string; translation: string };
  }
> = {
  kinyarwanda: {
    headlinePrefix: "Dusimbuka inzitizi dukoresheje",
    description:
      "Igenzura ry'imiterere y'intoki mu gihe nyacyo no guhindura hagati ya Kinyarwanda Sign Language n'ikinyarwanda cyavuzwe cyangwa cyanditse. Guhuza abafite ubumuga bwo kutumva no kutavuga n'abumva bakanavuga.",
    hello: { label: "Muraho", translation: "Hello" },
    thanks: { label: "Murakoze", translation: "Thank you" },
  },
  english: {
    headlinePrefix: "Breaking Barriers with",
    description:
      "Real-time gesture recognition and translation between Kinyarwanda Sign Language and spoken/written Kinyarwanda. Empowering deaf and hearing communities to connect.",
    hello: { label: "Hello", translation: "Muraho" },
    thanks: { label: "Thank you", translation: "Murakoze" },
  },
  french: {
    headlinePrefix: "Briser les barrières avec",
    description:
      "Reconnaissance des gestes en temps réel et traduction entre la langue des signes kinyarwanda et le kinyarwanda parlé ou écrit. Renforcer les liens entre les communautés sourdes et entendantes.",
    hello: { label: "Bonjour", translation: "Muraho" },
    thanks: { label: "Merci", translation: "Murakoze" },
  },
};

const HeroSection = () => {
  const { language, setLanguage } = useLanguage();
  const content = languageContent[language];

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 gradient-surface" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-ksl-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-ksl-yellow/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium mb-6 animate-slide-up">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="hidden sm:inline">Language:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setLanguage("kinyarwanda")}
                  className={`px-2 py-1 rounded-full text-xs md:text-sm transition-colors ${language === "kinyarwanda"
                    ? "bg-primary text-primary-foreground shadow-button"
                    : "bg-transparent text-primary hover:bg-primary/20"
                    }`}
                >
                  Kinyarwanda
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("english")}
                  className={`px-2 py-1 rounded-full text-xs md:text-sm transition-colors ${language === "english"
                    ? "bg-primary text-primary-foreground shadow-button"
                    : "bg-transparent text-primary hover:bg-primary/20"
                    }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("french")}
                  className={`px-2 py-1 rounded-full text-xs md:text-sm transition-colors ${language === "french"
                    ? "bg-primary text-primary-foreground shadow-button"
                    : "bg-transparent text-primary hover:bg-primary/20"
                    }`}
                >
                  French
                </button>
              </div>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up animation-delay-200">
              {content.headlinePrefix}{" "}
              <span className="text-gradient-hero">Kinyarwanda</span>{" "}
              <span className="text-ksl-yellow">Sign Language</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-slide-up animation-delay-400">
              {content.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animation-delay-600">
              <Button asChild variant="hero" size="xl">
                <Link to="/translate">
                  {language === "kinyarwanda"
                    ? "Tangira Guhindura"
                    : language === "french"
                      ? "Commencer la traduction"
                      : "Start Translating"}
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="xl">
                <Link to="/translate">
                  <Play size={20} className="mr-2" />
                  {language === "kinyarwanda"
                    ? "Reba Igerageza"
                    : language === "french"
                      ? "Voir la démo"
                      : "Watch Demo"}
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start mt-12 pt-8 border-t border-border">
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">
                  {language === "kinyarwanda"
                    ? "Ibimenyetso bya KSL"
                    : language === "french"
                      ? "Gestes KSL"
                      : "KSL Gestures"}
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-ksl-yellow">96%</p>
                <p className="text-sm text-muted-foreground">
                  {language === "kinyarwanda"
                    ? "Ukuri kw'Isuzuma"
                    : language === "french"
                      ? "Taux de précision"
                      : "Accuracy Rate"}
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-accent">
                  {language === "kinyarwanda"
                    ? "Mu gihe nyacyo"
                    : language === "french"
                      ? "Temps réel"
                      : "Real-time"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "kinyarwanda"
                    ? "Ubuhinduzi"
                    : language === "french"
                      ? "Traduction"
                      : "Translation"}
                </p>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Floating logo */}
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-3xl shadow-card bg-card p-8 animate-float">
                <img
                  src={kslLogo}
                  alt="KSL - Kinyarwanda Sign Language"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-card rounded-2xl shadow-card p-4 animate-bounce-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                    <span className="text-primary-foreground text-lg">👋</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{content.hello.label}</p>
                    <p className="text-xs text-muted-foreground">{content.hello.translation}</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl shadow-card p-4 animate-bounce-subtle animation-delay-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center">
                    <span className="text-secondary-foreground text-lg">🤟</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{content.thanks.label}</p>
                    <p className="text-xs text-muted-foreground">{content.thanks.translation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
