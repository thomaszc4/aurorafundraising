import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
    {
        name: "Sarah Jenkins",
        role: "PTA President",
        school: "Lincoln Elementary",
        image: "/images/avatar-1.png", // Placeholder
        quote: "We switched to Aurora and raised $24,000 in just two weeks. The products actually sell themselves, and the parents loved that we didn't have to sort anything.",
        rating: 5
    },
    {
        name: "Principal Michael Ross",
        role: "Principal",
        school: "Westview High",
        image: "/images/avatar-2.png", // Placeholder
        quote: "Finally, a fundraiser that doesn't feel like a burden. The dashboard made it easy to track every dollar, and the emergency kits aligned perfectly with our safety initiatives.",
        rating: 5
    },
    {
        name: "Coach David Miller",
        role: "Head Football Coach",
        school: "Oak Creek Athletics",
        image: "/images/avatar-3.png", // Placeholder
        quote: "Our team needed new uniforms fast. Aurora's setup was instant, and the players actually enjoyed sharing their pages. Best season producer we've ever had.",
        rating: 5
    }
];

export function TestimonialsSection() {
    return (
        <section className="section-padding bg-background relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

            <div className="container-wide relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-4 block">
                        Success Stories
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                        Trusted by <span className="text-gradient">Schools Everywhere</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Don't just take our word for it. See what administrators, parents, and coaches
                        are saying about their Aurora experience.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <CardContent className="p-8">
                                <div className="flex gap-1 mb-6 text-secondary">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-current" />
                                    ))}
                                </div>

                                <div className="relative mb-6">
                                    <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary-blue/10 rotate-180" />
                                    <p className="text-foreground/80 italic relative z-10 pl-4">
                                        "{testimonial.quote}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/50">
                                    <Avatar className="w-10 h-10 border border-border">
                                        <AvatarImage src={testimonial.image} alt={testimonial.name} />
                                        <AvatarFallback className="bg-primary-blue/10 text-primary-blue">
                                            {testimonial.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold text-sm text-foreground">{testimonial.name}</h4>
                                        <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.school}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Success Ticker/Stat */}
                <div className="mt-20 py-8 border-y border-border/50 bg-muted/10">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">
                        <div>
                            <div className="text-4xl font-bold text-foreground mb-1">500+</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Schools Partnered</div>
                        </div>
                        <div className="w-px h-12 bg-border hidden md:block" />
                        <div>
                            <div className="text-4xl font-bold text-primary-blue mb-1">$2.5M+</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Raised for Education</div>
                        </div>
                        <div className="w-px h-12 bg-border hidden md:block" />
                        <div>
                            <div className="text-4xl font-bold text-secondary mb-1">100%</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wide">Goal Satisfaction</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
