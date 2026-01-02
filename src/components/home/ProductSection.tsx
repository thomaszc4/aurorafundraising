import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Package } from "lucide-react";

const benefits = {
  organization: [
    "High perceived value, leading to better sales",
    "Demonstrates commitment to community safety",
    "Generous profit margins (up to 50%)",
    "Simple to manage and distribute",
  ],
  community: [
    "Essential tool for emergency preparedness",
    "Encourages outdoor activities and camping",
    "Durable, long-lasting product",
    "Highly functional and practical",
  ],
};

export function ProductSection() {
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Product Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/30 via-secondary/30 to-accent/30 rounded-full blur-3xl animate-pulse" />

              {/* Product Card */}
              <div className="relative glass-card rounded-3xl p-8 h-full flex flex-col justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <img
                    src="/images/quickstove.png"
                    alt="QuickStove Emergency Kit"
                    className="w-full h-full object-contain drop-shadow-2xl animate-float"
                  />
                </div>

                <div className="relative z-10 mt-auto">
                  <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold mb-4 w-fit border border-secondary/20 backdrop-blur-md">
                    Flagship Product
                  </span>
                  <h3 className="text-3xl font-bold text-foreground mb-4 drop-shadow-md">The QuickStove</h3>
                  <p className="text-muted-foreground mb-8 text-lg bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    A multi-functional, portable stove designed for emergency preparedness, camping,
                    and outdoor cooking. The perfect product that families actually want and need.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 px-4 py-3 rounded-2xl bg-primary-blue/10 border border-primary-blue/20 backdrop-blur-md">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margin</span>
                      <div className="text-3xl font-bold text-primary-blue">50%</div>
                    </div>
                    <div className="flex-1 px-4 py-3 rounded-2xl bg-secondary/10 border border-secondary/20 backdrop-blur-md">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Satisfaction</span>
                      <div className="text-3xl font-bold text-secondary">98%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <span className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-4 block">
              Our Product
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Products That{" "}
              <span className="text-gradient">Sell Themselves</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Unlike traditional fundraisers with low-value items, we offer products that provide
              real value to your supporters and their families.
            </p>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-8 mb-10">
              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-blue" />
                  For Your Organization
                </h4>
                <ul className="space-y-3">
                  {benefits.organization.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  For Your Community
                </h4>
                <ul className="space-y-3">
                  {benefits.community.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button variant="default" size="lg" asChild>
              <Link to="/resources">
                View Product Catalog
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
