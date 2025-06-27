import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X, Plus } from 'lucide-react';
import { Template } from '@/types/dashboard';

interface TemplatesManagerProps {
  templates: Template[];
  onUpdate: (templateId: string, content: string) => void;
  onCreate?: (template: Omit<Template, 'id'>) => void;
  onDelete?: (templateId: string) => void;
}

const TemplatesManager = ({ templates, onUpdate, onCreate, onDelete }: TemplatesManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    intent: '',
    title: '',
    content: '',
    tags: []
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(setTags)
      .catch(() => setTags([]));
  }, [isCreating]);

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: newTag.trim() })
    });
    setTags(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const handleEditStart = (template: Template) => {
    setEditingId(template.id);
    setEditContent(template.content);
  };

  const handleEditSave = () => {
    if (editingId && editContent.trim()) {
      onUpdate(editingId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleCreateStart = () => {
    setIsCreating(true);
    setNewTemplate({ intent: '', title: '', content: '', tags: [] });
  };

  const handleCreateSave = () => {
    if (newTemplate.intent.trim() && newTemplate.title.trim() && newTemplate.content.trim() && onCreate) {
      onCreate({ ...newTemplate, tags: [] });
      setIsCreating(false);
      setNewTemplate({ intent: '', title: '', content: '', tags: [] });
    }
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewTemplate({ intent: '', title: '', content: '', tags: [] });
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      cold_lead: 'bg-blue-100 text-blue-800',
      VIP: 'bg-purple-100 text-purple-800',
      question: 'bg-green-100 text-green-800',
      complaint: 'bg-red-100 text-red-800',
      sales_inquiry: 'bg-orange-100 text-orange-800',
      pricing: 'bg-yellow-100 text-yellow-800',
      greeting: 'bg-indigo-100 text-indigo-800',
      general: 'bg-gray-100 text-gray-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[intent] || colors.unknown;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
        <Button
          onClick={handleCreateStart}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Create New Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intent/Tag</label>
                <div className="flex space-x-2">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={newTemplate.intent}
                    onChange={e => setNewTemplate({ ...newTemplate, intent: e.target.value })}
                  >
                    <option value="">Select tag</option>
                    {tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <input
                    className="border rounded px-2 py-1"
                    type="text"
                    placeholder="New tag"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>Add</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  placeholder="Template title"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Enter template content... Use {username} as placeholder"
                className="min-h-24"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCreateSave}
                className="bg-green-600 hover:bg-green-700"
                disabled={!newTemplate.intent.trim() || !newTemplate.title.trim() || !newTemplate.content.trim()}
              >
                <Check className="w-4 h-4 mr-1" />
                Create
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateCancel}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <strong>Tip:</strong> Click the edit button to modify template content. Use <code className="bg-white px-1 rounded">{'{username}'}</code> as a placeholder for dynamic usernames.
      </div>

      {templates.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No templates available. Create your first template using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="bg-white hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <Badge className={getIntentColor(template.intent)}>
                      {template.intent.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingId !== template.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart(template)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(template.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={editingId === template.id}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === template.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-24 resize-none"
                      placeholder="Enter template content..."
                    />
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {template.content}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatesManager;
