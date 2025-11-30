import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Heart, Users, Award } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Community Impact",
    description: "Every fundraiser we support creates lasting value for organizations and the families they serve.",
  },
  {
    icon: Heart,
    title: "Integrity First",
    description: "We believe in honest partnerships, transparent pricing, and products that deliver real value.",
  },
  {
    icon: Users,
    title: "Partnership Approach",
    description: "We're not just a vendor—we're your partner in achieving your fundraising goals.",
  },
  {
    icon: Award,
    title: "Quality Products",
    description: "We only offer products we'd be proud to sell to our own families and communities.",
  },
];

const stats = [
  { number: "500+", label: "Organizations Served" },
  { number: "$2M+", label: "Funds Raised" },
  { number: "50%", label: "Average Profit Margin" },
  { number: "98%", label: "Satisfaction Rate" },
];

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-primary-blue/20 rounded-full blur-3xl animate-float" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 text-secondary text-sm font-medium mb-6">
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
              Empowering Communities Through <span className="text-gradient-teal">Better Fundraising</span>
            </h1>
            <p className="text-xl text-primary-foreground/70">
              Aurora Fundraising was founded on a simple belief: fundraising should benefit 
              everyone—the organization, the volunteers, and the supporters.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Our <span className="text-gradient">Mission</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                At Aurora Fundraising, our mission is to empower and benefit communities by 
                supplying fundraising organizations with products that offer value to both 
                the organization and the broader community.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                We believe a successful fundraiser should do more than just raise money; it 
                should provide a positive impact and a quality product that people genuinely 
                want and need.
              </p>
              <p className="text-lg text-muted-foreground">
                By partnering with Aurora, you're not just raising funds—you're investing in 
                your community's resilience and well-being.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-8 rounded-3xl bg-card border border-border/50 text-center"
                >
                  <div className="text-4xl font-bold text-primary-blue mb-2">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Problem with <span className="text-gradient-teal">Traditional Fundraisers</span>
            </h2>
          </div>

          <div className="bg-card rounded-3xl border border-border p-8 md:p-12">
            <p className="text-lg text-muted-foreground mb-6">
              Many traditional fundraisers rely on low-value items that offer minimal benefit 
              to the end-user and often result in waste. Cookie dough that expires, wrapping 
              paper that sits unused, trinkets that end up in drawers—these fundraisers leave 
              supporters feeling like they've just made a donation with nothing to show for it.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              We aim to revolutionize this process by offering high-quality, practical, and 
              community-focused products that provide long-term utility.
            </p>
            <p className="text-lg text-foreground font-medium">
              That's why we created Aurora Fundraising—to prove that you can raise more money 
              while providing real value to your supporters.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary-blue/20 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-6 mx-auto">
                  <value.icon className="w-7 h-7 text-primary-blue" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="container-tight relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Partner with Aurora
          </h2>
          <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
            Join us in making fundraising impactful again. Let's work together to support your 
            organization and community.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/contact">
              Start Your Campaign
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default About;
