import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, Send, CheckCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export function Support() {
    const { toast } = useToast();
    const { user } = useAuth();
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
            title: "Support Request Sent",
            description: "We'll get back to you within 24-48 hours."
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Support Center</h2>
                <p className="text-muted-foreground">
                    Need help with your fundraiser? We're here to assist you every step of the way.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Contact Form */}
                <div className="lg:col-span-2">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary-blue" />
                                Send us a Message
                            </CardTitle>
                            <CardDescription>
                                Fill out the form below and our team will respond to your registered email address.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isSubmitted ? (
                                <div className="py-12 text-center animate-fade-in">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Request Received!</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        Thanks for reaching out! We've received your message and will get back to you shortly at <strong>{user?.email}</strong>.
                                    </p>
                                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                                        Send Another Request
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            required
                                            placeholder="e.g., Question about orders, Technical issue, etc."
                                            className="bg-background/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            required
                                            rows={6}
                                            placeholder="Describe your issue or question in detail..."
                                            className="bg-background/50 resize-none"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                                        {isSubmitting ? "Sending..." : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit Request
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Info Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Email Support</h3>
                                    <a href="mailto:impactfulfundraising@gmail.com" className="text-sm text-primary hover:underline block break-all">
                                        impactfulfundraising@gmail.com
                                    </a>
                                    <span className="text-xs text-muted-foreground block mt-1">Response time: 24-48 hours</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Phone Support</h3>
                                    <a href="tel:+19073108288" className="text-sm text-primary hover:underline">
                                        (907) 310-8288
                                    </a>
                                    <span className="text-xs text-muted-foreground block mt-1">Mon-Fri, 9am - 5pm AKST</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">Response Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-start">
                                <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    We pride ourselves on quick responses. You can generally expect to hear back from our team within 24 hours during business days.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
