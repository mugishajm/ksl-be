import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import kslLogo from "@/assets/ksl-logo.png";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

function parseJsonOrNull(response: Response): Promise<Record<string, unknown> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return Promise.resolve(null);
  return response.json().catch(() => null);
}

const LoginForm = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await parseJsonOrNull(response);

      if (!response.ok) {
        const message =
          (data && typeof data.message === "string")
            ? data.message
            : response.status === 404
              ? "Service unavailable. Please check that the server is running."
              : "Failed to log in. Please check your credentials.";
        setError(message);
        return;
      }

      if (data && typeof data.token === "string") {
        localStorage.setItem("ksl_token", data.token);
      }
      if (data && data.user && typeof data.user === "object") {
        localStorage.setItem("ksl_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("ksl-user-update"));
      }

      const userData = data?.user as { role?: string; profileCompleted?: boolean } | undefined;
      const role = userData?.role ?? "user";
      const profileCompleted = userData?.profileCompleted ?? false;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (!profileCompleted) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
      return;
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (signupPassword !== signupPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: signupFirstName,
          lastName: signupLastName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await parseJsonOrNull(response);

      if (!response.ok) {
        const message =
          (data && typeof data.message === "string")
            ? data.message
            : response.status === 404
              ? "Service unavailable. Please check that the server is running."
              : "Failed to create account. Please try again.";
        setError(message);
        return;
      }

      if (data && typeof data.token === "string") {
        localStorage.setItem("ksl_token", data.token);
      }
      if (data && data.user && typeof data.user === "object") {
        localStorage.setItem("ksl_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("ksl-user-update"));
      }

      const userData = data?.user as { role?: string; profileCompleted?: boolean } | undefined;
      const role = userData?.role ?? "user";
      const profileCompleted = userData?.profileCompleted ?? false;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (!profileCompleted) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
      return;
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-blue-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-subtle"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-cyan-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-subtle animation-delay-400"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 sm:w-80 sm:h-80 bg-indigo-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-subtle animation-delay-600"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 p-6 sm:p-8">
          {/* KSL Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative animate-float">
              <img 
                src={kslLogo} 
                alt="KSL Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-lg"
              />
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {language === "kinyarwanda"
                ? "Injira kuri konti yawe"
                : language === "french"
                ? "Accédez à votre compte"
                : "Welcome Back"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              {language === "kinyarwanda"
                ? "Injira kugira ngo uhatange"
                : language === "french"
                ? "Connectez-vous pour commencer"
                : "Sign in to continue"}
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 bg-slate-700/50 p-1 rounded-xl">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 text-gray-300 text-xs sm:text-sm py-2 px-3 sm:px-4"
              >
                {language === "kinyarwanda"
                  ? "Injira"
                  : language === "french"
                  ? "Connexion"
                  : "Sign In"}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 text-gray-300 text-xs sm:text-sm py-2 px-3 sm:px-4"
              >
                {language === "kinyarwanda"
                  ? "Fungura konti"
                  : language === "french"
                  ? "Créer un compte"
                  : "Sign Up"}
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert className="mb-4 rounded-xl border-2 border-red-500 bg-red-500/20 backdrop-blur-sm shadow-lg shadow-red-500/25">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <AlertTitle className="text-sm font-semibold text-red-300">
                  {language === "kinyarwanda"
                    ? "Ikosa"
                    : language === "french"
                    ? "Erreur"
                    : "Error"}
                </AlertTitle>
                <AlertDescription className="mt-1 text-sm text-red-200 font-medium">{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mb-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-700 shadow-sm dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {language === "kinyarwanda"
                    ? "Byagenze neza"
                    : language === "french"
                    ? "Succès"
                    : "Success"}
                </AlertTitle>
                <AlertDescription className="mt-1 text-sm">{successMessage}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="mt-4">
              <form className="space-y-3 sm:space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-200" htmlFor="login-email">
                    {language === "kinyarwanda"
                      ? "Imeli"
                      : language === "french"
                      ? "E-mail"
                      : "Email"}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-200" htmlFor="login-password">
                    {language === "kinyarwanda"
                      ? "Ijambobanga"
                      : language === "french"
                      ? "Mot de passe"
                      : "Password"}
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      required
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400 pr-12"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-gray-400">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-xs">
                      {language === "kinyarwanda"
                        ? "Unyibuke kuri iyi mudasobwa"
                        : language === "french"
                        ? "Se souvenir de moi"
                        : "Remember me"}
                    </span>
                  </label>
                  <button type="button" className="text-emerald-400 hover:text-emerald-300 font-medium text-xs">
                    {language === "kinyarwanda"
                      ? "Wibagiwe ijambobanga?"
                      : language === "french"
                      ? "Mot de passe oublié ?"
                      : "Forgot password?"}
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base" 
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? language === "kinyarwanda"
                      ? "Kwinjira..."
                      : language === "french"
                      ? "Connexion..."
                      : "Signing in..."
                    : language === "kinyarwanda"
                      ? "Injira"
                      : language === "french"
                      ? "Connexion"
                      : "Sign In"}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  {language === "kinyarwanda"
                    ? "Ntufite konti?"
                    : language === "french"
                    ? "Vous n'avez pas de compte ?"
                    : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline text-xs"
                    onClick={() => {
                      const signupTab = document.querySelector<HTMLButtonElement>(
                        '[data-state][data-value="signup"]',
                      );
                      signupTab?.click();
                    }}
                  >
                    {language === "kinyarwanda"
                      ? "Fungura konti"
                      : language === "french"
                      ? "Créer un compte"
                      : "Sign up"}
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form className="space-y-3 sm:space-y-4" onSubmit={handleSignup}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-200" htmlFor="signup-first-name">
                      {language === "kinyarwanda"
                        ? "Izina ry'Itangwa"
                        : language === "french"
                        ? "Prénom"
                        : "First name"}
                    </label>
                    <input
                      id="signup-first-name"
                      type="text"
                      required
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400"
                      placeholder="Aline"
                      value={signupFirstName}
                      onChange={(event) => setSignupFirstName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-200" htmlFor="signup-last-name">
                      {language === "kinyarwanda"
                        ? "Izina ry'Umuryango"
                        : language === "french"
                        ? "Nom"
                        : "Last name"}
                    </label>
                    <input
                      id="signup-last-name"
                      type="text"
                      required
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400"
                      placeholder="Uwase"
                      value={signupLastName}
                      onChange={(event) => setSignupLastName(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-200" htmlFor="signup-email">
                    {language === "kinyarwanda"
                      ? "Imeli"
                      : language === "french"
                      ? "E-mail"
                      : "Email"}
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-200" htmlFor="signup-password">
                    {language === "kinyarwanda"
                      ? "Ijambobanga"
                      : language === "french"
                      ? "Mot de passe"
                      : "Password"}
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      required
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400 pr-12"
                      placeholder="Create a strong password"
                      value={signupPassword}
                      onChange={(event) => setSignupPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-xs sm:text-sm font-medium text-gray-200"
                    htmlFor="signup-password-confirm"
                  >
                    {language === "kinyarwanda"
                      ? "Emeza ijambobanga"
                      : language === "french"
                      ? "Confirmez le mot de passe"
                      : "Confirm password"}
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password-confirm"
                      type={showSignupPasswordConfirm ? "text" : "password"}
                      required
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none ring-offset-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all duration-200 placeholder-gray-400 pr-12"
                      placeholder="Repeat your password"
                      value={signupPasswordConfirm}
                      onChange={(event) => setSignupPasswordConfirm(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      onClick={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
                    >
                      {showSignupPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500" />
                  <span className="leading-relaxed">
                    {language === "kinyarwanda"
                      ? "Nemeye "
                      : language === "french"
                      ? "J'accepte les "
                      : "I agree to the "}
                    <a href="#" className="text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline">
                      {language === "kinyarwanda"
                        ? "Amategeko y'Imikoreshereze"
                        : language === "french"
                        ? "Conditions d'utilisation"
                        : "Terms of Service"}
                    </a>{" "}
                    {language === "kinyarwanda"
                      ? " n'"
                      : language === "french"
                      ? " et la "
                      : "and "}
                    <a href="#" className="text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline">
                      {language === "kinyarwanda"
                        ? "Politiki y'Ibanga"
                        : language === "french"
                        ? "Politique de confidentialité"
                        : "Privacy Policy"}
                    </a>
                    .
                  </span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base" 
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? language === "kinyarwanda"
                      ? "Gufungura konti..."
                      : language === "french"
                      ? "Création du compte..."
                      : "Creating account..."
                    : language === "kinyarwanda"
                      ? "Fungura konti"
                      : language === "french"
                      ? "Créer un compte"
                      : "Create account"}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  {language === "kinyarwanda"
                    ? "Usanganywe konti?"
                    : language === "french"
                    ? "Vous avez déjà un compte ?"
                    : "Already have an account?"}{" "}
                  <Link
                    to="/auth"
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline text-xs"
                  >
                    {language === "kinyarwanda"
                      ? "Injira"
                      : language === "french"
                      ? "Connexion"
                      : "Log in"}
                  </Link>
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-xs text-gray-400">
            <Link to="/" className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline">
              ←{" "}
              {language === "kinyarwanda"
                ? "Subira ku rupapuro rw'itangiriro"
                : language === "french"
                ? "Retour à l'accueil"
                : "Back to home"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
