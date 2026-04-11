import { Heart, Users, Target, Lightbulb } from "lucide-react";
import kslLogo from "@/assets/ksl-logo.png";
import { useLanguage } from "@/context/LanguageContext";

const values = [
  {
    icon: Heart,
    key: "accessibility",
  },
  {
    icon: Users,
    key: "community",
  },
  {
    icon: Target,
    key: "accuracy",
  },
  {
    icon: Lightbulb,
    key: "innovation",
  },
] as const;

const valueContent = {
  accessibility: {
    title: {
      kinyarwanda: "Kubanza Uburenganzira",
      english: "Accessibility First",
      french: "Accessibilité d'abord",
    },
    description: {
      kinyarwanda: "Gusenya inzitizi z'itumanaho ku muryango w'abafite ubumuga bwo kutumva no kutavuga mu Rwanda.",
      english: "Breaking communication barriers for the deaf community in Rwanda.",
      french: "Briser les barrières de communication pour la communauté sourde au Rwanda.",
    },
  },
  community: {
    title: {
      kinyarwanda: "Gushingira ku Muryango",
      english: "Community Driven",
      french: "Porté par la communauté",
    },
    description: {
      kinyarwanda:
        "Yubatswe ifatanyije n'umuryango w'abafite ubumuga bwo kutumva no kutavuga n'inzobere mu rurimi rw'ibimenyetso.",
      english: "Built with input from the deaf community and sign language experts.",
      french:
        "Construit avec la contribution de la communauté sourde et des experts en langue des signes.",
    },
  },
  accuracy: {
    title: {
      kinyarwanda: "Gushimangira Ukuri",
      english: "Accuracy Focused",
      french: "Centré sur la précision",
    },
    description: {
      kinyarwanda:
        "Guhora tunoza modeli z'ubwenge bw'ikoranabuhanga kugira ngo tumenye ibimenyetso neza.",
      english: "Continuously improving AI models for precise gesture recognition.",
      french: "Amélioration continue des modèles d'IA pour une reconnaissance précise des gestes.",
    },
  },
  innovation: {
    title: {
      kinyarwanda: "Ireme ry'Iterambere",
      english: "Innovation",
      french: "Innovation",
    },
    description: {
      kinyarwanda:
        "Gukoresha ikoranabuhanga rigezweho mu kubungabunga no guteza imbere Kinyarwanda Sign Language.",
      english: "Leveraging cutting-edge AI to preserve and promote KSL.",
      french: "Exploiter une IA de pointe pour préserver et promouvoir la langue des signes KSL.",
    },
  },
} as const;

const AboutSection = () => {
  const { language } = useLanguage();
  return (
    <section id="about" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-ksl-green/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              {language === "kinyarwanda"
                ? "Ibyerekeye KSL"
                : language === "french"
                  ? "À propos de KSL"
                  : "About KSL"}
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {language === "kinyarwanda"
                ? "Gutanga Imbaraga ku "
                : language === "french"
                  ? "Renforcer la "
                  : "Empowering "}
              <span className="text-gradient-hero">
                {language === "kinyarwanda"
                  ? "Itumanaho"
                  : language === "french"
                    ? "communication"
                    : "Communication"}
              </span>{" "}
              {language === "kinyarwanda"
                ? "ku Bantu Bose"
                : language === "french"
                  ? "pour tous"
                  : "for Everyone"}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {language === "kinyarwanda"
                ? "KSL (Kinyarwanda Sign Language) ni urubuga rukoreshwa n'ubwenge bw'ikoranabuhanga rugamije gusenya icyuho cy'itumanaho hagati y'abafite ubumuga bwo kutumva no kutavuga n'abatabufite mu Rwanda."
                : language === "french"
                  ? "KSL (Kinyarwanda Sign Language) est une plateforme alimentée par l'IA dédiée à combler le fossé de communication entre les communautés sourdes et entendantes au Rwanda."
                  : "KSL (Kinyarwanda Sign Language) is an AI-powered platform dedicated to bridging the communication gap between the deaf and hearing communities in Rwanda."}
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {language === "kinyarwanda"
                ? "Intego yacu ni ugubungabunga no guteza imbere Kinyarwanda Sign Language binyuze mu ikoranabuhanga, kugira ngo igere kuri bose. Dukoresheje computer vision n'ubwenge bw'ikoranabuhanga, dutanga ubusobanuro mu gihe nyacyo butuma itumanaho hagati y'abakoresha ibimenyetso n'abadatambikozaho ribasha kugenda neza."
                : language === "french"
                  ? "Notre mission est de préserver et de promouvoir la langue des signes kinyarwanda grâce à la technologie, en la rendant accessible à tous. En utilisant la vision par ordinateur avancée et l'apprentissage automatique, nous fournissons une traduction en temps réel qui permet une communication fluide entre les utilisateurs de la langue des signes et ceux qui ne la connaissent pas."
                  : "Our mission is to preserve and promote Kinyarwanda Sign Language through technology, making it accessible to everyone. Using advanced computer vision and machine learning, we provide real-time translation that enables seamless communication between sign language users and those who don't know sign language."}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {values.map((value) => (
                <div
                  key={value.key}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-soft transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      {valueContent[value.key].title[language]}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {valueContent[value.key].description[language]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative flex justify-center">
            <div className="relative">
              {/* Main card */}
              <div className="w-80 md:w-96 aspect-square rounded-3xl bg-card border border-border p-8 flex items-center justify-center">
                <img
                  src={kslLogo}
                  alt="KSL Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Floating stats */}
              <div className="absolute -top-6 -left-6 bg-card rounded-2xl shadow-card p-5 border border-border">
                <p className="font-display text-3xl font-bold text-primary">500K+</p>
                <p className="text-sm text-muted-foreground">Deaf community in Rwanda</p>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-card rounded-2xl shadow-card p-5 border border-border">
                <p className="font-display text-3xl font-bold text-ksl-yellow">1st</p>
                <p className="text-sm text-muted-foreground">AI KSL Interpreter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
