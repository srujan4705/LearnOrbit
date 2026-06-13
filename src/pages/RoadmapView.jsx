import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { calculateCourseCurrentDay, getTopicForDay, isCourseStarted } from '@/lib/courseUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Play, ExternalLink, Map, Loader2, Lock, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

export default function RoadmapView() {
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const courseIds = enrollments.map(e => e.course_id);

  const { data: allCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'active' }),
  });

  const courses = allCourses.filter(c => courseIds.includes(c.id));

  const { data: allTopics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['all-topics-roadmap', courseIds],
    queryFn: () => base44.entities.CourseTopic.list('-created_date', 500),
    enabled: courseIds.length > 0,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['user-progress-roadmap', user?.id],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const completedTopicIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.topic_id));

  const topicsByCourse = {};
  allTopics.forEach(t => {
    if (courseIds.includes(t.course_id)) {
      topicsByCourse[t.course_id] = topicsByCourse[t.course_id] || [];
      topicsByCourse[t.course_id].push(t);
    }
  });

  const getCourseRoadmap = (course) => {
    const topics = topicsByCourse[course.id] || [];
    const courseCurrentDay = calculateCourseCurrentDay(course.start_date);
    const isStarted = isCourseStarted(course.start_date);
    const currentTopic = isStarted && courseCurrentDay > 0 ? getTopicForDay(topics, courseCurrentDay) : null;

    const sortedTopics = [...topics].sort((a, b) => {
      if (a.week_number !== b.week_number) return a.week_number - b.week_number;
      return a.day_number - b.day_number;
    });

    const weeks = {};
    sortedTopics.forEach(t => {
      if (!weeks[t.week_number]) weeks[t.week_number] = [];
      weeks[t.week_number].push(t);
    });

    return { weeks, currentTopic, currentDay: courseCurrentDay, isStarted };
  };

  if (courseIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Map className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">No Active Courses</h2>
        <p className="text-muted-foreground">Enroll in a course to see the roadmap.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Course Roadmaps</h1>
        <p className="text-muted-foreground text-sm mt-1">{courses.length} active course{courses.length !== 1 ? 's' : ''}</p>
      </div>

      {topicsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-8">
          {courses.map(course => {
            const { weeks, currentTopic, currentDay, isStarted } = getCourseRoadmap(course);
            const sortedWeeks = Object.entries(weeks).sort((a, b) => Number(a[0]) - Number(b[0]));

            return (
              <div key={course.id} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{course.name}</h2>
                  {!isStarted ? (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Starts on {format(new Date(course.start_date), 'MMMM d, yyyy')}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Week {Math.ceil(currentDay / 7)} · Day {currentDay}
                    </p>
                  )}
                </div>

                {!isStarted && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      This course starts on {format(new Date(course.start_date), 'MMMM d, yyyy')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  {sortedWeeks.map(([weekNum, weekTopics]) => (
                    <Card key={weekNum}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Week {weekNum}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {weekTopics.map((topic) => {
                          const isCompleted = completedTopicIds.has(topic.id);
                          const isCurrent = currentTopic?.id === topic.id;
                          const isLocked = !isStarted;

                          return (
                            <div
                              key={topic.id}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                isLocked ? 'opacity-50 cursor-not-allowed' :
                                isCurrent ? 'bg-primary/5 border border-primary/20' :
                                isCompleted ? 'bg-accent/5' : 'hover:bg-muted/50'
                              }`}
                            >
                              {isLocked ? (
                                <Lock className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                              ) : isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                              ) : isCurrent ? (
                                <Play className="w-5 h-5 text-primary shrink-0 fill-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                  isLocked ? 'text-muted-foreground' :
                                  isCompleted ? 'text-accent' :
                                  isCurrent ? 'text-primary' : 'text-foreground/70'
                                }`}>
                                  Day {topic.day_number}: {topic.topic_name}
                                </p>
                                {topic.topic_description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{topic.topic_description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-xs">{topic.estimated_hours || 1}h</Badge>
                                {!isLocked && topic.resource_url && (
                                  <a href={topic.resource_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}