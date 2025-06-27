
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { Target } from '@/types/dashboard';

interface TargetsManagerProps {
  targets: Target[];
  onAdd: (target: Omit<Target, 'id' | 'createdAt'>) => void;
  onDelete: (targetId: string) => void;
}

const TargetsManager = ({ targets, onAdd, onDelete }: TargetsManagerProps) => {
  const [newUsername, setNewUsername] = useState('');
  const [newTemplateTag, setNewTemplateTag] = useState('');

  const templateTags = ['cold_lead', 'VIP', 'question', 'complaint', 'sales_inquiry', 'unknown'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newTemplateTag) return;

    onAdd({
      username: newUsername.startsWith('@') ? newUsername : `@${newUsername}`,
      templateTag: newTemplateTag
    });

    setNewUsername('');
    setNewTemplateTag('');
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      cold_lead: 'bg-blue-100 text-blue-800',
      VIP: 'bg-purple-100 text-purple-800',
      question: 'bg-green-100 text-green-800',
      complaint: 'bg-red-100 text-red-800',
      sales_inquiry: 'bg-orange-100 text-orange-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[tag] || colors.unknown;
  };

  return (
    <div className="space-y-6">
      {/* Add New Target Form */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Add New Target</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Username
              </label>
              <Input
                type="text"
                placeholder="@username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Tag
              </label>
              <Select value={newTemplateTag} onValueChange={setNewTemplateTag} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {templateTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Target
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Targets List */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Current Targets ({targets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No targets added yet. Add your first target above.
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium text-gray-900">{target.username}</div>
                      <div className="text-sm text-gray-500">
                        Added {new Date(target.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={getTagColor(target.templateTag)}>
                      {target.templateTag.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className="bg-green-50 text-green-600 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(target.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TargetsManager;
