import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

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
  const [expandedCourses, setExpandedCourses] = useState({});

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'active' }),
  });

  const { data: allProgress = [], isLoading } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: allTopics = [] } = useQuery({
    queryKey: ['all-topics'],
    queryFn: () => base44.entities.CourseTopic.list('-created_date', 500),
  });

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const activeCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  const topicMap = {};
  allTopics.forEach(t => { topicMap[t.id] = t; });

  const progressByCourse = {};
  activeCourses.forEach(c => {
    progressByCourse[c.id] = allProgress.filter(p => p.course_id === c.id).sort((a, b) => b.day_number - a.day_number);
  });

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const totalProgress = allProgress.length;
  const courseWithData = activeCourses.find(c => progressByCourse[c.id].length > 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    );
  }

  if (totalProgress === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-heading font-bold">Learning Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Your complete learning history</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No progress entries yet. Start by submitting your first daily progress.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Learning Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">Your complete learning history across {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {activeCourses.map(course => {
          const courseProgress = progressByCourse[course.id] || [];
          const isExpanded = expandedCourses[course.id] ?? true;

          if (courseProgress.length === 0) return null;

          return (
            <Card key={course.id}>
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition"
                onClick={() => toggleCourse(course.id)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{course.name}</h3>
                  <p className="text-xs text-muted-foreground">{courseProgress.length} entries</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isExpanded && (
                <div className="overflow-x-auto border-t">
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
                      {courseProgress.map(p => {
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
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}