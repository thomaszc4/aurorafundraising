import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FundraisingCalculator } from "@/components/home/FundraisingCalculator";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ProductSection } from "@/components/home/ProductSection";
import { CTASection } from "@/components/home/CTASection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { Leaderboard } from "@/components/fundraising/Leaderboard";
import { DonorLeaderboard } from "@/components/fundraising/DonorLeaderboard";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FundraisingCalculator />
      <ProductSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />

      {/* Leaderboard Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[500px] bg-primary-blue/5 skew-y-3 -z-10" />
        <div className="container-wide">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-blue/10 text-primary-blue text-xs font-semibold mb-4">
              Live Rankings
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Top <span className="text-gradient-teal">Fundraisers</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Celebrating the students making the biggest impact in their communities right now
            </p>
          </div>
          <div className="max-w-4xl mx-auto glass-card p-6 rounded-3xl border border-secondary/20 shadow-xl">
            <Leaderboard limit={5} showTitle={false} />
          </div>
        </div>
      </section>

      {/* Donor Recognition Wall Section */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent" />
        <div className="container-wide relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-4">
              Community Support
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Donor Recognition Wall
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Thank you to our generous supporters who make it all possible
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <DonorLeaderboard limit={8} showTitle={false} variant="wall" />
          </div>
        </div>
      </section>

      <CTASection />
    </Layout>
  );
};

export default Index;
