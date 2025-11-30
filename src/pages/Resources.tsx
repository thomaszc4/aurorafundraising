import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, FileText, Video, BookOpen, HelpCircle } from "lucide-react";

const resources = [
  {
    icon: FileText,
    title: "Product Catalog",
    description: "Browse our complete lineup of fundraising products with pricing and specifications.",
    action: "Download PDF",
    type: "PDF Guide",
  },
  {
    icon: BookOpen,
    title: "Fundraising Guide",
    description: "Step-by-step instructions to run a successful campaign from start to finish.",
    action: "Download Guide",
    type: "PDF Guide",
  },
  {
    icon: FileText,
    title: "Order Forms",
    description: "Printable order forms for your team to collect orders in the field.",
    action: "Download Forms",
    type: "Printable",
  },
  {
    icon: Video,
    title: "Product Demo Video",
    description: "Watch our QuickStove in action to help your team demonstrate its features.",
    action: "Watch Video",
    type: "Video",
  },
  {
    icon: FileText,
    title: "Marketing Materials",
    description: "Flyers, posters, and social media graphics to promote your fundraiser.",
    action: "Download Kit",
    type: "Marketing",
  },
  {
    icon: HelpCircle,
    title: "FAQ Sheet",
    description: "Common questions and answers to help your volunteers address buyer concerns.",
    action: "Download FAQ",
    type: "PDF Guide",
  },
];

const tips = [
  {
    title: "Set Clear Goals",
    description: "Define how much you want to raise and share the goal with your team to motivate everyone.",
  },
  {
    title: "Start Early",
    description: "Give your team plenty of time to reach potential supporters. A 2-4 week campaign is ideal.",
  },
  {
    title: "Leverage Social Media",
    description: "Share your campaign online to reach friends, family, and community members beyond your immediate circle.",
  },
  {
    title: "Show the Product",
    description: "Let people see and touch the QuickStove. Demonstrations dramatically increase sales.",
  },
];

const Resources = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 text-secondary text-sm font-medium mb-6">
              Resources
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
              Everything You Need to <span className="text-gradient-teal">Succeed</span>
            </h1>
            <p className="text-xl text-primary-foreground/70">
              Access our complete library of tools, guides, and materials designed to 
              make your fundraiser a success.
            </p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => (
              <div
                key={resource.title}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary-blue/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center group-hover:bg-primary-blue/20 transition-colors">
                    <resource.icon className="w-7 h-7 text-primary-blue" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                    {resource.type}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{resource.title}</h3>
                <p className="text-muted-foreground mb-6">{resource.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4" />
                  {resource.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tips for a <span className="text-gradient">Successful Campaign</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Maximize your fundraising potential with these proven strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {tips.map((tip, index) => (
              <div key={tip.title} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{tip.title}</h3>
                  <p className="text-muted-foreground">{tip.description}</p>
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
            Need Additional Support?
          </h2>
          <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
            Our team is here to help you every step of the way.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/contact">
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Resources;
