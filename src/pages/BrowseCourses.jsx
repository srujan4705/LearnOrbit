import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export default function BrowseCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses-active'],
    queryFn: () => base44.entities.Course.filter({ status: 'active' }),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const enrolledCourseIds = enrollments.map(e => e.course_id);

  const enroll = async (courseId) => {
    await base44.entities.Enrollment.create({
      user_id: user.id,
      course_id: courseId,
      enrolled_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    toast({ title: 'Enrolled successfully!', description: 'Head to your dashboard to start learning.' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Browse Courses</h1>
        <p className="text-muted-foreground text-sm mt-1">Find and join available learning programs</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No active courses available right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            return (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                {course.thumbnail_url ? (
                  <div className="h-40 overflow-hidden">
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/40" />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg leading-tight">{course.name}</h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {course.start_date && format(new Date(course.start_date), 'MMM d')} - {course.end_date && format(new Date(course.end_date), 'MMM d, yyyy')}
                  </div>
                  {isEnrolled ? (
                    <Button variant="outline" disabled className="w-full gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      Enrolled
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => enroll(course.id)}>
                      Enroll Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}