import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const CommunityForum = () => {
  const { language } = useLanguage();

  const content = {
    badge: {
      kinyarwanda: "Ibikoresho",
      english: "Resources",
      french: "Ressources",
    },
    title: {
      kinyarwanda: "Urubuga rw'Umuryango",
      english: "Community Forum",
      french: "Forum communautaire",
    },
    description: {
      kinyarwanda:
        "Ahantu ho gusangira ibitekerezo, kubaza ibibazo no gukorana ku byerekeye Kinyarwanda Sign Language.",
      english:
        "A space for learners, interpreters, and developers to share ideas, ask questions, and collaborate around Kinyarwanda Sign Language.",
      french:
        "Un espace pour les apprenants, interprètes et développeurs afin de partager des idées, poser des questions et collaborer autour de la langue des signes kinyarwanda.",
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

          <section className="space-y-6 text-sm md:text-base text-muted-foreground">
            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
                Discussion topics
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Tips for learning and teaching KSL.</li>
                <li>Feedback and suggestions for improving the KSL AI platform.</li>
                <li>Sharing real-life stories from the deaf community.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
                Coming soon
              </h2>
              <p>
                In a future release, this page can be connected to a real forum system where
                users sign in, post questions, and interact in real time.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;

