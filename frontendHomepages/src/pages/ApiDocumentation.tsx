import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const ApiDocumentation = () => {
  const { language } = useLanguage();

  const content = {
    badge: {
      kinyarwanda: "Ibikoresho",
      english: "Resources",
      french: "Ressources",
    },
    title: {
      kinyarwanda: "Inyandiko za API",
      english: "API Documentation",
      french: "Documentation API",
    },
    description: {
      kinyarwanda:
        "Incamake rusange y'uko abakora porogaramu bashobora guhuza ubushobozi bwa KSL AI n'inyongera zabo.",
      english:
        "High-level overview of how developers can integrate KSL AI capabilities into their own applications.",
      french:
        "Vue d'ensemble de la façon dont les développeurs peuvent intégrer les capacités de KSL AI dans leurs propres applications.",
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
                Authentication
              </h2>
              <p>
                Use secure API keys or OAuth-based authentication to access the KSL AI
                endpoints. Each request should include a valid token in the authorization header.
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
                Core endpoints
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold text-foreground">/translate/gesture</span> – send
                  gesture data and receive text translation.
                </li>
                <li>
                  <span className="font-semibold text-foreground">/translate/text</span> – send
                  text and receive KSL gesture descriptors.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;

