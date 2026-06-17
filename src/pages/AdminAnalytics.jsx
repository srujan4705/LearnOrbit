import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function AdminAnalytics() {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list('-created_date', 1000),
  });

  const { data: allProgress = [], isLoading } = useQuery({
    queryKey: ['all-progress'],
    queryFn: () => base44.entities.UserProgress.list('-submission_date', 5000),
  });

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const courseMap = {};
  courses.forEach(c => { courseMap[c.id] = c; });

  // Daily access analytics
  const dailyAccessByUser = {};
  const dailyAccessByDate = {};

  allProgress.forEach(p => {
    if (!p.submission_date) return;

    // By user
    if (!dailyAccessByUser[p.user_id]) {
      dailyAccessByUser[p.user_id] = {
        user: userMap[p.user_id],
        totalDays: 0,
        totalHours: 0,
        courses: {},
      };
    }
    dailyAccessByUser[p.user_id].totalDays += 1;
    dailyAccessByUser[p.user_id].totalHours += p.hours_studied || 0;

    if (!dailyAccessByUser[p.user_id].courses[p.course_id]) {
      dailyAccessByUser[p.user_id].courses[p.course_id] = {
        course: courseMap[p.course_id],
        days: 0,
        hours: 0,
      };
    }
    dailyAccessByUser[p.user_id].courses[p.course_id].days += 1;
    dailyAccessByUser[p.user_id].courses[p.course_id].hours += p.hours_studied || 0;

    // By date
    const dateStr = format(parseISO(p.submission_date), 'yyyy-MM-dd');
    if (!dailyAccessByDate[dateStr]) {
      dailyAccessByDate[dateStr] = {
        date: dateStr,
        users: new Set(),
        totalHours: 0,
        totalEntries: 0,
      };
    }
    dailyAccessByDate[dateStr].users.add(p.user_id);
    dailyAccessByDate[dateStr].totalHours += p.hours_studied || 0;
    dailyAccessByDate[dateStr].totalEntries += 1;
  });

  // Course-specific analytics
  const courseAnalytics = {};
  allProgress.forEach(p => {
    if (!courseAnalytics[p.course_id]) {
      courseAnalytics[p.course_id] = {
        course: courseMap[p.course_id],
        totalUsers: new Set(),
        totalHours: 0,
        totalSessions: 0,
        statusCounts: { not_started: 0, in_progress: 0, completed: 0 },
        users: {},
      };
    }
    courseAnalytics[p.course_id].totalUsers.add(p.user_id);
    courseAnalytics[p.course_id].totalHours += p.hours_studied || 0;
    courseAnalytics[p.course_id].totalSessions += 1;
    courseAnalytics[p.course_id].statusCounts[p.status] = (courseAnalytics[p.course_id].statusCounts[p.status] || 0) + 1;

    if (!courseAnalytics[p.course_id].users[p.user_id]) {
      courseAnalytics[p.course_id].users[p.user_id] = {
        user: userMap[p.user_id],
        hours: 0,
        days: 0,
      };
    }
    courseAnalytics[p.course_id].users[p.user_id].hours += p.hours_studied || 0;
    courseAnalytics[p.course_id].users[p.user_id].days += 1;
  });

  const sortedDates = Object.values(dailyAccessByDate).sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedUsers = Object.values(dailyAccessByUser).sort((a, b) => b.totalHours - a.totalHours);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedCourseAnalytics = selectedCourse ? courseAnalytics[selectedCourse] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Learning Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track user engagement and progress</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Activity</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(dailyAccessByUser).length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active users with progress</p>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Object.values(dailyAccessByUser).reduce((sum, u) => sum + u.totalHours, 0).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total learning hours</p>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sortedDates.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Days with activity</p>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{allProgress.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Progress entries recorded</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Activity Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card className="hover-lift animate-fade-in-up">
            <CardHeader>
              <CardTitle>Daily Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Active Users</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDates.slice(0, 30).map(day => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {format(parseISO(day.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{day.users.size}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {day.totalHours.toFixed(1)}h
                        </TableCell>
                        <TableCell>{day.totalEntries}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="hover-lift animate-fade-in-up">
            <CardHeader>
              <CardTitle>User Learning Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Active Days</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Courses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((userData, index) => (
                      <TableRow key={userData.user?.id}>
                        <TableCell className="font-medium">{userData.user?.full_name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{userData.user?.email}</TableCell>
                        <TableCell>{userData.totalDays}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {userData.totalHours.toFixed(1)}h
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {Object.values(userData.courses).map(courseData => (
                              <Badge key={courseData.course?.id} variant="secondary" className="text-xs">
                                {courseData.course?.name.split(' ')[0]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(courseAnalytics).map((courseData, index) => (
              <Card
                key={courseData.course?.id}
                className="cursor-pointer hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedCourse(courseData.course?.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{courseData.course?.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Enrolled Users</p>
                    <p className="text-2xl font-bold">{courseData.totalUsers.size}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{courseData.totalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Status Distribution</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Completed</span>
                        <span className="font-semibold text-accent">{courseData.statusCounts.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In Progress</span>
                        <span className="font-semibold text-amber-600">{courseData.statusCounts.in_progress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Not Started</span>
                        <span className="font-semibold text-muted-foreground">{courseData.statusCounts.not_started}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCourseAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCourseAnalytics.course?.name} - User Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Active Days</TableHead>
                        <TableHead>Total Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(selectedCourseAnalytics.users)
                        .sort((a, b) => b.hours - a.hours)
                        .map(userData => (
                          <TableRow key={userData.user?.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{userData.user?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{userData.user?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{userData.days}</TableCell>
                            <TableCell className="font-semibold text-primary">
                              {userData.hours.toFixed(1)}h
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
