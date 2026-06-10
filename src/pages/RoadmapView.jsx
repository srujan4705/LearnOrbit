import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { calculateCurrentDay, getTopicForDay } from '@/lib/courseUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Play, ExternalLink, Map, Loader2 } from 'lucide-react';

export default function RoadmapView() {
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const activeCourseId = enrollments[0]?.course_id;

  const { data: course } = useQuery({
    queryKey: ['course', activeCourseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: activeCourseId });
      return courses[0];
    },
    enabled: !!activeCourseId,
  });

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics', activeCourseId],
    queryFn: () => base44.entities.CourseTopic.filter({ course_id: activeCourseId }),
    enabled: !!activeCourseId,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['user-progress', user?.id, activeCourseId],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id, course_id: activeCourseId }),
    enabled: !!user?.id && !!activeCourseId,
  });

  const completedTopicIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.topic_id));
  const currentDay = course ? calculateCurrentDay(course.start_date) : 0;

  const sortedTopics = [...topics].sort((a, b) => {
    if (a.week_number !== b.week_number) return a.week_number - b.week_number;
    return a.day_number - b.day_number;
  });

  // Find current topic
  const currentTopic = getTopicForDay(topics, currentDay);

  // Group by week
  const weeks = {};
  sortedTopics.forEach(t => {
    if (!weeks[t.week_number]) weeks[t.week_number] = [];
    weeks[t.week_number].push(t);
  });

  if (!activeCourseId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Map className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">No Active Course</h2>
        <p className="text-muted-foreground">Enroll in a course to see the roadmap.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Course Roadmap</h1>
        <p className="text-muted-foreground text-sm mt-1">{course?.name}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(weeks).map(([weekNum, weekTopics]) => (
            <Card key={weekNum}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Week {weekNum}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {weekTopics.map((topic) => {
                  const isCompleted = completedTopicIds.has(topic.id);
                  const isCurrent = currentTopic?.id === topic.id;

                  return (
                    <div
                      key={topic.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isCurrent ? 'bg-primary/5 border border-primary/20' :
                        isCompleted ? 'bg-accent/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      ) : isCurrent ? (
                        <Play className="w-5 h-5 text-primary shrink-0 fill-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-accent' : isCurrent ? 'text-primary' : 'text-foreground/70'}`}>
                          Day {topic.day_number}: {topic.topic_name}
                        </p>
                        {topic.topic_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{topic.topic_description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{topic.estimated_hours || 1}h</Badge>
                        {topic.resource_url && (
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
      )}
    </div>
  );
}