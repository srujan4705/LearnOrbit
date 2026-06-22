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

export default function TodayTask({ topics: topicsProp, course, currentDay: _currentDay, existingProgress: existingProgressProp, userId, onProgressSubmitted }) {
  // Support both singular topic and plural topics for backwards compatibility
  const topics = topicsProp || (topicsProp === undefined && existingProgressProp?.topic ? [topicsProp] : topicsProp) || [];
  const topic = topics[0]; // For header info
  
  // Get the first existing progress for initial state
  const firstExistingProgress = Array.isArray(existingProgressProp) ? existingProgressProp[0] : existingProgressProp;
  
  const [status, setStatus] = useState(firstExistingProgress?.status || 'not_started');
  const [hours, setHours] = useState(firstExistingProgress?.hours_studied?.toString() || '');
  const [difficulty, setDifficulty] = useState(firstExistingProgress?.difficulty || '');
  const [remarks, setRemarks] = useState(firstExistingProgress?.remarks || '');
  const [submitting, setSubmitting] = useState(false);

  if (!topics || topics.length === 0) {
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
    const hoursValue = parseFloat(hours) || 0;
    if (!status || !difficulty) {
      toast({ title: 'Please fill in status and difficulty', variant: 'destructive' });
      return;
    }
    if (hoursValue > 6) {
      toast({ title: 'Maximum 6 hours allowed per day', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Submit progress for all topics in the day
      for (const t of topics) {
        // Find existing progress for this specific topic
        let existingProgressForTopic;
        if (Array.isArray(existingProgressProp)) {
          existingProgressForTopic = existingProgressProp.find(p => p.topic_id === t.id);
        } else if (existingProgressProp?.topic_id === t.id) {
          existingProgressForTopic = existingProgressProp;
        }
        
        const data = {
          user_id: userId,
          course_id: course.id,
          topic_id: t.id,
          week_number: t.week_number,
          day_number: t.day_number,
          status,
          hours_studied: hoursValue,
          difficulty,
          remarks,
          submission_date: new Date().toISOString().split('T')[0],
        };

        if (existingProgressForTopic?.id) {
          await base44.entities.UserProgress.update(existingProgressForTopic.id, data);
        } else {
          await base44.entities.UserProgress.create(data);
        }
      }
      
      toast({ title: 'Progress submitted!', description: 'Keep up the great work.' });
      onProgressSubmitted?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit progress', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalEstimatedHours = topics.reduce((sum, t) => sum + (Number(t.estimated_hours) || 1), 0);

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Week {topic.week_number} · Day {topic.day_number}
            </p>
            <CardTitle className="text-xl mt-1">{topics.length === 1 ? topic.topic_name : `${topics.length} Topics Today`}</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {totalEstimatedHours.toFixed(1)}h estimated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {topics.map((t, index) => (
          <div key={t.id} className={index > 0 ? 'border-t pt-4' : ''}>
            <h4 className="font-medium text-sm mb-2">{t.topic_name}</h4>
            {t.topic_description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{t.topic_description}</p>
            )}
            {t.resource_url && (
              <a
                href={t.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Learning Resource
              </a>
            )}
          </div>
        ))}

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
                max="6"
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
            Submit Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
