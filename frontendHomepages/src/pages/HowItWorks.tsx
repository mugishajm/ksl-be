import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorksSection from "@/components/HowItWorksSection";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
