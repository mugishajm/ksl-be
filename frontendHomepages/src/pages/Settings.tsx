import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

const Settings = () => {
  const { language } = useLanguage();
  const [hasUser, setHasUser] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    setHasUser(!!localStorage.getItem("ksl_user"));
  }, []);
  if (hasUser === false) return <Navigate to="/auth" replace />;
  if (hasUser === undefined) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {language === "kinyarwanda"
                ? "Subira ku rupapuro rw'itangiriro"
                : language === "french"
                ? "Retour à l'accueil"
                : "Back to home"}
            </Link>
          </Button>

          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="font-display text-2xl">
                  {language === "kinyarwanda"
                    ? "Igenamiterere"
                    : language === "french"
                    ? "Paramètres"
                    : "Settings"}
                </CardTitle>
              </div>
              <CardDescription>
                {language === "kinyarwanda"
                  ? "Tunganya konti yawe n'ibyo ukunda."
                  : language === "french"
                  ? "Gérez votre compte et vos préférences."
                  : "Manage your account and preferences."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {language === "kinyarwanda"
                  ? "Andi mahitamo (ibikujyanye no kukumenyesha, ururimi, ubuzima bwite) azaboneka hano vuba."
                  : language === "french"
                  ? "Plus d'options (notifications, langue, confidentialité) seront bientôt disponibles ici."
                  : "More options (notifications, language, privacy) will be available here soon."}
              </p>
              <Button asChild variant="outline">
                <Link to="/profile">
                  {language === "kinyarwanda"
                    ? "Reba umwirondoro"
                    : language === "french"
                    ? "Voir le profil"
                    : "View profile"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
