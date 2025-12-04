import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Heart, Users, Award, ShieldCheck, BarChart3 } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Complete Platform",
    description: "From product sales to donor management, everything you need in one place.",
  },
  {
    icon: Heart,
    title: "Community First",
    description: "Products that provide real value and profits that stay in your community.",
  },
  {
    icon: Users,
    title: "Student Success",
    description: "Individual tracking, leaderboards, and recognition to motivate participants.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Protected",
    description: "COPPA compliant with proper consent workflows for student participants.",
  },
];

const stats = [
  { number: "500+", label: "Organizations Served" },
  { number: "$2M+", label: "Funds Raised" },
  { number: "50%", label: "Average Profit Margin" },
  { number: "98%", label: "Satisfaction Rate" },
];

const capabilities = [
  "Product-based fundraising campaigns",
  "Individual student fundraiser pages",
  "Real-time leaderboards and progress tracking",
  "Walkathon/readathon/jogathon support",
  "Donor CRM with segmentation",
  "Email campaigns with personalization",
  "Email scheduling and automation",
  "Email analytics (opens, clicks)",
  "Donor recognition wall",
  "Marketing consent management",
  "A/B testing for emails",
  "COPPA compliant workflows",
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
              The Complete <span className="text-gradient-teal">Fundraising Platform</span>
            </h1>
            <p className="text-xl text-primary-foreground/70">
              Aurora Fundraising empowers schools and organizations with a complete 
              platform for product-based fundraising, donor engagement, and campaign management.
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
                We built Aurora Fundraising to solve the problems we saw with traditional 
                fundraisers: low profit margins, complex logistics, and products no one 
                actually wanted.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Our platform combines high-quality products with powerful technology—individual 
                student pages, real-time tracking, donor CRM, email automation, and analytics—so 
                you can run professional campaigns that actually raise money.
              </p>
              <p className="text-lg text-foreground font-medium">
                We believe fundraising should benefit everyone: your organization, your 
                participants, and your supporters.
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

      {/* Platform Capabilities */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Platform <span className="text-gradient-teal">Can Do</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed for modern fundraising.
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border p-8 md:p-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">{capability}</span>
                </div>
              ))}
            </div>
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
            Ready to see what our platform can do for your organization? 
            Schedule a free demo today.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/contact">
              Schedule Your Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default About;
