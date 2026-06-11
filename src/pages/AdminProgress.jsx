import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProgress() {
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['all-progress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 1000),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
  });

  const { data: allTopics = [] } = useQuery({
    queryKey: ['all-topics'],
    queryFn: () => base44.entities.CourseTopic.list('-created_date', 500),
  });

  const courseMap = {};
  courses.forEach(c => { courseMap[c.id] = c; });

  const topicsByCourse = {};
  allTopics.forEach(t => {
    topicsByCourse[t.course_id] = (topicsByCourse[t.course_id] || 0) + 1;
  });

  // Build learner summary
  const learnerData = enrollments
    .filter(e => e.status === 'active')
    .map(enrollment => {
      const user = users.find(u => u.id === enrollment.user_id);
      const course = courseMap[enrollment.course_id];
      const userProgress = allProgress.filter(p => p.user_id === enrollment.user_id && p.course_id === enrollment.course_id);
      const completed = userProgress.filter(p => p.status === 'completed').length;
      const total = topicsByCourse[enrollment.course_id] || 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const lastEntry = userProgress.sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date))[0];
      const currentDay = userProgress.length > 0 ? Math.max(...userProgress.map(p => p.day_number || 0)) : 0;
      const currentWeek = userProgress.length > 0 ? Math.max(...userProgress.map(p => p.week_number || 0)) : 0;

      return {
        id: enrollment.id,
        userName: user?.full_name || user?.email || 'Unknown',
        courseName: course?.name || 'Unknown',
        completion: pct,
        completed,
        total,
        currentWeek,
        currentDay,
        lastActivity: lastEntry?.submission_date,
      };
    });

  const isLoading = loadingUsers;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Learner Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all learner activity across courses</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : learnerData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No learner data available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Learner</TableHead>
                  <TableHead className="text-xs">Course</TableHead>
                  <TableHead className="text-xs">Completion</TableHead>
                  <TableHead className="text-xs">Topics Done</TableHead>
                  <TableHead className="text-xs">Week</TableHead>
                  <TableHead className="text-xs">Day</TableHead>
                  <TableHead className="text-xs">Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learnerData.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-sm">{row.userName}</TableCell>
                    <TableCell className="text-sm">{row.courseName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={row.completion} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium">{row.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.completed}/{row.total}</TableCell>
                    <TableCell className="text-sm">W{row.currentWeek}</TableCell>
                    <TableCell className="text-sm">D{row.currentDay}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastActivity ? format(new Date(row.lastActivity), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}