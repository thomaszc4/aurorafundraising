import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const Contact = () => {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24-48 hours."
    });
  };
  return <Layout>
    {/* Hero Section */}
    <section className="pt-32 pb-24 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-3xl animate-float animation-delay-200" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container-wide relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block px-4 py-2 rounded-full glass border border-white/10 text-secondary text-sm font-medium mb-6 animate-fade-in">
            Contact Us
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
            Let's Start Your <span className="text-gradient-teal">Fundraiser</span>
          </h1>
          <p className="text-xl text-primary-foreground/70 animate-slide-up animation-delay-100 max-w-2xl">
            Schedule a free consultation to discuss your fundraising goals and discover
            how Aurora can help you succeed.
          </p>
        </div>
      </div>
    </section>

    {/* Contact Section */}
    <section className="section-padding bg-background relative">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 to-transparent rounded-3xl -z-10" />
            <div className="p-8 md:p-10 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-8">Send Us a Message</h2>

              {isSubmitted ? <div className="py-20 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Message Sent!</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Thank you for reaching out. Our team will review your message and get back
                  to you within 24-48 hours.
                </p>
                <Button variant="outline" onClick={() => setIsSubmitted(false)} className="hover:bg-background hover:text-foreground">
                  Send Another Message
                </Button>
              </div> : <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="firstName" className="group-focus-within:text-primary-blue transition-colors">First Name *</Label>
                    <Input id="firstName" required placeholder="John" className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="lastName" className="group-focus-within:text-primary-blue transition-colors">Last Name *</Label>
                    <Input id="lastName" required placeholder="Doe" className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="email" className="group-focus-within:text-primary-blue transition-colors">Email Address *</Label>
                  <Input id="email" type="email" required placeholder="john@example.com" className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="phone" className="group-focus-within:text-primary-blue transition-colors">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="(123) 456-7890" className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="organization" className="group-focus-within:text-primary-blue transition-colors">Organization Name *</Label>
                  <Input id="organization" required placeholder="Lincoln Elementary PTA" className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="goal" className="group-focus-within:text-primary-blue transition-colors">Fundraising Goal</Label>
                  <Input id="goal" placeholder="e.g., $5,000" className="h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="message" className="group-focus-within:text-primary-blue transition-colors">Tell Us About Your Fundraiser *</Label>
                  <Textarea id="message" required rows={4} placeholder="Share your goals, timeline, and any questions you have..." className="rounded-xl resize-none bg-background/50 border-border/50 focus:border-primary-blue focus:ring-primary-blue/20 transition-all" />
                </div>

                <Button type="submit" size="lg" className="w-full h-12 text-lg shadow-lg shadow-primary-blue/20 hover:shadow-primary-blue/40 transition-all" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>}
                </Button>
              </form>}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="group flex gap-6 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary-blue/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-blue group-hover:text-white transition-all duration-300">
                    <Mail className="w-6 h-6 text-primary-blue group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Email Us</h3>
                    <p className="text-muted-foreground mb-2">For general inquiries and support</p>
                    <a href="mailto:impactfulfundraising@gmail.com" className="text-primary-blue font-medium hover:underline text-lg">
                      impactfulfundraising@gmail.com
                    </a>
                  </div>
                </div>

                <div className="group flex gap-6 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary-blue/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-blue group-hover:text-white transition-all duration-300">
                    <Phone className="w-6 h-6 text-primary-blue group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Call Us</h3>
                    <p className="text-muted-foreground mb-2">Mon-Fri from 9am to 5pm AKST</p>
                    <a href="tel:+19073108288" className="text-primary-blue font-medium hover:underline text-lg">
                      (907) 310-8288
                    </a>
                  </div>
                </div>

                <div className="group flex gap-6 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary-blue/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-blue group-hover:text-white transition-all duration-300">
                    <Clock className="w-6 h-6 text-primary-blue group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Response Time</h3>
                    <p className="text-muted-foreground">We pride ourselves on quick responses. You can expect to hear back from us within 24-48 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Teaser */}
            <div className="p-10 rounded-3xl bg-hero relative overflow-hidden text-center sm:text-left">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-primary-foreground mb-3">Have Questions?</h3>
                <p className="text-primary-foreground/80 mb-6 text-lg">
                  Check out our FAQ page for answers to common questions about our
                  fundraising process, products, and more.
                </p>
                <Button variant="hero" size="lg" asChild className="shadow-lg shadow-black/20">
                  <a href="/faq">View FAQ</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Layout>;
};
export default Contact;