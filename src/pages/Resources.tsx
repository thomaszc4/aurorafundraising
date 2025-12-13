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
      <section className="pt-32 pb-24 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full glass border border-white/10 text-secondary text-sm font-medium mb-6 animate-fade-in">
              Resources
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
              Everything You Need to <span className="text-gradient-teal">Succeed</span>
            </h1>
            <p className="text-xl text-primary-foreground/70 animate-slide-up animation-delay-100 mb-8 max-w-2xl">
              Access our complete library of tools, guides, and materials designed to
              make your fundraiser a success.
            </p>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="section-padding bg-background relative">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <div
                key={resource.title}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary-blue/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center group-hover:bg-primary-blue text-primary-blue group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-glow-blue">
                      <resource.icon className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium border border-secondary/10">
                      {resource.type}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary-blue transition-colors duration-300">
                    {resource.title}
                  </h3>
                  <p className="text-muted-foreground mb-8 flex-grow group-hover:text-foreground/80 transition-colors">
                    {resource.description}
                  </p>

                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary-blue group-hover:text-white group-hover:border-primary-blue transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <Download className="w-4 h-4 mr-2" />
                    {resource.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="section-padding bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-background via-muted/30 to-muted/30" />

        <div className="container-wide relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tips for a <span className="text-gradient">Successful Campaign</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Maximize your fundraising potential with these proven strategies.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {tips.map((tip, index) => (
                <div key={tip.title} className="flex gap-6 p-6 rounded-2xl bg-background/50 border border-border/50 hover:bg-background hover:shadow-lg transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-blue to-accent flex items-center justify-center text-white font-bold shadow-lg shadow-primary-blue/20">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{tip.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="container-tight relative z-10 text-center">
          <div className="max-w-3xl mx-auto glass p-12 rounded-3xl border border-white/10 shadow-glow">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Need Additional Support?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              Our team is here to help you every step of the way.
            </p>
            <Button variant="hero" size="xl" asChild className="h-14 px-10 text-lg shadow-lg shadow-secondary/20 hover:shadow-secondary/40">
              <Link to="/contact">
                Contact Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Resources;
