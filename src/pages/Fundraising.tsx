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
      <section className="pt-32 pb-20 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 text-secondary text-sm font-medium mb-6">
              How It Works
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
              Fundraising Should Be <span className="text-gradient-teal">Easy</span>
            </h1>
            <p className="text-xl text-primary-foreground/70 mb-8">
              We've eliminated the complexity of traditional fundraising. Follow our simple 
              process and focus on what matters—your organization and community.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">
                Get Started Today
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Six Steps to <span className="text-gradient">Success</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our streamlined process makes fundraising straightforward and stress-free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary-blue/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-primary-blue" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Aurora Is <span className="text-gradient-teal">Different</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              See how we compare to traditional fundraising methods.
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <div className="grid grid-cols-2 bg-primary-blue/5 border-b border-border">
              <div className="p-6 text-center border-r border-border">
                <span className="font-semibold text-muted-foreground">Traditional Fundraising</span>
              </div>
              <div className="p-6 text-center">
                <span className="font-semibold text-primary-blue">Aurora Fundraising</span>
              </div>
            </div>
            {comparisons.map((row, index) => (
              <div key={index} className="grid grid-cols-2 border-b border-border last:border-b-0">
                <div className="p-6 flex items-center gap-3 border-r border-border text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-destructive/50 flex-shrink-0" />
                  {row.traditional}
                </div>
                <div className="p-6 flex items-center gap-3 text-foreground">
                  <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                  {row.aurora}
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
            Schedule your free consultation and discover how easy fundraising can be.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/contact">
              Schedule Consultation
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Fundraising;
