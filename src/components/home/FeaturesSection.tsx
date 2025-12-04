import { Zap, Shield, Heart, TrendingUp, Package, Users, Mail, BarChart3, Calendar, Target } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Product-Based Campaigns",
    description: "High-quality products people actually want. Up to 50% profit on every sale with products that sell themselves.",
  },
  {
    icon: Users,
    title: "Student Fundraiser Pages",
    description: "Each participant gets their own personalized page to share with family and friends, tracking their individual progress.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Leaderboards",
    description: "Motivate participants with live progress tracking, fundraising leaderboards, and milestone celebrations.",
  },
  {
    icon: Mail,
    title: "Donor Management & CRM",
    description: "Track every donor, segment by behavior, and build lasting relationships with your supporters.",
  },
  {
    icon: Calendar,
    title: "Email Campaigns & Scheduling",
    description: "Send personalized thank-you notes, bulk emails with merge tags, and schedule campaigns for optimal engagement.",
  },
  {
    icon: Target,
    title: "Walkathon & Pledge Support",
    description: "Run -athon style fundraisers with per-unit pledges, flat donations, and automated progress tracking.",
  },
];

const additionalFeatures = [
  {
    icon: Zap,
    title: "Simple Setup",
    description: "Get your campaign running in minutes. We handle the logistics so you can focus on fundraising.",
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description: "Track email open rates, click rates, donation trends, and campaign performance in real-time.",
  },
  {
    icon: Shield,
    title: "COPPA Compliant",
    description: "Built with children's privacy in mind. Proper consent workflows and data protection for student participants.",
  },
  {
    icon: Heart,
    title: "Donor Recognition Wall",
    description: "Celebrate supporters with a public recognition wall, customizable display names, and privacy controls.",
  },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-4 block">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-gradient">Fundraise Successfully</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From product sales to donor engagement, our platform provides all the tools 
            to run professional fundraising campaigns.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-3xl bg-card hover:bg-card-elevated border border-border/50 hover:border-primary-blue/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-6 group-hover:bg-primary-blue/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary-blue" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-muted/30 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Plus More Built-In Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
