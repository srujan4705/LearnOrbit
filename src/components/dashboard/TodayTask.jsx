import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, BookOpen, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

export default function TodayTask({ topic, course, currentDay, existingProgress, userId, onProgressSubmitted }) {
  const [status, setStatus] = useState(existingProgress?.status || 'not_started');
  const [hours, setHours] = useState(existingProgress?.hours_studied?.toString() || '');
  const [difficulty, setDifficulty] = useState(existingProgress?.difficulty || '');
  const [remarks, setRemarks] = useState(existingProgress?.remarks || '');
  const [submitting, setSubmitting] = useState(false);

  if (!topic) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No task for today. Check your roadmap for upcoming topics.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!status || !difficulty) {
      toast({ title: 'Please fill in status and difficulty', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const data = {
      user_id: userId,
      course_id: course.id,
      topic_id: topic.id,
      week_number: topic.week_number,
      day_number: topic.day_number,
      status,
      hours_studied: parseFloat(hours) || 0,
      difficulty,
      remarks,
      submission_date: new Date().toISOString().split('T')[0],
    };

    if (existingProgress?.id) {
      await base44.entities.UserProgress.update(existingProgress.id, data);
    } else {
      await base44.entities.UserProgress.create(data);
    }
    toast({ title: 'Progress submitted!', description: 'Keep up the great work.' });
    setSubmitting(false);
    onProgressSubmitted?.();
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Week {topic.week_number} · Day {topic.day_number}
            </p>
            <CardTitle className="text-xl mt-1">{topic.topic_name}</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {topic.estimated_hours || 1}h estimated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {topic.topic_description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{topic.topic_description}</p>
        )}

        {topic.resource_url && (
          <a
            href={topic.resource_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open Learning Resource
          </a>
        )}

        <div className="border-t pt-5 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Submit Progress
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hours Studied</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Notes about today's learning..."
              className="h-20 resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {existingProgress?.id ? 'Update Progress' : 'Submit Progress'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}