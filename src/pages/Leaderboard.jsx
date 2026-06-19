import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Flame, Loader2, Users } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function Leaderboard() {
  const { data: apiData, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.getLeaderboard(),
  });

  const leaderboardData = apiData?.leaderboardData || [];
  const currentUserRank = apiData?.currentUserRank;

  // Calculate current week dates for display
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Weekly Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Top learners this week · {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
          </p>
        </div>
        {currentUserRank && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Your Rank</p>
            <p className="text-2xl font-bold text-primary">#{currentUserRank}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : leaderboardData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No enrolled users yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top 3 spotlight */}
          {leaderboardData.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaderboardData.slice(0, 3).map((item, index) => (
                <Card key={item.id} className={`${index === 0 ? 'border-2 border-amber-400' : ''} hover-lift animate-fade-in-up`} style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      {index === 0 && <Trophy className="w-8 h-8 text-amber-500" />}
                      {index === 1 && <Trophy className="w-8 h-8 text-gray-400" />}
                      {index === 2 && <Trophy className="w-8 h-8 text-orange-600" />}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      #{index + 1}
                    </div>
                    <p className="font-semibold text-sm">{item.userName}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.courseName}</p>
                    <div className="flex items-center justify-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span className="text-lg font-bold text-red-500">
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Full leaderboard table */}
          <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Complete Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-12">Rank</TableHead>
                      <TableHead className="text-xs">Learner</TableHead>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs text-right">Hours</TableHead>
                      <TableHead className="text-xs text-right">Entries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.map((item, index) => (
                      <TableRow key={item.id} className={index === 0 ? 'bg-amber-50' : ''}>
                        <TableCell className="text-sm font-bold">
                          {index === 0 ? (
                            <Trophy className="w-4 h-4 text-amber-500" />
                          ) : (
                            `#${index + 1}`
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.userName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.courseName}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Flame className="w-3 h-3 mr-1" />
                            {item.hours.toFixed(1)}h
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {item.entries}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
