import { Camera, Cpu, FileText, Volume2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const steps = [
  {
    number: "01",
    icon: Camera,
    color: "primary",
    key: "capture",
  },
  {
    number: "02",
    icon: Cpu,
    color: "secondary",
    key: "recognition",
  },
  {
    number: "03",
    icon: FileText,
    color: "accent",
    key: "translation",
  },
  {
    number: "04",
    icon: Volume2,
    color: "primary",
    key: "voice",
  },
] as const;

const stepContent = {
  capture: {
    title: {
      kinyarwanda: "Fata Ikimenyetso",
      english: "Capture Gesture",
      french: "Capturer le geste",
    },
    description: {
      kinyarwanda:
        "Shyira kamera imbere y'ukora ikimenyetso cya KSL. Sisitemu yacu ibona intoki, iminwa n'imiterere y'umubiri mu gihe nyacyo.",
      english:
        "Point your camera at the sign language gesture. Our system detects hands, fingers, and body posture in real-time.",
      french:
        "Pointez votre caméra vers le geste en langue des signes. Notre système détecte en temps réel les mains, les doigts et la posture du corps.",
    },
  },
  recognition: {
    title: {
      kinyarwanda: "Kumenya n'Ubwenge bw'Ikoranabuhanga",
      english: "AI Recognition",
      french: "Reconnaissance par IA",
    },
    description: {
      kinyarwanda:
        "Modeli z'ubwenge bw'ikoranabuhanga zisuzuma imyitwarire yafashwe zikayigereranya n'ibimenyetso bya KSL byatozwemo.",
      english:
        "Advanced machine learning models analyze the captured movements and match them with trained KSL gestures.",
      french:
        "Des modèles avancés d'apprentissage automatique analysent les mouvements capturés et les comparent aux gestes KSL entraînés.",
    },
  },
  translation: {
    title: {
      kinyarwanda: "Guhindura",
      english: "Translation",
      french: "Traduction",
    },
    description: {
      kinyarwanda:
        "Ikimenyetso kimenyekanye gihindurwa ako kanya mu magambo yo mu Kinyarwanda cyangwa mu Cyongereza asomeka.",
      english:
        "The recognized gesture is instantly translated into readable Kinyarwanda or English text.",
      french:
        "Le geste reconnu est immédiatement traduit en texte lisible en kinyarwanda ou en anglais.",
    },
  },
  voice: {
    title: {
      kinyarwanda: "Ihumure ry'Amajwi",
      english: "Voice Output",
      french: "Sortie vocale",
    },
    description: {
      kinyarwanda:
        "Ushobora guhindura amagambo yasobanuwe akavamo ijwi ryoroheje, bigafasha itumanaho ridafite imbogamizi.",
      english:
        "Optionally convert the translated text to natural speech for seamless communication.",
      french:
        "Vous pouvez convertir le texte traduit en voix naturelle pour une communication fluide.",
    },
  },
} as const;

const HowItWorksSection = () => {
  const { language } = useLanguage();
  return (
    <section id="how-it-works" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-ksl-blue/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-ksl-yellow/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 text-ksl-yellow text-sm font-medium mb-6">
            {language === "kinyarwanda"
              ? "Uko Bikora"
              : language === "french"
                ? "Comment ça marche"
                : "How It Works"}
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {language === "kinyarwanda"
              ? "Uburyo bworoshye, "
              : language === "french"
                ? "Un processus simple, "
                : "Simple Process, "}
            <span className="text-ksl-yellow">
              {language === "kinyarwanda"
                ? "Ibisubizo bikomeye"
                : language === "french"
                  ? "des résultats puissants"
                  : "Powerful Results"}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {language === "kinyarwanda"
              ? "Sisitemu yacu yoroshye ikoreshwa ituma guhindura ururimi rw'ibimenyetso rigerwaho na bose mu ntambwe nke gusa."
              : language === "french"
                ? "Notre système intuitif rend la traduction en langue des signes accessible à tous en seulement quelques étapes simples."
                : "Our intuitive system makes sign language translation accessible to everyone in just a few simple steps."}
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Step Card */}
                <div className="bg-card rounded-2xl p-6 border border-border shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-2">
                  {/* Number badge */}
                  <div className="absolute -top-4 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {step.number}
                  </div>

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mt-2
                    ${step.color === 'primary' ? 'gradient-hero' : ''}
                    ${step.color === 'secondary' ? 'gradient-warm' : ''}
                    ${step.color === 'accent' ? 'gradient-accent' : ''}
                  `}>
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>

                  <h3 className="font-display text-xl font-semibold mb-3">
                    {stepContent[step.key].title[language]}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {stepContent[step.key].description[language]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
