import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { calculateCourseCurrentDay, getCompletionPercentage } from '@/lib/courseUtils';

export default function MyCourses() {
  const { user } = useAuth();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['my-progress', user?.id],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: allTopics = [] } = useQuery({
    queryKey: ['all-topics-user'],
    queryFn: () => base44.entities.CourseTopic.list('-created_date', 500),
  });

  const courseMap = {};
  courses.forEach(c => { courseMap[c.id] = c; });

  const topicsByCourse = {};
  allTopics.forEach(t => {
    topicsByCourse[t.course_id] = (topicsByCourse[t.course_id] || 0) + 1;
  });

  const enrolledCourses = enrollments.map(e => {
    const course = courseMap[e.course_id];
    if (!course) return null;
    const courseProgress = allProgress.filter(p => p.course_id === e.course_id);
    const completed = courseProgress.filter(p => p.status === 'completed').length;
    const total = topicsByCourse[e.course_id] || 0;
    const pct = getCompletionPercentage(total, completed);
    const day = calculateCourseCurrentDay(course.start_date);
    return { ...e, course, completion: pct, completed, total, currentDay: day };
  }).filter(Boolean);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">Your enrolled learning programs</p>
        </div>
        <Link to="/browse-courses">
          <Button variant="outline">Browse More</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : enrolledCourses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
            <Link to="/browse-courses"><Button>Browse Courses</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {enrolledCourses.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {item.course.thumbnail_url ? (
                <div className="h-32 overflow-hidden">
                  <img src={item.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary/30" />
                </div>
              )}
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{item.course.name}</h3>
                  <Badge variant="outline" className={item.status === 'active' ? 'border-accent/30 text-accent' : ''}>
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Day {item.currentDay} · {item.completed}/{item.total} topics
                </div>
                <div className="space-y-1.5">
                  <Progress value={item.completion} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{item.completion}% complete</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}