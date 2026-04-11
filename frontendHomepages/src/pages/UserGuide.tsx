import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const UserGuide = () => {
  const { language } = useLanguage();

  const content = {
    badge: {
      kinyarwanda: "Ibikoresho",
      english: "Resources",
      french: "Ressources",
    },
    title: {
      kinyarwanda: "Inyandiko y'Umukoresha",
      english: "User Guide",
      french: "Guide d'utilisation",
    },
    description: {
      kinyarwanda:
        "Menya uko watangira gukoresha KSL AI, uhereye ku gufungura kamera kugeza ku gusobanura ibimenyetso n'amajwi.",
      english:
        "Learn how to get started with KSL AI, from setting up your camera to exploring translations between Kinyarwanda Sign Language and spoken languages.",
      french:
        "Apprenez à démarrer avec KSL AI, de la configuration de votre caméra à l'exploration des traductions entre la langue des signes kinyarwanda et les langues parlées.",
    },
  } as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
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

          <section className="space-y-8 text-sm md:text-base text-muted-foreground">
            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
                Getting started
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Open the home page and allow camera access when prompted.</li>
                <li>Position yourself in front of the camera with good lighting.</li>
                <li>Use the demo section to try sign-to-text and text-to-sign workflows.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
                Best practices
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Keep your hands visible inside the camera frame.</li>
                <li>Use a plain background when possible for higher accuracy.</li>
                <li>Check your internet connection for the best real-time experience.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;

