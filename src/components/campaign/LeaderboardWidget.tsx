import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, User, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
    id: string;
    name: string;
    amount: number;
    avatar_url?: string;
    rank?: number;
}

interface LeaderboardWidgetProps {
    campaignId: string;
}

export function LeaderboardWidget({ campaignId }: LeaderboardWidgetProps) {
    const [students, setStudents] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('student_fundraisers')
                .select(`
          id,
          total_raised,
          profiles:student_id (
            full_name,
            avatar_url
          )
        `)
                .eq('campaign_id', campaignId)
                .order('total_raised', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching leaderboard:', error);
                return;
            }

            const formattedData: LeaderboardEntry[] = data.map((item: any, index: number) => ({
                id: item.id,
                name: item.profiles?.full_name || 'Anonymous Student',
                amount: item.total_raised || 0,
                avatar_url: item.profiles?.avatar_url,
                rank: index + 1
            }));

            setStudents(formattedData);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Subscribe to changes
        const channel = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_fundraisers',
                    filter: `campaign_id=eq.${campaignId}`
                },
                () => {
                    // On any change, re-fetch to ensure correct ordering
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400 fill-gray-400" />;
            case 3:
                return <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />;
            default:
                return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
        }
    };

    if (loading) {
        return (
            <Card className="border-none shadow-xl h-full">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-xl overflow-hidden h-full flex flex-col">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-600" />
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Leaderboard
                </CardTitle>
                <CardDescription>Top fundraising superstars</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <Tabs defaultValue="students" className="h-full">
                    <div className="px-6 pb-2">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="students" className="gap-2">
                                <User className="h-4 w-4" />
                                Students
                            </TabsTrigger>
                            <TabsTrigger value="classes" disabled className="gap-2 opacity-50 cursor-not-allowed" title="Coming Soon">
                                <Users className="h-4 w-4" />
                                Classes
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="students" className="mt-0 h-full">
                        {students.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No donations yet.</p>
                                <p className="text-sm">Be the first to get on the board!</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y">
                                    {students.map((student) => (
                                        <div
                                            key={student.id}
                                            className={cn(
                                                "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50",
                                                student.rank === 1 && "bg-yellow-500/5"
                                            )}
                                        >
                                            <div className="flex-shrink-0 flex items-center justify-center w-8">
                                                {getRankIcon(student.rank!)}
                                            </div>

                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                <AvatarImage src={student.avatar_url} />
                                                <AvatarFallback className={cn(
                                                    "font-bold",
                                                    student.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                        student.rank === 2 ? "bg-gray-100 text-gray-700" :
                                                            student.rank === 3 ? "bg-amber-100 text-amber-800" :
                                                                "bg-muted text-muted-foreground"
                                                )}>
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {student.name}
                                                </p>
                                                {student.rank! <= 3 && (
                                                    <p className="text-xs text-muted-foreground text-amber-600 font-medium">
                                                        Top Supporter
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <span className="font-bold tabular-nums text-foreground">
                                                    ${student.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </TabsContent>
                    <TabsContent value="classes">
                        <div className="flex items-center justify-center h-48 text-muted-foreground">
                            <p>Class leaderboards coming soon!</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
