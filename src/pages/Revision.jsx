import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';

export default function Revision() {
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => base44.entities.Enrollment.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'active' }),
  });

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const activeCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  const { data: allProgress = [], isLoading } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: allTopics = [] } = useQuery({
    queryKey: ['all-topics'],
    queryFn: () => base44.entities.CourseTopic.list('-created_date', 500),
  });

  const topicMap = {};
  allTopics.forEach(t => { topicMap[t.id] = t; });

  const courseMap = {};
  activeCourses.forEach(c => { courseMap[c.id] = c; });

  // Get hard topics grouped by course
  const revisionByCourse = {};
  activeCourses.forEach(course => {
    const courseProgress = allProgress.filter(p => p.course_id === course.id);
    const hardEntries = courseProgress.filter(p => p.difficulty === 'hard');
    const topicCounts = {};
    hardEntries.forEach(p => {
      topicCounts[p.topic_id] = (topicCounts[p.topic_id] || 0) + 1;
    });
    revisionByCourse[course.id] = Object.entries(topicCounts).map(([topicId, count]) => ({
      topic: topicMap[topicId],
      count,
    })).filter(r => r.topic).sort((a, b) => b.count - a.count);
  });

  const totalRevisionTopics = Object.values(revisionByCourse).reduce((sum, topics) => sum + topics.length, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Revision Topics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Topics marked as difficult for weekly revision · {totalRevisionTopics} topic{totalRevisionTopics !== 1 ? 's' : ''} across {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : totalRevisionTopics === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No difficult topics yet. Great job!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeCourses.map(course => {
            const topics = revisionByCourse[course.id] || [];
            if (topics.length === 0) return null;

            return (
              <div key={course.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">{course.name}</h3>
                  <Badge variant="outline" className="text-xs">{topics.length}</Badge>
                </div>
                {topics.map(({ topic, count }) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-destructive/10 shrink-0">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{topic.topic_name}</h3>
                          <Badge variant="outline" className="text-xs bg-destructive/5 text-destructive border-destructive/20">
                            Reported {count}×
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Week {topic.week_number} · Day {topic.day_number}
                          {topic.estimated_hours && ` · ${topic.estimated_hours}h`}
                        </p>
                        {topic.topic_description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{topic.topic_description}</p>
                        )}
                      </div>
                      {topic.resource_url && (
                        <a
                          href={topic.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Resource
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}