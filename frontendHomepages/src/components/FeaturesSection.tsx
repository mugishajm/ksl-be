import {
  Camera,
  MessageSquare,
  Volume2,
  Type,
  Database,
  BarChart3,
  Globe,
  Shield,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const baseFeatures = [
  { key: "realtimeCapture", icon: Camera, color: "primary" },
  { key: "kslToText", icon: MessageSquare, color: "secondary" },
  { key: "kslToSpeech", icon: Volume2, color: "accent" },
  { key: "textToKsl", icon: Type, color: "primary" },
  { key: "gestureDb", icon: Database, color: "secondary" },
  { key: "analytics", icon: BarChart3, color: "accent" },
  { key: "auth", icon: Shield, color: "secondary" },
  { key: "multiLang", icon: Globe, color: "primary" },
] as const;

const featureContent = {
  realtimeCapture: {
    title: {
      kinyarwanda: "Ifatwa ry'Ibimenyetso mu Kayanya",
      english: "Real-Time Gesture Capture",
      french: "Capture de gestes en temps réel",
    },
    description: {
      kinyarwanda:
        "Koresha kamera yawe cyangwa telefoni kugira ngo ufate imiterere y'intoki n'umubiri ukora ibimenyetso bya KSL mu gihe nyacyo.",
      english:
        "Uses your webcam or smartphone camera to capture hand and body movements performing KSL gestures in real time.",
      french:
        "Utilise votre webcam ou smartphone pour capturer en temps réel les mouvements des mains et du corps effectuant les gestes KSL.",
    },
  },
  kslToText: {
    title: {
      kinyarwanda: "Guhindura KSL mu Magambo",
      english: "KSL-to-Text Translation",
      french: "Traduction KSL vers texte",
    },
    description: {
      kinyarwanda:
        "Ihindura ibimenyetso bya Kinyarwanda Sign Language mu magambo yanditse mu Kinyarwanda cyangwa Icyongereza.",
      english:
        "Converts detected Kinyarwanda Sign Language gestures into readable Kinyarwanda or English text on the screen.",
      french:
        "Convertit les gestes de la langue des signes kinyarwanda en texte lisible en kinyarwanda ou en anglais à l'écran.",
    },
  },
  kslToSpeech: {
    title: {
      kinyarwanda: "Guhindura KSL mu Majwi",
      english: "KSL-to-Speech Translation",
      french: "Traduction KSL vers voix",
    },
    description: {
      kinyarwanda:
        "Ihindura amagambo yasobanuwe akavamo ijwi, bigafasha abumva kumva ubutumwa bwasizwe.",
      english:
        "Transforms translated text into spoken audio, enabling hearing individuals to understand signed messages.",
      french:
        "Transforme le texte traduit en audio parlé, permettant aux entendants de comprendre les messages signés.",
    },
  },
  textToKsl: {
    title: {
      kinyarwanda: "Amagambo ajya muri KSL",
      english: "Text-to-KSL Translation",
      french: "Traduction texte vers KSL",
    },
    description: {
      kinyarwanda:
        "Andika amagambo mu Kinyarwanda cyangwa Icyongereza maze urebe uko ahinduka ibimenyetso bya KSL.",
      english:
        "Input text in Kinyarwanda or English and see it translated into corresponding KSL gestures as animations.",
      french:
        "Saisissez du texte en kinyarwanda ou en anglais et voyez-le traduit en gestes KSL correspondants sous forme d'animations.",
    },
  },
  gestureDb: {
    title: {
      kinyarwanda: "Igereranya ry'Ibimenyetso",
      english: "Gesture Database",
      french: "Base de données de gestes",
    },
    description: {
      kinyarwanda:
        "Isanduku nini y'ibimenyetso bya KSL n'amashusho, amashusho agendanwa, inyito n'igisobanuro cyabyo.",
      english:
        "Comprehensive library of KSL gestures including images, videos, labels, and meanings for accurate recognition.",
      french:
        "Bibliothèque complète de gestes KSL incluant images, vidéos, étiquettes et significations pour une reconnaissance précise.",
    },
  },
  analytics: {
    title: {
      kinyarwanda: "Isesengura ry'Imikorere",
      english: "Performance Analytics",
      french: "Analytique de performance",
    },
    description: {
      kinyarwanda:
        "Kurikira ukuri kw'isobanura, umuvuduko n'imikoreshereze kugira ngo umenye uko sisitemu ikora.",
      english:
        "Track recognition accuracy, response time, and usage statistics to monitor system effectiveness.",
      french:
        "Suivez la précision de reconnaissance, le temps de réponse et les statistiques d'utilisation pour mesurer l'efficacité du système.",
    },
  },
  auth: {
    title: {
      kinyarwanda: "Kwizera Konti",
      english: "Secure Authentication",
      french: "Authentification sécurisée",
    },
    description: {
      kinyarwanda:
        "Kwiyandikisha no kwinjira mu buryo bwizewe bigufasha kugira ubwirinzi n'uburyo bwihariye bwo gukoresha sisitemu.",
      english:
        "User authentication ensures privacy and enables personalized system usage for students and interpreters.",
      french:
        "L'authentification des utilisateurs garantit la confidentialité et permet une utilisation personnalisée pour les étudiants et interprètes.",
    },
  },
  multiLang: {
    title: {
      kinyarwanda: "Inkunga y'Indimi nyinshi",
      english: "Multi-Language Support",
      french: "Support multilingue",
    },
    description: {
      kinyarwanda:
        "Hitamo hagati y'Ikinyarwanda, Icyongereza n'Igifaransa mu magambo n'amajwi asohoka.",
      english:
        "Choose between Kinyarwanda and English for translated text and speech output.",
      french:
        "Choisissez entre kinyarwanda et anglais pour le texte traduit et la sortie vocale.",
    },
  },
} as const;

const getColorClasses = (color: string) => {
  switch (color) {
    case "primary":
      return {
        bg: "bg-primary/10",
        icon: "text-primary",
        border: "hover:border-primary/30",
      };
    case "secondary":
      return {
        bg: "bg-secondary/30",
        icon: "text-ksl-yellow",
        border: "hover:border-secondary/50",
      };
    case "accent":
      return {
        bg: "bg-accent/10",
        icon: "text-accent",
        border: "hover:border-accent/30",
      };
    default:
      return {
        bg: "bg-primary/10",
        icon: "text-primary",
        border: "hover:border-primary/30",
      };
  }
};

const FeaturesSection = () => {
  const { language } = useLanguage();
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {language === "kinyarwanda"
              ? "Ibiranga"
              : language === "french"
                ? "Fonctionnalités"
                : "Features"}
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {language === "kinyarwanda"
              ? "Ibiranga bikomeye byo gufasha "
              : language === "french"
                ? "Des fonctionnalités puissantes pour une "
                : "Powerful Features for "}
            <span className="text-gradient-hero">
              {language === "kinyarwanda"
                ? "Itumanaho ridafite imbogamizi"
                : language === "french"
                  ? "communication fluide"
                  : "Seamless Communication"}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {language === "kinyarwanda"
              ? "Urubuga rukoreshwa n'ubwenge bw'ikoranabuhanga rutanga ibikoresho byuzuye byo guhindura hagati ya Kinyarwanda Sign Language n'indimi zavuzwe cyangwa zanditswe."
              : language === "french"
                ? "Notre plateforme alimentée par l'IA fournit des outils complets pour traduire entre la langue des signes kinyarwanda et les langues parlées ou écrites."
                : "Our AI-powered platform provides comprehensive tools for translating between Kinyarwanda Sign Language and spoken/written languages."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {baseFeatures.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            const content = featureContent[feature.key];
            return (
              <div
                key={index}
                className={`group bg-card rounded-2xl p-6 border border-border transition-all duration-300 hover:shadow-card hover:-translate-y-1 ${colors.border}`}
              >
                <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-5`}>
                  <feature.icon className={`w-7 h-7 ${colors.icon}`} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {content.title[language]}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {content.description[language]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
