import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  calculateCurrentDay,
  getTopicForDay,
  getCompletionPercentage,
} from "@/lib/courseUtils";
import StatCard from "@/components/dashboard/StatCard";
import TodayTask from "@/components/dashboard/TodayTask";
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

  const enrolledCourseIds = enrollments.map((e) => e.course_id);
  const activeCourse = courses.find((c) => enrolledCourseIds.includes(c.id));

  const { data: topics = [] } = useQuery({
    queryKey: ["topics", activeCourse?.id],
    queryFn: () =>
      base44.entities.CourseTopic.filter({ course_id: activeCourse.id }),
    enabled: !!activeCourse?.id,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["user-progress", user?.id, activeCourse?.id],
    queryFn: () =>
      base44.entities.UserProgress.filter({
        user_id: user.id,
        course_id: activeCourse.id,
      }),
    enabled: !!user?.id && !!activeCourse?.id,
  });

  const currentDay = activeCourse
    ? calculateCurrentDay(activeCourse.start_date)
    : 0;
  const todayTopic = getTopicForDay(topics, currentDay);
  const completedCount = progress.filter(
    (p) => p.status === "completed",
  ).length;
  const totalHours = progress.reduce(
    (sum, p) => sum + Number(p.hours_studied || 0),
    0,
  );
  const completion = getCompletionPercentage(topics.length, completedCount);
  const todayProgress = todayTopic
    ? progress.find((p) => p.topic_id === todayTopic.id)
    : null;
  const currentWeek = Math.ceil(currentDay / 7);

  if (!activeCourse) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-heading font-bold mb-2">
          No Active Course
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
          {activeCourse.name} · Week {currentWeek} · Day {currentDay}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completion"
          value={`${completion}%`}
          icon={Target}
          color="primary"
        />
        <StatCard
          title="Topics Done"
          value={completedCount}
          icon={BookOpen}
          color="accent"
        />
        <StatCard
          title="Hours Studied"
          value={totalHours.toFixed(1)}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Current Day"
          value={currentDay}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodayTask
            topic={todayTopic}
            course={activeCourse}
            currentDay={currentDay}
            existingProgress={todayProgress}
            userId={user.id}
            onProgressSubmitted={() =>
              queryClient.invalidateQueries({ queryKey: ["user-progress"] })
            }
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">Course Progress</h3>
              <Progress value={completion} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completedCount} of {topics.length} topics completed
              </p>
            </CardContent>
          </Card>

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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
