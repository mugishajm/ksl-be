import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

const PrivacyPolicy = () => {
  const { language } = useLanguage();

  const content = {
    kinyarwanda: {
      title: "Politiki y'Ibanga",
      lastUpdated: "Iheruka kuvugururwa: Werurwe 2026",
      intro:
        "Muri KSL Design Studio, twubahiriza ubwigenge bwawe. Iyi politiki y'ibanga isobanura uko dukusanya, dukoresha, kandi turinda amakuru yawe mugihe ukoresha urubuga rwacu.",
      sections: [
        {
          heading: "1. Amakuru Dukusanya",
          body: "Dushobora gukusanya amakuru y'ibanze nka imeli yawe iyo wiyandikishije cg uduhamagaye. Ntitubika amashusho cg amajwi y'ibimenyetso byawe udapfuye kubitwemerera.",
        },
        {
          heading: "2. Uko Dukoresha Amakuru",
          body: "Amakuru yawe akoreshwa gusa mu kunoza serivisi zacu, kuguha ubufasha, cyangwa ku kumenyesha ibishya byerekeye urubuga rwacu.",
        },
        {
          heading: "3. Umutekano",
          body: "Dufata ingamba zikomeye kugirango amakuru yawe arindwe neza. Ntabwo dusangiza amakuru yawe abandi bantu nta ruhushya.",
        },
        {
          heading: "4. Twandikire",
          body: "Niba ufite ibibazo byerekeye iyi politiki y'ibanga, twandikire kuri mugishajm46@gmail.com.",
        },
      ],
    },
    english: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: March 2026",
      intro:
        "At KSL Design Studio, we respect your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website.",
      sections: [
        {
          heading: "1. Information We Collect",
          body: "We may collect basic information such as your email address when you register or contact us. We do not store any video or audio of your gestures unless explicitly permitted.",
        },
        {
          heading: "2. How We Use Your Information",
          body: "Your information is used solely to provide and improve our services, respond to your inquiries, and send you important updates regarding the platform.",
        },
        {
          heading: "3. Data Security",
          body: "We implement robust security measures to protect your personal data. We do not sell or share your personal information with third parties without your consent.",
        },
        {
          heading: "4. Contact Us",
          body: "If you have any questions or concerns about this Privacy Policy, please contact us at mugishajm46@gmail.com.",
        },
      ],
    },
    french: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour : Mars 2026",
      intro:
        "Chez KSL Design Studio, nous respectons votre vie privée. Cette politique de confidentialité explique comment nous recueillons, utilisons et protégeons vos informations.",
      sections: [
        {
          heading: "1. Informations que nous recueillons",
          body: "Nous pouvons recueillir des informations de base telles que votre adresse e-mail lorsque vous vous inscrivez ou nous contactez. Nous ne conservons pas de vidéos ou d'audios de vos gestes sans autorisation explicite.",
        },
        {
          heading: "2. Comment nous utilisons vos informations",
          body: "Vos informations sont utilisées uniquement pour fournir et améliorer nos services, répondre à vos demandes et vous informer des mises à jour importantes.",
        },
        {
          heading: "3. Sécurité des données",
          body: "Nous mettons en œuvre des mesures de sécurité robustes pour protéger vos données personnelles. Nous ne vendons ni ne partageons vos informations personnelles avec des tiers sans votre consentement.",
        },
        {
          heading: "4. Contactez-nous",
          body: "Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à mugishajm46@gmail.com.",
        },
      ],
    },
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 max-w-4xl">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {currentContent.title}
          </h1>
          <p className="text-muted-foreground mb-8 border-b border-border pb-6">
            {currentContent.lastUpdated}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed mb-8">{currentContent.intro}</p>

            <div className="space-y-8">
              {currentContent.sections.map((section, index) => (
                <section key={index}>
                  <h2 className="text-2xl font-semibold mb-4 text-primary">
                    {section.heading}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
