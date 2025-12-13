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
      <section className="pt-32 pb-24 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-primary-blue/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full glass border border-white/10 text-secondary text-sm font-medium mb-6 animate-fade-in">
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
              The Complete <span className="text-gradient-teal">Fundraising Platform</span>
            </h1>
            <p className="text-xl text-primary-foreground/70 animate-slide-up animation-delay-100 max-w-2xl">
              Aurora Fundraising empowers schools and organizations with a complete
              platform for product-based fundraising, donor engagement, and campaign management.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding bg-background relative">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-1 h-20 bg-gradient-to-b from-primary-blue to-transparent" />
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Our <span className="text-gradient">Mission</span>
              </h2>
              <div className="prose prose-lg text-muted-foreground">
                <p className="text-lg leading-relaxed mb-6">
                  We built Aurora Fundraising to solve the problems we saw with traditional
                  fundraisers: low profit margins, complex logistics, and products no one
                  actually wanted.
                </p>
                <p className="text-lg leading-relaxed mb-6">
                  Our platform combines high-quality products with powerful technology—individual
                  student pages, real-time tracking, donor CRM, email automation, and analytics—so
                  you can run professional campaigns that actually raise money.
                </p>
                <p className="text-lg text-foreground font-medium border-l-4 border-secondary pl-4 bg-secondary/5 py-2 rounded-r-lg">
                  We believe fundraising should benefit everyone: your organization, your
                  participants, and your supporters.
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 to-secondary/5 rounded-3xl blur-2xl -z-10" />
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="p-8 rounded-3xl glass-card border border-border/50 text-center hover:scale-105 transition-transform duration-300 shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-blue to-secondary mb-2">{stat.number}</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="section-padding bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="container-wide relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Platform <span className="text-gradient-teal">Can Do</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed for modern fundraising.
            </p>
          </div>

          <div className="glass-card rounded-3xl border border-white/20 p-8 md:p-12 shadow-xl backdrop-blur-xl bg-white/40">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/50 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-foreground font-medium">{capability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-background relative">
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
            {values.map((value, index) => (
              <div
                key={value.title}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary-blue/20 hover:shadow-2xl transition-all duration-500 text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-6 mx-auto group-hover:bg-primary-blue group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-glow-blue group-hover:scale-110">
                    <value.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary-blue transition-colors">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="container-tight relative z-10 text-center">
          <div className="max-w-3xl mx-auto glass p-12 rounded-3xl border border-white/10 shadow-glow">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Partner with Aurora
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              Ready to see what our platform can do for your organization?
              Schedule a free demo today.
            </p>
            <Button variant="hero" size="xl" asChild className="h-14 px-10 text-lg shadow-lg shadow-secondary/20 hover:shadow-secondary/40">
              <Link to="/contact">
                Schedule Your Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
