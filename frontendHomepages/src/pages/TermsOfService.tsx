import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

const TermsOfService = () => {
  const { language } = useLanguage();

  const content = {
    kinyarwanda: {
      title: "Amategeko y'Imikoreshereze",
      lastUpdated: "Iheruka kuvugururwa: Werurwe 2026",
      intro:
        "Urakaza neza muri KSL Design Studio. Mugukoresha urubuga rwacu, wemeye gukurikiza amategeko n'amabwiriza akurikira.",
      sections: [
        {
          heading: "1. Kwemerera Serivisi",
          body: "Mugukoresha uru rubuga n'ibicuruzwa byacu, wemeye ko wakoze amasezerano byemewe n'amategeko n'ikoranabuhanga ryacu. Niba utemeranya n'aya mategeko, ntugomba gukoresha serivisi zacu.",
        },
        {
          heading: "2. Gukoresha Urubuga",
          body: "Uwemerewe gusa gukoresha serivisi zacu kubintu byemewe n'amategeko. Ntibyemewe gukoresha urubuga rwacu mukwirukana ihohoterwa cyangwa guhungabanya umutekano w'abandi.",
        },
        {
          heading: "3. Uburenganzira bw'Umutungo Mu by'Ubwenge",
          body: "Ibiri kurubuga byose harimo inyandiko, amashusho, n'ibirango, ni umutungo wa KSL Design Studio kandi birinzwe n'amategeko.",
        },
        {
          heading: "4. Ubwishingizi n'Inshingano",
          body: "Ntitwishingira dore ko inyigisho n'ubuhinduzi butangwa na sisitemu bwaba buzira amakemwa cyangwa bwuzuye 100%. Imikoreshereze y'ibidukomokaho ni ku bwishingizi bwawe.",
        },
        {
          heading: "5. Twandikire",
          body: "Niba ufite ibibazo kuri aya mategeko, twandikire kuri mugishajm46@gmail.com.",
        },
      ],
    },
    english: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: March 2026",
      intro:
        "Welcome to KSL Design Studio. By accessing or using our website and services, you agree to be bound by these Terms of Service.",
      sections: [
        {
          heading: "1. Acceptance of Terms",
          body: "By using our platform, you signify your agreement to these terms. If you do not agree to all of these terms, you must not use our services.",
        },
        {
          heading: "2. Use of Service",
          body: "You may only use our services for lawful purposes. It is strictly prohibited to use our platform to distribute hate speech, malware, or otherwise compromise the security of other users.",
        },
        {
          heading: "3. Intellectual Property Rights",
          body: "All content on this website, including texts, graphics, and logos, is the property of KSL Design Studio and is protected by applicable laws.",
        },
        {
          heading: "4. Limitation of Liability",
          body: "We do not guarantee that translations or gesture recognitions provided by the AI system will be 100% accurate. Your use of the service is at your own risk.",
        },
        {
          heading: "5. Contact Us",
          body: "If you have questions about these Terms of Service, please contact us at mugishajm46@gmail.com.",
        },
      ],
    },
    french: {
      title: "Conditions d'Utilisation",
      lastUpdated: "Dernière mise à jour : Mars 2026",
      intro:
        "Bienvenue sur KSL Design Studio. En accédant à notre site ou en l'utilisant, vous acceptez d'être lié par ces conditions d'utilisation.",
      sections: [
        {
          heading: "1. Acceptation des conditions",
          body: "En utilisant notre plateforme, vous signifiez votre accord à ces conditions. Si vous n'acceptez pas l'ensemble de ces conditions, vous ne devez pas utiliser nos services.",
        },
        {
          heading: "2. Utilisation du service",
          body: "Vous ne pouvez utiliser nos services que pour des finalités légales. Il est formellement interdit d'utiliser notre plateforme pour distribuer des messages haineux ou compromettre la sécurité.",
        },
        {
          heading: "3. Propriété intellectuelle",
          body: "Tout le contenu de ce site web, y compris les textes, graphiques et logos, est la propriété de KSL Design Studio et est protégé par les lois applicables.",
        },
        {
          heading: "4. Limitation de responsabilité",
          body: "Nous ne garantissons pas que les traductions ou la reconnaissance des gestes fournies par le système d'IA seront exactes à 100 %. Votre utilisation du service est à vos propres risques.",
        },
        {
          heading: "5. Contactez-nous",
          body: "Si vous avez des questions sur ces conditions d'utilisation, veuillez nous contacter à mugishajm46@gmail.com.",
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

export default TermsOfService;
