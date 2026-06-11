import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/dashboard/StatCard';
import { Users, BookOpen, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['all-progress'],
    queryFn: () => base44.entities.UserProgress.list('-created_date', 500),
  });

  const { data: _enrollments = [] } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
  });

  const activeCourses = courses.filter(c => c.status === 'active');
  const today = new Date().toISOString().split('T')[0];
  const completedToday = allProgress.filter(p => p.submission_date === today && p.status === 'completed');
  const hardTopics = allProgress.filter(p => p.difficulty === 'hard');
  const totalCompleted = allProgress.filter(p => p.status === 'completed').length;
  const avgCompletion = allProgress.length > 0 ? Math.round((totalCompleted / allProgress.length) * 100) : 0;

  // Difficulty distribution
  const difficultyData = [
    { name: 'Easy', value: allProgress.filter(p => p.difficulty === 'easy').length },
    { name: 'Medium', value: allProgress.filter(p => p.difficulty === 'medium').length },
    { name: 'Hard', value: allProgress.filter(p => p.difficulty === 'hard').length },
  ].filter(d => d.value > 0);

  const COLORS = ['hsl(168, 76%, 42%)', 'hsl(43, 96%, 56%)', 'hsl(0, 84%, 60%)'];

  // Daily submissions chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dailyData = last7Days.map(date => ({
    date: date.slice(5),
    submissions: allProgress.filter(p => p.submission_date === date).length,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of platform activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} icon={Users} color="primary" />
        <StatCard title="Active Courses" value={activeCourses.length} icon={BookOpen} color="accent" />
        <StatCard title="Completed Today" value={completedToday.length} icon={CheckCircle2} color="accent" />
        <StatCard title="Avg. Completion" value={`${avgCompletion}%`} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Submissions (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center justify-center">
              {difficultyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {difficultyData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Most Difficult Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hardTopics.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hard topics reported yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                hardTopics.reduce((acc, p) => {
                  acc[p.topic_id] = (acc[p.topic_id] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([topicId, count]) => (
                  <Badge key={topicId} variant="destructive" className="text-xs">
                    Topic #{topicId.slice(-4)} × {count}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
