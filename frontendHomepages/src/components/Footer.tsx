import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import kslLogo from "@/assets/ksl-logo.png";
import { useLanguage } from "@/context/LanguageContext";

const Footer = () => {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { key: "home", to: "/" },
    { key: "features", to: "/features" },
    { key: "howItWorks", to: "/how-it-works" },
    { key: "demo", to: "/translate" },
    { key: "about", to: "/about" },
  ] as const;

  const quickLinkLabels: Record<(typeof quickLinks)[number]["key"], { kinyarwanda: string; english: string; french: string }> =
  {
    home: {
      kinyarwanda: "Ahabanza",
      english: "Home",
      french: "Accueil",
    },
    features: {
      kinyarwanda: "Ibiranga",
      english: "Features",
      french: "Fonctionnalités",
    },
    howItWorks: {
      kinyarwanda: "Uko Bikora",
      english: "How It Works",
      french: "Comment ça marche",
    },
    demo: {
      kinyarwanda: "Igerageza",
      english: "Demo",
      french: "Démo",
    },
    about: {
      kinyarwanda: "Ibyerekeye",
      english: "About",
      french: "À propos",
    },
  };

  const resources = [
    { key: "userGuide", href: "/user-guide" },
    { key: "gestureLibrary", href: "/gesture-library" },
    { key: "apiDocs", href: "/api-docs" },
    { key: "communityForum", href: "/community-forum" },
  ] as const;

  const resourceLabels: Record<(typeof resources)[number]["key"], { kinyarwanda: string; english: string; french: string }> =
  {
    userGuide: {
      kinyarwanda: "Inyandiko y'Umukoresha",
      english: "User Guide",
      french: "Guide d'utilisation",
    },
    gestureLibrary: {
      kinyarwanda: "Ibitabo by'Ibimenyetso",
      english: "Gesture Library",
      french: "Bibliothèque de gestes",
    },
    apiDocs: {
      kinyarwanda: "Inyandiko za API",
      english: "API Documentation",
      french: "Documentation API",
    },
    communityForum: {
      kinyarwanda: "Urubuga rw'Umuryango",
      english: "Community Forum",
      french: "Forum communautaire",
    },
  };

  const sectionTitles = {
    quickLinks: {
      kinyarwanda: "Inzira zihuse",
      english: "Quick Links",
      french: "Liens rapides",
    },
    resources: {
      kinyarwanda: "Ibikoresho",
      english: "Resources",
      french: "Ressources",
    },
    contactUs: {
      kinyarwanda: "Twandikire",
      english: "Contact Us",
      french: "Contactez-nous",
    },
    tagline: {
      kinyarwanda:
        "Umusemuzi ukoresha ubwenge bw'ikoranabuhanga uhuza abafite ubumuga bwo kutumva no kutavuga ndetse nabavuga bakanumva.",
      english:
        "AI-powered Kinyarwanda Sign Language interpreter bridging communication between deaf and hearing communities.",
      french:
        "Interprète en langue des signes kinyarwanda, propulsé par l'IA, reliant les communautés sourdes et entendantes.",
    },
    privacy: {
      kinyarwanda: "Politiki y'Ibanga",
      english: "Privacy Policy",
      french: "Politique de confidentialité",
    },
    terms: {
      kinyarwanda: "Amategeko y'Imikoreshereze",
      english: "Terms of Service",
      french: "Conditions d'utilisation",
    },
    copyrightPrefix: {
      kinyarwanda: "Uburenganzira bwose burabitswe.",
      english: "All rights reserved.",
      french: "Tous droits réservés.",
    },
  } as const;

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://www.twitter.com", label: "Twitter" },
    { icon: Instagram, href: "https://www.instagram.com", label: "Instagram" },
    { icon: Youtube, href: "https://www.youtube.com", label: "YouTube" },
  ];

  return (
    <footer className="bg-card border-t border-border text-foreground mt-12 md:mt-20">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src={kslLogo} alt="KSL Logo" className="h-12 w-auto bg-white rounded-md p-1" />
              <span className="font-display font-bold text-xl">
                <span className="text-ksl-blue">K</span>
                <span className="text-ksl-yellow">S</span>
                <span className="text-ksl-dark dark:text-white">L</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {sectionTitles.tagline[language]}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">
              {sectionTitles.quickLinks[language]}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {quickLinkLabels[link.key][language]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div id="resources">
            <h4 className="font-display font-semibold text-lg mb-6">
              {sectionTitles.resources[language]}
            </h4>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {resourceLabels[link.key][language]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">
              {sectionTitles.contactUs[language]}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Kigali, Rwanda</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-primary shrink-0" />
                <a
                  href="mailto:mugishajm46@gmail.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  mugishajm46@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-primary shrink-0" />
                <a
                  href="tel:+250786634530"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  +250 786 634 530
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">
              © {currentYear} KSL - Kinyarwanda Sign Language.{" "}
              {sectionTitles.copyrightPrefix[language]}
            </p>
            <div className="flex gap-6">
              <Link
                to="/privacy-policy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {sectionTitles.privacy[language]}
              </Link>
              <Link
                to="/terms-of-service"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {sectionTitles.terms[language]}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
