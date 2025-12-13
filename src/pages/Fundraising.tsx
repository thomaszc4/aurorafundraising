import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Calendar, Package, DollarSign, Users, Award, Truck } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "1. Schedule Your Consultation",
    description: "Book a free call with our team to discuss your organization's goals, timeline, and fundraising needs. We'll customize a plan that works for you.",
  },
  {
    icon: Package,
    title: "2. Receive Your Kit",
    description: "We'll send you product samples, order forms, digital marketing materials, and everything you need to kick off your campaign.",
  },
  {
    icon: Users,
    title: "3. Mobilize Your Team",
    description: "Share materials with your volunteers. Our products are easy to demonstrate and sell—no expertise required.",
  },
  {
    icon: DollarSign,
    title: "4. Collect Orders",
    description: "Your team collects orders and payments. We provide both paper forms and digital ordering options.",
  },
  {
    icon: Truck,
    title: "5. We Handle Fulfillment",
    description: "Submit your orders to us, and we'll handle packaging and delivery directly to your organization.",
  },
  {
    icon: Award,
    title: "6. Celebrate Success",
    description: "Keep up to 50% profit on every sale. Celebrate your success while your community benefits from quality products.",
  },
];

const comparisons = [
  { traditional: "Low-value trinkets", aurora: "High-quality practical products" },
  { traditional: "10-30% profit margins", aurora: "Up to 50% profit margins" },
  { traditional: "Complex logistics", aurora: "We handle fulfillment" },
  { traditional: "Door-to-door pressure", aurora: "Products that sell themselves" },
  { traditional: "Wasteful items", aurora: "Durable, lasting value" },
];

const Fundraising = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="container-wide relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full glass border border-white/10 text-secondary text-sm font-medium mb-6 animate-fade-in">
              How It Works
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
              Fundraising Should Be <span className="text-gradient-teal">Easy</span>
            </h1>
            <p className="text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-100">
              We've eliminated the complexity of traditional fundraising. Follow our simple
              process and focus on what matters—your organization and community.
            </p>
            <Button variant="hero" size="lg" asChild className="h-14 px-8 text-lg animate-slide-up animation-delay-200 shadow-glow hover:shadow-glow-teal transition-all duration-300">
              <Link to="/contact">
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="section-padding bg-background relative">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Six Steps to <span className="text-gradient">Success</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our streamlined process makes fundraising straightforward and stress-free.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/20 to-transparent -translate-y-1/2 z-0" />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary-blue/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-6xl font-bold">{index + 1}</span>
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-blue/10 to-primary-blue/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <step.icon className="w-8 h-8 text-primary-blue" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary-blue transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="section-padding bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent" />

        <div className="container-tight relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Aurora Is <span className="text-gradient-teal">Different</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              See how we compare to traditional fundraising methods.
            </p>
          </div>

          <div className="glass-card rounded-3xl border border-white/20 overflow-hidden shadow-xl">
            <div className="grid grid-cols-2 bg-primary-blue/5 border-b border-border/50">
              <div className="p-8 text-center border-r border-border/50">
                <span className="font-bold text-lg text-muted-foreground">Traditional Fundraising</span>
              </div>
              <div className="p-8 text-center bg-primary-blue/5">
                <span className="font-bold text-lg text-primary-blue">Aurora Fundraising</span>
              </div>
            </div>
            {comparisons.map((row, index) => (
              <div key={index} className="grid grid-cols-2 border-b border-border/50 last:border-b-0 hover:bg-white/5 transition-colors">
                <div className="p-6 md:p-8 flex items-center gap-4 border-r border-border/50 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-sm bg-destructive" />
                  </div>
                  <span className="font-medium">{row.traditional}</span>
                </div>
                <div className="p-6 md:p-8 flex items-center gap-4 text-foreground bg-primary-blue/[0.02]">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="font-medium">{row.aurora}</span>
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
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              Schedule your free consultation and discover how easy fundraising can be.
            </p>
            <Button variant="hero" size="xl" asChild className="h-14 px-10 text-lg shadow-lg shadow-secondary/20 hover:shadow-secondary/40">
              <Link to="/contact">
                Schedule Consultation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Fundraising;
