import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I start a fundraiser with Aurora?",
        answer: "Getting started is easy! Contact us through our contact form or give us a call. We'll schedule a free consultation to discuss your organization's goals, timeline, and needs. From there, we'll set up your campaign dashboard with products, student pages, and all the tools you need.",
      },
      {
        question: "Is there a minimum order or group size required?",
        answer: "We work with organizations of all sizes. While there's no strict minimum, we recommend having at least 10-15 active participants to maximize your fundraising potential. Our platform scales to support campaigns of any size.",
      },
      {
        question: "How long does a typical fundraiser last?",
        answer: "Most successful campaigns run for 2-4 weeks. This gives your team enough time to reach supporters without losing momentum. Our platform's real-time tracking and leaderboards help maintain engagement throughout the campaign.",
      },
    ],
  },
  {
    category: "Platform Features",
    questions: [
      {
        question: "What features does the platform include?",
        answer: "Our platform includes: individual student fundraiser pages, real-time leaderboards, donor CRM with segmentation, email campaigns with merge tags, email scheduling and automation, open/click tracking analytics, donor recognition wall, A/B testing, walkathon/readathon support, and COPPA-compliant workflows.",
      },
      {
        question: "Can students have their own fundraiser pages?",
        answer: "Yes! Each participant gets a personalized fundraiser page with a unique link they can share with family and friends. Pages show individual progress toward goals and are managed through the admin dashboard.",
      },
      {
        question: "How does donor management work?",
        answer: "Our built-in CRM tracks every donor, automatically segments them (first-time, recurring, major, lapsed), and lets you send personalized communications. You can view donor history, manage marketing consent, and build lasting relationships.",
      },
      {
        question: "Can I send bulk emails to donors?",
        answer: "Absolutely! Our email system supports bulk sending with merge tags for personalization (name, donation amount, etc.), email scheduling for optimal send times, and analytics to track opens and clicks. We only email donors who have opted in to marketing.",
      },
    ],
  },
  {
    category: "Products & Pricing",
    questions: [
      {
        question: "What products do you offer?",
        answer: "Our flagship product is the QuickStove—a multi-functional, portable stove perfect for emergency preparedness, camping, and outdoor cooking. It's a product families genuinely want and need. We're always expanding our catalog, so contact us to learn about our full product lineup.",
      },
      {
        question: "What profit margin can we expect?",
        answer: "Organizations typically earn 40-50% profit on every sale. The exact margin depends on order volume, but even small groups can expect generous returns. We'll provide detailed pricing during your consultation.",
      },
      {
        question: "Do you support walkathons and pledge-based fundraisers?",
        answer: "Yes! Our platform supports -athon style fundraisers (walkathon, readathon, jogathon) with per-unit pledges and flat donations. Track participant progress, collect pledges, and automate follow-ups all in one place.",
      },
    ],
  },
  {
    category: "Privacy & Compliance",
    questions: [
      {
        question: "Is the platform COPPA compliant?",
        answer: "Yes. We take children's privacy seriously. Student accounts are created and managed by adult coordinators with parental consent. We don't collect personal information from children without proper consent, and we minimize data collection to what's necessary for participation.",
      },
      {
        question: "How do you handle marketing consent?",
        answer: "We only send marketing emails to donors who explicitly opt in during checkout. Every email includes an unsubscribe link, and donors can manage their preferences through our preference center. We track consent with timestamps and IP addresses for compliance.",
      },
      {
        question: "Is donor data secure?",
        answer: "We implement industry-standard security measures to protect all data. Donor information is only accessible to authorized campaign administrators, and we never sell or share personal information with third parties.",
      },
    ],
  },
  {
    category: "Support & Resources",
    questions: [
      {
        question: "What support do you provide during the campaign?",
        answer: "Our team is with you every step of the way. You'll have access to our resources library, dedicated support for questions, and ongoing assistance throughout your campaign. We're invested in your success.",
      },
      {
        question: "Do you provide marketing materials?",
        answer: "Yes! We provide product samples, order forms, flyers, posters, social media graphics, and demonstration videos. Our platform also lets you send branded email campaigns to supporters.",
      },
      {
        question: "Can I see a demo before committing?",
        answer: "Absolutely! We encourage organizations to see our platform in action. During your consultation, we'll walk you through the dashboard, show you sample student pages, and demonstrate the email and analytics features.",
      },
    ],
  },
];

const FAQ = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 text-secondary text-sm font-medium mb-6">
              FAQ
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
              Frequently Asked <span className="text-gradient-teal">Questions</span>
            </h1>
            <p className="text-xl text-primary-foreground/70">
              Find answers about our platform, products, donor management,
              and fundraising process.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-background">
        <div className="container-tight">
          {faqs.map((category) => (
            <div key={category.category} className="mb-12 last:mb-0">
              <h2 className="text-2xl font-bold text-foreground mb-6">{category.category}</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${category.category}-${index}`}
                    className="glass-card mb-4 border border-white/5 px-6 rounded-2xl transition-all duration-300 hover:border-primary-blue/30 data-[state=open]:border-primary-blue/50 data-[state=open]:shadow-lg"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-muted/50">
        <div className="container-tight text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Still Have Questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our team is happy to answer any additional questions and give you a
            personalized demo of our platform.
          </p>
          <Button variant="default" size="xl" asChild>
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

export default FAQ;
