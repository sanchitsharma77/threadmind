
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X } from 'lucide-react';
import { Template } from '@/types/dashboard';

interface TemplatesManagerProps {
  templates: Template[];
  onUpdate: (templateId: string, content: string) => void;
}

const TemplatesManager = ({ templates, onUpdate }: TemplatesManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      cold_lead: 'bg-blue-100 text-blue-800',
      VIP: 'bg-purple-100 text-purple-800',
      question: 'bg-green-100 text-green-800',
      complaint: 'bg-red-100 text-red-800',
      sales_inquiry: 'bg-orange-100 text-orange-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[intent] || colors.unknown;
  };

  if (templates.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No templates available. Templates will appear here when loaded from the backend.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <strong>Tip:</strong> Click the edit button to modify template content. Use <code className="bg-white px-1 rounded">{'{username}'}</code> as a placeholder for dynamic usernames.
      </div>

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
    </div>
  );
};

export default TemplatesManager;
