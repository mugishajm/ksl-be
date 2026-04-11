import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const GestureLibrary = () => {
  const { language } = useLanguage();

  const content = {
    badge: {
      kinyarwanda: "Ibikoresho",
      english: "Resources",
      french: "Ressources",
    },
    title: {
      kinyarwanda: "Ibitabo by'Ibimenyetso",
      english: "Gesture Library",
      french: "Bibliothèque de gestes",
    },
    description: {
      kinyarwanda:
        "Reba ingero z'ibimenyetso bya Kinyarwanda Sign Language, ibisobanuro byabyo n'uko bikoreshwa mu buzima bwa buri munsi.",
      english:
        "Explore examples of Kinyarwanda Sign Language gestures, their meanings, and how they are used in everyday communication.",
      french:
        "Découvrez des exemples de gestes de la langue des signes kinyarwanda, leurs significations et leur utilisation au quotidien.",
    },
  } as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex justify-center md:justify-start">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/#resources">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === "kinyarwanda"
                    ? "Subira ku bikoresho"
                    : language === "french"
                    ? "Retour aux ressources"
                    : "Back to resources"}
                </span>
                <span className="sm:hidden">
                  {language === "kinyarwanda"
                    ? "Subira"
                    : language === "french"
                    ? "Retour"
                    : "Back"}
                </span>
              </Link>
            </Button>
          </div>
          <header className="mb-10 text-center md:text-left">
            <p className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
              {content.badge[language]}
            </p>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold">
              {content.title[language]}
            </h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              {content.description[language]}
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-card border border-border p-5 md:p-6">
              <h2 className="mb-2 font-display text-lg md:text-xl font-semibold text-foreground">
                Greetings
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Common gestures for saying hello, goodbye, and polite introductions.
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 md:p-6">
              <h2 className="mb-2 font-display text-lg md:text-xl font-semibold text-foreground">
                Daily expressions
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Useful signs for everyday life, including questions, answers, and directions.
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 md:p-6">
              <h2 className="mb-2 font-display text-lg md:text-xl font-semibold text-foreground">
                Education
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Vocabulary used in classrooms and learning environments.
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 md:p-6">
              <h2 className="mb-2 font-display text-lg md:text-xl font-semibold text-foreground">
                Health & emergency
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Critical gestures for health, safety, and emergency situations.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GestureLibrary;

