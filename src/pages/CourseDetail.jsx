import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { calculateUserCurrentDay } from '@/lib/courseUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: 'not_started',
    hours_studied: '',
    difficulty: '',
    remarks: '',
  });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Course.get(courseId),
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', user?.id, courseId],
    queryFn: () =>
      base44.entities.Enrollment.filter({
        user_id: user.id,
        course_id: courseId,
      }).then(data => data[0]),
    enabled: !!user?.id && !!courseId,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', courseId],
    queryFn: () => base44.entities.CourseTopic.filter({ course_id: courseId }),
    enabled: !!courseId,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress', user?.id, courseId],
    queryFn: () =>
      base44.entities.UserProgress.filter({
        user_id: user.id,
        course_id: courseId,
      }),
    enabled: !!user?.id && !!courseId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (data) => {
      const existingProgress = progress.find(p => p.topic_id === selectedTopic.id);
      if (existingProgress) {
        return base44.entities.UserProgress.update(existingProgress.id, {
          status: data.status,
          hours_studied: parseFloat(data.hours_studied) || 0,
          difficulty: data.difficulty || null,
          remarks: data.remarks,
          submission_date: format(new Date(), 'yyyy-MM-dd'),
        });
      } else {
        return base44.entities.UserProgress.create({
          user_id: user.id,
          course_id: courseId,
          topic_id: selectedTopic.id,
          week_number: selectedTopic.week_number,
          day_number: selectedTopic.day_number,
          status: data.status,
          hours_studied: parseFloat(data.hours_studied) || 0,
          difficulty: data.difficulty || null,
          remarks: data.remarks,
          submission_date: format(new Date(), 'yyyy-MM-dd'),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress', user?.id, courseId]);
      setDialogOpen(false);
      setFormData({ status: 'not_started', hours_studied: '', difficulty: '', remarks: '' });
      setSelectedTopic(null);
    },
  });

  const handleOpenDialog = (topic) => {
    setSelectedTopic(topic);
    const existing = progress.find(p => p.topic_id === topic.id);
    if (existing) {
      setFormData({
        status: existing.status,
        hours_studied: existing.hours_studied || '',
        difficulty: existing.difficulty || '',
        remarks: existing.remarks || '',
      });
    } else {
      setFormData({ status: 'not_started', hours_studied: '', difficulty: '', remarks: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmitProgress = (e) => {
    e.preventDefault();
    updateProgressMutation.mutate(formData);
  };

  const getTopicStatus = (topicId) => {
    const prog = progress.find(p => p.topic_id === topicId);
    return prog?.status || 'not_started';
  };

  if (courseLoading || !course) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You are not enrolled in this course.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const courseProgress = progress.filter(p => p.status === 'completed');
  const userCurrentDay = calculateUserCurrentDay(courseProgress);
  const sortedTopics = [...topics].sort((a, b) => {
    if (a.week_number !== b.week_number) return a.week_number - b.week_number;
    return a.day_number - b.day_number;
  });

  const weeks = {};
  sortedTopics.forEach(t => {
    if (!weeks[t.week_number]) weeks[t.week_number] = [];
    weeks[t.week_number].push(t);
  });

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const completion = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/my-courses')}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">{course.name}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <div className="flex items-center gap-4 mt-4">
          <div>
            <p className="text-sm font-medium">Your Progress</p>
            <p className="text-2xl font-bold text-primary">{completion}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Days Active</p>
            <p className="text-2xl font-bold text-primary">Day {userCurrentDay}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Completed</p>
            <p className="text-2xl font-bold text-accent">{completedCount}/{topics.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(weeks)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([weekNum, weekTopics], weekIndex) => (
            <Card key={weekNum} className="hover-lift animate-fade-in-up" style={{ animationDelay: `${weekIndex * 100}ms` }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Week {weekNum}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {weekTopics.map((topic) => {
                  const topicStatus = getTopicStatus(topic.id);
                  const isCompleted = topicStatus === 'completed';
                  const isInProgress = topicStatus === 'in_progress';

                  return (
                    <div
                      key={topic.id}
                      className={`flex items-center justify-between gap-3 p-4 rounded-lg border transition-colors ${
                        isCompleted
                          ? 'bg-accent/5 border-accent/30'
                          : isInProgress
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-muted/30 border-muted/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${
                            isCompleted ? 'text-accent' : 'text-foreground'
                          }`}>
                            Day {topic.day_number}: {topic.topic_name}
                          </p>
                          {topic.topic_description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {topic.topic_description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {topic.estimated_hours && (
                          <Badge variant="outline" className="text-xs">
                            {topic.estimated_hours}h
                          </Badge>
                        )}
                        {topicStatus !== 'not_started' && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isCompleted
                                ? 'bg-accent/10 text-accent border-accent/30'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            {topicStatus.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={isCompleted ? 'default' : 'outline'}
                          onClick={() => handleOpenDialog(topic)}
                        >
                          {isCompleted ? 'Update' : 'Add Progress'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Day {selectedTopic?.day_number}: {selectedTopic?.topic_name}
            </DialogTitle>
            <DialogDescription>
              Record your progress for this day
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitProgress} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Hours Studied</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.hours_studied}
                onChange={(e) => setFormData({ ...formData, hours_studied: e.target.value })}
                placeholder="e.g., 2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) =>
                setFormData({ ...formData, difficulty: value })
              }>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Add any notes or remarks"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProgressMutation.isPending}>
                {updateProgressMutation.isPending ? 'Saving...' : 'Save Progress'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
