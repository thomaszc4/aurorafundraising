import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
interface FundraiserComparison {
  name: string;
  avgPerStudent: number;
  color: string;
}
const FUNDRAISER_COMPARISONS: FundraiserComparison[] = [{
  name: 'Aurora Products',
  avgPerStudent: 150,
  color: 'bg-secondary'
}, {
  name: 'Donation-Only',
  avgPerStudent: 30,
  color: 'bg-muted-foreground/40'
}, {
  name: 'Cookie Dough',
  avgPerStudent: 20,
  color: 'bg-muted-foreground/30'
}, {
  name: 'Candy Bars',
  avgPerStudent: 15,
  color: 'bg-muted-foreground/20'
}];
export function FundraisingCalculator() {
  const [participants, setParticipants] = useState([50]);
  const auroraTotal = participants[0] * 150;
  const maxTotal = 500 * 150; // Max participants * Aurora avg

  return <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container-wide">
        <div className="text-center mb-12">
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Fundraising Calculator</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Adjust the slider to see your potential.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-secondary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-8">
              {/* Slider Section */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-foreground">Number of Participants</label>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
                    <span className="text-2xl font-bold text-secondary">{participants[0]}</span>
                    <span className="text-sm text-muted-foreground">students</span>
                  </div>
                </div>
                <Slider value={participants} onValueChange={setParticipants} min={10} max={500} step={5} className="py-4" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>10 students</span>
                  <span>500 students</span>
                </div>
              </div>

              {/* Comparison Bars */}
              <div className="space-y-4 mb-8">
                {FUNDRAISER_COMPARISONS.map(fundraiser => {
                const total = participants[0] * fundraiser.avgPerStudent;
                const percentage = total / maxTotal * 100;
                const isAurora = fundraiser.name === 'Aurora Products';
                return <div key={fundraiser.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isAurora ? 'text-secondary' : 'text-foreground'}`}>
                          {fundraiser.name}
                          {isAurora && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-secondary/20 text-secondary">
                              10x More
                            </span>}
                        </span>
                        <div className="flex items-center gap-1">
                          <DollarSign className={`w-4 h-4 ${isAurora ? 'text-secondary' : 'text-muted-foreground'}`} />
                          <span className={`text-lg font-bold ${isAurora ? 'text-secondary' : 'text-foreground'}`}>
                            {total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${fundraiser.color} rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3`} style={{
                      width: `${Math.max(percentage, 5)}%`
                    }}>
                          {isAurora && percentage > 20 && <span className="text-xs font-medium text-secondary-foreground">
                              ${fundraiser.avgPerStudent}/student
                            </span>}
                        </div>
                      </div>
                    </div>;
              })}
              </div>

              {/* Difference Highlight */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">With Aurora, you'd raise</p>
                    <p className="text-3xl md:text-4xl font-bold text-secondary">
                      ${(auroraTotal - participants[0] * 20).toLocaleString()} more
                    </p>
                    <p className="text-sm text-muted-foreground">than a traditional cookie dough fundraiser</p>
                  </div>
                  <Button variant="default" size="lg" asChild>
                    <Link to="/contact">
                      Start Your Campaign
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-foreground">$150</div>
                  <div className="text-sm text-muted-foreground">Avg per Student</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-foreground">40%</div>
                  <div className="text-sm text-muted-foreground">Profit Margin</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-foreground">10x</div>
                  <div className="text-sm text-muted-foreground">More Than Others</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
}