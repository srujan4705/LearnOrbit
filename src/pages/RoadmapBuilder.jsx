import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

function TopicForm({ topic, onSave, onCancel }) {
  const [form, setForm] = useState({
    week_number: topic?.week_number || 1,
    day_number: topic?.day_number || 1,
    topic_name: topic?.topic_name || '',
    topic_description: topic?.topic_description || '',
    resource_url: topic?.resource_url || '',
    estimated_hours: topic?.estimated_hours || 1,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Week Number</Label>
          <Input type="number" min="1" value={form.week_number} onChange={e => setForm({ ...form, week_number: parseInt(e.target.value) || 1 })} />
        </div>
        <div className="space-y-1.5">
          <Label>Day Number</Label>
          <Input type="number" min="1" value={form.day_number} onChange={e => setForm({ ...form, day_number: parseInt(e.target.value) || 1 })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Topic Name</Label>
        <Input value={form.topic_name} onChange={e => setForm({ ...form, topic_name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.topic_description} onChange={e => setForm({ ...form, topic_description: e.target.value })} className="h-20" />
      </div>
      <div className="space-y-1.5">
        <Label>Resource URL</Label>
        <Input value={form.resource_url} onChange={e => setForm({ ...form, resource_url: e.target.value })} placeholder="https://..." />
      </div>
      <div className="space-y-1.5">
        <Label>Estimated Hours</Label>
        <Input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: parseFloat(e.target.value) || 1 })} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save Topic</Button>
      </div>
    </div>
  );
}

export default function RoadmapBuilder() {
  const courseIdFromUrl = window.location.pathname.split('/').pop();
  const courseId = courseIdFromUrl;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics', courseId],
    queryFn: () => base44.entities.CourseTopic.filter({ course_id: courseId }),
    enabled: !!courseId,
  });

  const sortedTopics = [...topics].sort((a, b) => {
    if (a.week_number !== b.week_number) return a.week_number - b.week_number;
    return a.day_number - b.day_number;
  });

  // Group by week
  const weeks = {};
  sortedTopics.forEach(t => {
    if (!weeks[t.week_number]) weeks[t.week_number] = [];
    weeks[t.week_number].push(t);
  });

  const handleSave = async (formData) => {
    const data = { ...formData, course_id: courseId };
    if (editingTopic) {
      await base44.entities.CourseTopic.update(editingTopic.id, data);
      toast({ title: 'Topic updated' });
    } else {
      await base44.entities.CourseTopic.create(data);
      toast({ title: 'Topic added' });
    }
    queryClient.invalidateQueries({ queryKey: ['topics', courseId] });
    setDialogOpen(false);
    setEditingTopic(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this topic?')) return;
    await base44.entities.CourseTopic.delete(id);
    queryClient.invalidateQueries({ queryKey: ['topics', courseId] });
    toast({ title: 'Topic deleted' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/courses">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">Roadmap Builder</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{course?.name || 'Loading...'}</p>
        </div>
        <Button onClick={() => { setEditingTopic(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Topic
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingTopic(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
          </DialogHeader>
          <TopicForm
            topic={editingTopic}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setEditingTopic(null); }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : Object.keys(weeks).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No topics yet. Start building your roadmap.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(weeks).map(([weekNum, weekTopics]) => (
            <Card key={weekNum}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Week {weekNum}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {weekTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      D{topic.day_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{topic.topic_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {topic.estimated_hours || 1}h · {topic.resource_url ? 'Has resource' : 'No resource'}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTopic(topic); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(topic.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
