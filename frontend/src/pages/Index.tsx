import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, TrendingUp, Activity, Zap } from 'lucide-react';
import { Target, Template, Stats } from '@/types/dashboard';
import TargetsManager from '@/components/TargetsManager';
import TemplatesManager from '@/components/TemplatesManager';

const Index = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    
    // Poll stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API calls
      const [targetsRes, templatesRes, statsRes] = await Promise.all([
        // fetch('/api/targets').then(res => res.json()),
        // fetch('/api/templates').then(res => res.json()),
        // fetch('/api/stats').then(res => res.json())
        Promise.resolve([]),
        Promise.resolve([]),
        Promise.resolve(null)
      ]);
      
      setTargets(targetsRes);
      setTemplates(templatesRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/stats');
      // const newStats = await response.json();
      // setStats(newStats);
      console.log('Polling stats...');
    } catch (error) {
      console.error('Error polling stats:', error);
    }
  };

  const addTarget = async (targetData: Omit<Target, 'id' | 'createdAt'>) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/targets', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(targetData)
      // });
      // const newTarget = await response.json();
      
      const newTarget: Target = {
        id: Date.now().toString(),
        ...targetData,
        createdAt: new Date().toISOString()
      };
      
      setTargets(prev => [...prev, newTarget]);
      console.log('Target added:', newTarget);
    } catch (error) {
      console.error('Error adding target:', error);
    }
  };

  const deleteTarget = async (targetId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/targets/${targetId}`, { method: 'DELETE' });
      
      setTargets(prev => prev.filter(t => t.id !== targetId));
      console.log('Target deleted:', targetId);
    } catch (error) {
      console.error('Error deleting target:', error);
    }
  };

  const updateTemplate = async (templateId: string, content: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/templates/${templateId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content })
      // });
      
      setTemplates(prev => 
        prev.map(t => t.id === templateId ? { ...t, content } : t)
      );
      console.log('Template updated:', templateId);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DM Automation Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your Instagram DM automation, templates, and view performance stats</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                <Zap className="w-3 h-3 mr-1" />
                Claude + MCP
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="stats">Stats Overview</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Messages</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">
                        {stats?.totalMessages?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">All messages processed</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">
                        {stats?.averageResponseTime || '0'}min
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Average response time</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categorized Messages</p>
                      <p className="text-3xl font-bold text-orange-600 mt-1">
                        {stats?.totalMessages?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Messages by intent</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages by Intent */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Messages by Intent</CardTitle>
                <CardDescription>Breakdown of messages handled by intent category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.messagesByIntent ? Object.entries(stats.messagesByIntent)
                    .sort(([, a], [, b]) => b - a)
                    .map(([intent, count]) => {
                      const total = Object.values(stats.messagesByIntent).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100) : 0;
                      const percentageText = percentage.toFixed(1);
                      const barWidth = Math.max(percentage * 2, 8);
                      
                      return (
                        <div key={intent} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                              intent === 'question' ? 'bg-green-100 text-green-800' :
                              intent === 'cold_lead' ? 'bg-blue-100 text-blue-800' :
                              intent === 'sales_inquiry' ? 'bg-orange-100 text-orange-800' :
                              intent === 'complaint' ? 'bg-red-100 text-red-800' :
                              intent === 'VIP' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {intent.replace('_', ' ')}
                            </div>
                            <span className="text-gray-600 capitalize">{intent.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className={`h-2 rounded-full ${
                              intent === 'question' ? 'bg-green-500' :
                              intent === 'cold_lead' ? 'bg-blue-500' :
                              intent === 'sales_inquiry' ? 'bg-orange-500' :
                              intent === 'complaint' ? 'bg-red-500' :
                              intent === 'VIP' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`} style={{ width: `${barWidth}px` }} />
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-xs text-gray-500">{percentageText}%</div>
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                    <div className="text-center py-8 text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets">
            <TargetsManager 
              targets={targets}
              onAdd={addTarget}
              onDelete={deleteTarget}
            />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager 
              templates={templates}
              onUpdate={updateTemplate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
