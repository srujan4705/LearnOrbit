import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const statusBadge = {
  not_started: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-accent/10 text-accent border-accent/30',
};

const difficultyBadge = {
  easy: 'bg-accent/10 text-accent',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-destructive/10 text-destructive',
};

export default function Tracker() {
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const activeCourseId = enrollments[0]?.course_id;

  const { data: progress = [], isLoading } = useQuery({
    queryKey: ['user-progress', user?.id, activeCourseId],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id, course_id: activeCourseId }),
    enabled: !!user?.id && !!activeCourseId,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', activeCourseId],
    queryFn: () => base44.entities.CourseTopic.filter({ course_id: activeCourseId }),
    enabled: !!activeCourseId,
  });

  const topicMap = {};
  topics.forEach(t => { topicMap[t.id] = t; });

  const sorted = [...progress].sort((a, b) => b.day_number - a.day_number);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Learning Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">Your complete learning history</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No progress entries yet. Start by submitting your first daily progress.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Week</TableHead>
                  <TableHead className="text-xs">Day</TableHead>
                  <TableHead className="text-xs">Topic</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Hours</TableHead>
                  <TableHead className="text-xs">Difficulty</TableHead>
                  <TableHead className="text-xs">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(p => {
                  const topic = topicMap[p.topic_id];
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm">
                        {p.submission_date ? format(new Date(p.submission_date), 'MMM d') : '-'}
                      </TableCell>
                      <TableCell className="text-sm">W{p.week_number}</TableCell>
                      <TableCell className="text-sm">D{p.day_number}</TableCell>
                      <TableCell className="text-sm font-medium">{topic?.topic_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusBadge[p.status]}`}>
                          {p.status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.hours_studied || 0}h</TableCell>
                      <TableCell>
                        {p.difficulty && (
                          <Badge variant="outline" className={`text-xs ${difficultyBadge[p.difficulty]}`}>
                            {p.difficulty}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {p.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}