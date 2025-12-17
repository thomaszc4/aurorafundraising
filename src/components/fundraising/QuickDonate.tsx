import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Gift, Coffee } from "lucide-react";

interface QuickDonateProps {
    onDonate: (amount: number) => void;
    isLoading?: boolean;
}

export function QuickDonate({ onDonate, isLoading = false }: QuickDonateProps) {
    const options = [
        { amount: 10, label: "Supporter", icon: Coffee, desc: "Buy a coffee size treat" },
        { amount: 25, label: "Booster", icon: Gift, desc: "Fund a small project" },
        { amount: 50, label: "Champion", icon: Heart, desc: "Make a big impact" },
        { amount: 100, label: "Hero", icon: Heart, desc: "Become a top donor" },
    ];

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
                    Quick Donate
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                {options.map((opt) => (
                    <Button
                        key={opt.amount}
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-all text-left items-start"
                        onClick={() => onDonate(opt.amount)}
                        disabled={isLoading}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-lg">${opt.amount}</span>
                            <opt.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground font-normal">{opt.label}</span>
                    </Button>
                ))}
                <Button
                    variant="ghost"
                    className="col-span-2 text-muted-foreground hover:text-primary"
                    onClick={() => {
                        const input = document.getElementById('custom-amount-input');
                        if (input) input.focus();
                    }}
                >
                    Choose custom amount
                </Button>
            </CardContent>
        </Card>
    );
}
