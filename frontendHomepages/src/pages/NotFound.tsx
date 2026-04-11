import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const NotFound = () => {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {language === "kinyarwanda"
            ? "Eee! Ipaji ntabwo yabonetse"
            : language === "french"
            ? "Oups ! Page introuvable"
            : "Oops! Page not found"}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {language === "kinyarwanda"
            ? "Subira ku rupapuro rw'itangiriro"
            : language === "french"
            ? "Retour à l'accueil"
            : "Return to Home"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
