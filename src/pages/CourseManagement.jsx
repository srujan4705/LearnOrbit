import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, BookOpen, Calendar, Map, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const statusColors = {
  draft: 'bg-secondary text-secondary-foreground',
  active: 'bg-accent/10 text-accent border-accent/30',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-muted text-muted-foreground',
};

function CourseForm({ course, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: course?.name || '',
    description: course?.description || '',
    start_date: course?.start_date || '',
    end_date: course?.end_date || '',
    thumbnail_url: course?.thumbnail_url || '',
    status: course?.status || 'draft',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Course Name</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Thumbnail URL (optional)</Label>
        <Input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {course ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default function CourseManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
  });

  const handleSave = async (formData) => {
    if (editingCourse) {
      await base44.entities.Course.update(editingCourse.id, formData);
      toast({ title: 'Course updated' });
    } else {
      await base44.entities.Course.create(formData);
      toast({ title: 'Course created' });
    }
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    setDialogOpen(false);
    setEditingCourse(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    await base44.entities.Course.delete(id);
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    toast({ title: 'Course deleted' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your learning programs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingCourse(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Course</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
            </DialogHeader>
            <CourseForm
              course={editingCourse}
              onSave={handleSave}
              onCancel={() => { setDialogOpen(false); setEditingCourse(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No courses yet. Create your first course to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow overflow-hidden group">
              {course.thumbnail_url && (
                <div className="h-36 overflow-hidden">
                  <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-tight">{course.name}</h3>
                  <Badge variant="outline" className={statusColors[course.status]}>
                    {course.status}
                  </Badge>
                </div>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {course.start_date && format(new Date(course.start_date), 'MMM d, yyyy')}
                  {' → '}
                  {course.end_date && format(new Date(course.end_date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Link to={`/roadmap-builder/${course.id}`}>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <Map className="w-3.5 h-3.5" />Roadmap
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setEditingCourse(course); setDialogOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}