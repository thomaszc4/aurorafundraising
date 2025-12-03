import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ProductSection } from "@/components/home/ProductSection";
import { CTASection } from "@/components/home/CTASection";
import { Leaderboard } from "@/components/fundraising/Leaderboard";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ProductSection />
      
      {/* Leaderboard Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Top Fundraisers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Celebrating the students making the biggest impact in their communities
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Leaderboard limit={5} showTitle={false} />
          </div>
        </div>
      </section>
      
      <CTASection />
    </Layout>
  );
};

export default Index;
