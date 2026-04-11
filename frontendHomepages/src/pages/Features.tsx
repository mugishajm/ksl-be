import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturesSection from "@/components/FeaturesSection";

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Features;
