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
        answer: "Getting started is easy! Simply contact us through our contact form or give us a call. We'll schedule a free consultation to discuss your organization's goals, timeline, and needs. From there, we'll customize a fundraising plan and send you everything you need to launch your campaign.",
      },
      {
        question: "Is there a minimum order or group size required?",
        answer: "We work with organizations of all sizes. While there's no strict minimum, we recommend having at least 10-15 active participants to maximize your fundraising potential. During your consultation, we'll help you determine the best approach for your group's size.",
      },
      {
        question: "How long does a typical fundraiser last?",
        answer: "Most successful campaigns run for 2-4 weeks. This gives your team enough time to reach supporters without losing momentum. We'll help you choose the optimal timeline based on your goals and any events or deadlines you're working around.",
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
        question: "How are products priced?",
        answer: "Our products are competitively priced to provide excellent value to supporters while ensuring strong profit margins for your organization. Supporters appreciate that they're getting a quality, useful product—not overpriced items they don't need.",
      },
    ],
  },
  {
    category: "Orders & Delivery",
    questions: [
      {
        question: "How do we collect and submit orders?",
        answer: "We provide both paper order forms and digital ordering options. Your team collects orders and payments, then submits the consolidated order to us. We make the process simple with clear instructions and support along the way.",
      },
      {
        question: "How long does delivery take?",
        answer: "Once you submit your final order, products typically arrive within 2-3 weeks. We handle all packaging and logistics, delivering directly to your organization for easy distribution.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept checks and electronic payments. For supporter payments, your team can collect cash, checks, or use digital payment options. We'll discuss the best approach during your consultation.",
      },
    ],
  },
  {
    category: "Support & Resources",
    questions: [
      {
        question: "What support do you provide during the campaign?",
        answer: "Our team is with you every step of the way. You'll have a dedicated contact for questions, access to our resource library, and ongoing support throughout your campaign. We're invested in your success.",
      },
      {
        question: "Do you provide marketing materials?",
        answer: "Yes! We provide product samples, order forms, flyers, posters, social media graphics, and demonstration videos. Everything you need to promote your fundraiser is included in your starter kit.",
      },
      {
        question: "Can I request a product sample before committing?",
        answer: "Absolutely! We encourage organizations to see our products firsthand. During your consultation, we can arrange for samples so you can experience the quality before launching your campaign.",
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
              Find answers to common questions about Aurora Fundraising, our products, 
              and the fundraising process.
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
                    className="border border-border/50 rounded-2xl px-6 data-[state=open]:border-primary-blue/30 data-[state=open]:shadow-lg transition-all"
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
            Our team is happy to answer any additional questions and help you get started 
            with your fundraiser.
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
