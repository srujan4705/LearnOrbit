import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  calculateCourseCurrentDay,
  getTopicsForDay,
  getCompletionPercentage,
  isCourseStarted,
} from "@/lib/courseUtils";
import TodayTask from "@/components/dashboard/TodayTask";
import { GraduationCap, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

function CourseCard({ course, topics, progress, user, queryClient }) {
  const courseCurrentDay = calculateCourseCurrentDay(course.start_date);
  const isStarted = isCourseStarted(course.start_date);
  const todayTopics = isStarted && courseCurrentDay > 0 ? getTopicsForDay(topics, courseCurrentDay) : [];
  const completedCount = progress.filter(
    (p) => p.status === "completed",
  ).length;
  const totalHours = progress.reduce(
    (sum, p) => sum + Number(p.hours_studied || 0),
    0,
  );
  const completion = getCompletionPercentage(topics.length, completedCount);
  // Get all progress entries for today's topics
  const todayTopicIds = todayTopics.map(t => t.id);
  const todayProgress = progress.filter(p => todayTopicIds.includes(p.topic_id));
  const currentWeek = isStarted ? Math.ceil(courseCurrentDay / 7) : 0;

  return (
    <Card className="overflow-hidden hover-lift animate-fade-in-up">
      <CardContent className="p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-lg">{course.name}</h3>
          {!isStarted ? (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Starts on {format(new Date(course.start_date), 'MMM d, yyyy')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Week {currentWeek} · Day {courseCurrentDay}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Completion</div>
            <div className="text-xl font-bold text-primary">{completion}%</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Hours</div>
            <div className="text-xl font-bold text-accent">
              {totalHours.toFixed(1)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Topics Done</div>
            <div className="text-xl font-bold text-amber-600">
              {completedCount}/{topics.length}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Today</div>
            <div className="text-xl font-bold text-primary">
              {!isStarted ? "🚀" : todayTopics.length > 0 ? "📖" : "✓"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={completion} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedCount} of {topics.length} topics completed
          </p>
        </div>

        {isStarted && todayTopics.length > 0 ? (
          <TodayTask
            topics={todayTopics}
            course={course}
            currentDay={courseCurrentDay}
            existingProgress={todayProgress}
            userId={user.id}
            onProgressSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ["user-progress", user.id] });
            }}
          />
        ) : !isStarted ? (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              This course will start on {format(new Date(course.start_date), 'MMMM d, yyyy')}.
              Come back then to begin learning!
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () =>
      base44.entities.Enrollment.filter({ user_id: user.id, status: "active" }),
    enabled: !!user?.id,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.filter({ status: "active" }),
  });

  const { data: allTopics = [] } = useQuery({
    queryKey: ["all-topics"],
    queryFn: () => base44.entities.CourseTopic.list("-created_date", 500),
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: () => base44.entities.UserProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const enrolledCourseIds = enrollments.map((e) => e.course_id);
  const activeCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));

  const topicsByCourse = {};
  allTopics.forEach((t) => {
    topicsByCourse[t.course_id] = topicsByCourse[t.course_id] || [];
    topicsByCourse[t.course_id].push(t);
  });

  const progressByCourse = {};
  allProgress.forEach((p) => {
    progressByCourse[p.course_id] = progressByCourse[p.course_id] || [];
    progressByCourse[p.course_id].push(p);
  });

  const totalHoursAllCourses = allProgress.reduce(
    (sum, p) => sum + Number(p.hours_studied || 0),
    0,
  );

  if (activeCourses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">
          No Active Courses
        </h2>
        <p className="text-muted-foreground mb-6">
          Browse available courses and enroll to get started.
        </p>
        <Link to="/browse-courses">
          <Button>Browse Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeCourses.length} active
          {activeCourses.length === 1 ? " course" : " courses"} · {totalHoursAllCourses.toFixed(1)} total hours
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeCourses.map((course, index) => (
          <CourseCard
            key={course.id}
            course={course}
            topics={topicsByCourse[course.id] || []}
            progress={progressByCourse[course.id] || []}
            user={user}
            queryClient={queryClient}
            index={index}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-sm">Quick Links</h3>
          <div className="space-y-2">
            <Link
              to="/tracker"
              className="block text-sm text-primary hover:underline"
            >
              View Learning Tracker →
            </Link>
            <Link
              to="/roadmap"
              className="block text-sm text-primary hover:underline"
            >
              View Full Roadmap →
            </Link>
            <Link
              to="/revision"
              className="block text-sm text-primary hover:underline"
            >
              Revision Topics →
            </Link>
            <Link
              to="/leaderboard"
              className="block text-sm text-primary hover:underline"
            >
              Weekly Leaderboard →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
