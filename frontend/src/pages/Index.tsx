import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, TrendingUp, Activity, Zap, Search, Download, Filter, Copy, Send, BookOpen } from 'lucide-react';
import { Stats } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import Chat from './Chat';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import Playground from './Playground';
import { Tooltip as ReTooltip } from 'recharts';

const INTENT_COLORS: Record<string, string> = {
  greeting: '#a78bfa',
  pricing_inquiry: '#60a5fa',
  support_request: '#fbbf24',
  sales_lead: '#34d399',
  complaint: '#f87171',
  spam: '#9ca3af',
  appointment: '#818cf8',
  feedback: '#fde68a',
  partnership: '#f472b6',
  general_inquiry: '#2dd4bf',
  other: '#d1d5db',
};

const OUTCOME_COLORS: Record<string, string> = {
  responded: '#34d399',
  escalated: '#fbbf24',
  ignored: '#9ca3af',
};

const OUTCOME_LABELS: Record<string, string> = {
  responded: 'Responded',
  escalated: 'Escalated',
  ignored: 'Ignored',
};

const Index = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [intentFilter, setIntentFilter] = useState('all');
  const [prompt, setPrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptEdit, setPromptEdit] = useState('');
  const promptRef = useRef<HTMLTextAreaElement>(null);

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
      
      // Use actual API calls
      const [statsRes] = await Promise.all([
        fetch('/api/stats').then(res => res.json())
      ]);
      
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
      const response = await fetch('/api/stats');
      const newStats = await response.json();
      setStats(newStats);
      console.log('Polling stats...');
    } catch (error) {
      console.error('Error polling stats:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await fetch('/api/logs');
      const logsData = await response.json();
      setLogs(logsData);
      filterLogs();
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.original_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.suggestion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(log => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        
        switch (dateFilter) {
          case 'today':
            return logDate >= today;
          case 'yesterday':
            return logDate >= yesterday && logDate < today;
          case 'week':
            return logDate >= weekAgo;
          default:
            return true;
        }
      });
    }
    
    if (intentFilter !== 'all') {
      filtered = filtered.filter(log => log.intent === intentFilter);
    }
    
    setFilteredLogs(filtered);
  };

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, dateFilter, intentFilter]);

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Username', 'Original Message', 'Reply']
    ].concat(
      filteredLogs.map(log => [
        log.timestamp ? new Date(log.timestamp).toISOString() : '',
        log.username || '',
        log.original_message || '',
        log.suggestion || ''
      ])
    ).map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy failed',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const getMCPCommands = (log: any) => {
    const commands = {
      fetchMessages: `list_messages("${log.thread_id || 'THREAD_ID'}")`,
      sendReply: `send_message("${log.username || 'USERNAME'}", "${log.suggestion || 'REPLY_TEXT'}")`,
      markSeen: `mark_message_seen("${log.thread_id || 'THREAD_ID'}")`,
    };
    return commands;
  };

  const copyAllMCPCommands = () => {
    const allCommands = filteredLogs.map((log, index) => {
      const commands = getMCPCommands(log);
      return `# ${log.username || 'Unknown'} - ${log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
${commands.fetchMessages}
${commands.sendReply}
${commands.markSeen}
`;
    }).join('\n');

    copyToClipboard(allCommands, 'All MCP Commands');
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'greeting':
        return 'bg-purple-100 text-purple-800';
      case 'pricing_inquiry':
        return 'bg-blue-100 text-blue-800';
      case 'support_request':
        return 'bg-orange-100 text-orange-800';
      case 'sales_lead':
        return 'bg-green-100 text-green-800';
      case 'complaint':
        return 'bg-red-100 text-red-800';
      case 'spam':
        return 'bg-gray-100 text-gray-800';
      case 'appointment':
        return 'bg-indigo-100 text-indigo-800';
      case 'feedback':
        return 'bg-yellow-100 text-yellow-800';
      case 'partnership':
        return 'bg-pink-100 text-pink-800';
      case 'general_inquiry':
        return 'bg-teal-100 text-teal-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntentBarColor = (intent: string) => {
    switch (intent) {
      case 'greeting':
        return 'bg-purple-500';
      case 'pricing_inquiry':
        return 'bg-blue-500';
      case 'support_request':
        return 'bg-orange-500';
      case 'sales_lead':
        return 'bg-green-500';
      case 'complaint':
        return 'bg-red-500';
      case 'spam':
        return 'bg-gray-500';
      case 'appointment':
        return 'bg-indigo-500';
      case 'feedback':
        return 'bg-yellow-500';
      case 'partnership':
        return 'bg-pink-500';
      case 'general_inquiry':
        return 'bg-teal-500';
      case 'other':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatIntentName = (intent: string) => {
    return intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    setPromptLoading(true);
    try {
      const res = await fetch('/api/prompt');
      const data = await res.json();
      setPrompt(data.prompt || '');
      setPromptEdit(data.prompt || '');
    } catch {
      setPrompt('');
      setPromptEdit('');
    } finally {
      setPromptLoading(false);
    }
  };

  const savePrompt = async () => {
    setPromptLoading(true);
    try {
      await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptEdit }),
      });
      setPrompt(promptEdit);
      toast({ title: 'Prompt updated', description: 'LLM prompt saved.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save prompt', variant: 'destructive' });
    } finally {
      setPromptLoading(false);
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
              <h1 className="text-2xl font-bold text-gray-900">AI-Powered DM Automation</h1>
              <p className="text-gray-600 mt-1">Privacy-first Instagram DM assistant with Claude Desktop integration</p>
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
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="stats">Stats Overview</TabsTrigger>
            <TabsTrigger value="logs" onClick={loadLogs}>Logs</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
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

            {/* Pie chart for intents */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Intent Breakdown</CardTitle>
                <CardDescription>Distribution of message intents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <PieChart width={320} height={220}>
                    <Pie
                      data={stats?.messagesByIntent ? Object.entries(stats.messagesByIntent).map(([intent, count]) => ({ name: intent, value: count })) : []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name }) => name.replace('_', ' ')}
                    >
                      {stats?.messagesByIntent && Object.keys(stats.messagesByIntent).map((intent, idx) => (
                        <Cell key={intent} fill={INTENT_COLORS[intent] || '#d1d5db'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                  {/* Outcome stats */}
                  <div>
                    <h4 className="font-semibold mb-2">Outcomes</h4>
                    {['responded', 'escalated', 'ignored'].map(outcome => (
                      <div key={outcome} className="flex items-center gap-2 mb-1">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: OUTCOME_COLORS[outcome] }}></span>
                        <span className="capitalize">{outcome}</span>
                        <span className="ml-2 text-gray-600 font-mono">
                          {logs.filter(l => l.outcome === outcome).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>LLM Prompt Builder</CardTitle>
                <CardDescription>Edit the system prompt for DeepSeek R1</CardDescription>
              </CardHeader>
              <CardContent>
                {promptLoading ? (
                  <div>Loading prompt...</div>
                ) : (
                  <>
                    <textarea
                      ref={promptRef}
                      className="w-full border rounded p-2 mb-2 text-sm font-mono"
                      rows={6}
                      value={promptEdit}
                      onChange={e => setPromptEdit(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={savePrompt} disabled={promptLoading}>Save Prompt</Button>
                      <Button size="sm" variant="outline" onClick={() => setPromptEdit(prompt)}>Reset</Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">This prompt will be used for all AI reply suggestions.</div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Logs</CardTitle>
                    <CardDescription>Last 50 interactions with AI-powered suggestions</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyAllMCPCommands}
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      disabled={filteredLogs.length === 0}
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy All MCP</span>
                    </button>
                    <button
                      onClick={exportLogs}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      disabled={filteredLogs.length === 0}
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by username or message..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                  </select>
                  <select
                    value={intentFilter}
                    onChange={e => setIntentFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Intents</option>
                    {stats?.messagesByIntent && Object.keys(stats.messagesByIntent).map(intent => (
                      <option key={intent} value={intent}>{intent.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600 mb-4">
                  Showing {filteredLogs.length} of {logs.length} logs
                </div>

                {logsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading logs...</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {logs.length === 0 ? 'No logs found.' : 'No logs match your filters.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-2 py-1 text-left font-medium">Time</th>
                          <th className="px-2 py-1 text-left font-medium">User</th>
                          <th className="px-2 py-1 text-left font-medium">Question</th>
                          <th className="px-2 py-1 text-left font-medium">Reply</th>
                          <th className="px-2 py-1 text-left font-medium">MCP Commands</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log, i) => {
                          const commands = getMCPCommands(log);
                          return (
                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="px-2 py-1 whitespace-nowrap text-gray-600">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap font-medium">
                                {log.username || ''}
                              </td>
                              <td className="px-2 py-1 max-w-xs truncate" title={log.original_message}>
                                {log.original_message}
                              </td>
                              <td className="px-2 py-1 max-w-xs truncate" title={log.suggestion}>
                                {log.suggestion}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => copyToClipboard(commands.fetchMessages, 'Fetch Messages Command')}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                    title="Copy command to fetch messages from this thread"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Fetch
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(commands.sendReply, 'Send Reply Command')}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                    title="Copy command to send the suggested reply"
                                  >
                                    <Send className="w-3 h-3" />
                                    Send
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(commands.markSeen, 'Mark Seen Command')}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                    title="Copy command to mark messages as seen"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    Seen
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Chat />
          </TabsContent>

          <TabsContent value="playground">
            <Playground />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  AI-Powered DM Automation Documentation
                </CardTitle>
                <CardDescription>
                  Complete guide to using the privacy-first Instagram DM automation system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* System Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">🚀 System Overview</h3>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <p className="text-blue-800">
                      <strong>AI-Powered DM Automation</strong> is a privacy-first Instagram DM assistant that uses Claude Desktop with MCP (Model Context Protocol) for secure, local Instagram access. No data leaves your machine, and all AI processing happens through OpenRouter's DeepSeek R1 model.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">✅ Privacy-First</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• No Instagram API access required</li>
                        <li>• All data stays on your machine</li>
                        <li>• Claude Desktop handles Instagram</li>
                        <li>• Secure MCP communication</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">🤖 AI-Powered</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• DeepSeek R1 for intelligent replies</li>
                        <li>• Intent classification & analysis</li>
                        <li>• Customizable system prompts</li>
                        <li>• Real-time suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Features Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">📊 Dashboard Features</h3>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-blue-600 mb-2">📈 Stats Overview</h4>
                      <p className="text-gray-600 mb-2">Real-time analytics and performance metrics</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Total Messages:</strong> Count of all processed DMs</li>
                        <li>• <strong>Avg Response Time:</strong> Average time to respond to messages</li>
                        <li>• <strong>Categorized Messages:</strong> Messages classified by intent</li>
                        <li>• <strong>Intent Breakdown:</strong> Visual pie chart of message types</li>
                        <li>• <strong>Outcome Tracking:</strong> Responded, escalated, or ignored</li>
                      </ul>
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <strong>Example:</strong> View how many pricing inquiries you received this week and your average response time to convert them into sales.
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-600 mb-2">📝 LLM Prompt Builder</h4>
                      <p className="text-gray-600 mb-2">Customize the AI's personality and response style</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>System Prompt:</strong> Define AI behavior and tone</li>
                        <li>• <strong>Real-time Updates:</strong> Changes apply immediately</li>
                        <li>• <strong>Save/Reset:</strong> Manage prompt versions</li>
                      </ul>
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <strong>Example Prompt:</strong> "You are a friendly customer service representative for a tech startup. Always be helpful, professional, and try to convert inquiries into sales opportunities."
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logs Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">📋 Logs Management</h3>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-orange-600 mb-2">🔍 Logs Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1 mb-3">
                      <li>• <strong>Search:</strong> Find messages by username or content</li>
                      <li>• <strong>Date Filtering:</strong> Today, yesterday, last 7 days, all time</li>
                      <li>• <strong>Intent Filtering:</strong> Filter by message type (pricing, support, etc.)</li>
                      <li>• <strong>Export CSV:</strong> Download logs for external analysis</li>
                      <li>• <strong>MCP Commands:</strong> Copy ready-to-use Claude commands</li>
                    </ul>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-3 rounded">
                        <h5 className="font-semibold text-orange-800 mb-1">MCP Commands</h5>
                        <p className="text-xs text-orange-700">Copy these commands to use in Claude Desktop:</p>
                        <code className="text-xs block mt-1 bg-orange-100 p-2 rounded">
                          list_messages("thread_id")<br/>
                          send_message("username", "reply")<br/>
                          mark_message_seen("thread_id")
                        </code>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <h5 className="font-semibold text-green-800 mb-1">Export Data</h5>
                        <p className="text-xs text-green-700">Download logs as CSV for:</p>
                        <ul className="text-xs text-green-700 mt-1">
                          <li>• Excel analysis</li>
                          <li>• Customer insights</li>
                          <li>• Performance tracking</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">💬 Agentic Chat Interface</h3>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-purple-600 mb-2">🤖 AI-Powered Conversations</h4>
                    <p className="text-gray-600 mb-3">Interactive chat interface for managing Instagram DMs with AI assistance</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Features:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• View all Instagram threads</li>
                          <li>• Real-time conversation display</li>
                          <li>• AI-generated reply suggestions</li>
                          <li>• One-click "Use AI Reply"</li>
                          <li>• Copy MCP commands instantly</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Workflow:</h5>
                        <ol className="text-sm text-gray-600 space-y-1">
                          <li>1. Select a conversation thread</li>
                          <li>2. View message history</li>
                          <li>3. Get AI reply suggestion</li>
                          <li>4. Use AI reply or customize</li>
                          <li>5. Copy MCP command to send</li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>💡 Pro Tip:</strong> Use the Chat interface for active conversations and the Logs for historical analysis and bulk operations.
                    </div>
                  </div>
                </div>

                {/* Playground Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">🎮 AI Playground</h3>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-600 mb-2">🧪 Test & Experiment</h4>
                    <p className="text-gray-600 mb-3">Frontend-only testing environment for AI reply generation</p>
                    
                    <ul className="text-sm text-gray-600 space-y-1 mb-3">
                      <li>• <strong>Instant Testing:</strong> Test AI responses without Instagram</li>
                      <li>• <strong>Prompt Tuning:</strong> Experiment with different prompts</li>
                      <li>• <strong>Response Quality:</strong> Evaluate AI reply quality</li>
                      <li>• <strong>No Data Loss:</strong> Safe testing environment</li>
                    </ul>
                    
                    <div className="bg-indigo-50 p-3 rounded">
                      <strong>🎯 Use Cases:</strong> Test new prompts, evaluate AI responses, train team members, or experiment with different conversation scenarios before using in production.
                    </div>
                  </div>
                </div>

                {/* Setup & Usage */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">⚙️ Setup & Usage Guide</h3>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-blue-600 mb-2">🔧 Initial Setup</h4>
                      <ol className="text-sm text-gray-600 space-y-2">
                        <li><strong>1. Install Dependencies:</strong> Run <code className="bg-gray-100 px-1 rounded">npm install</code> in frontend directory</li>
                        <li><strong>2. Configure Environment:</strong> Copy <code className="bg-gray-100 px-1 rounded">env.example</code> to <code className="bg-gray-100 px-1 rounded">.env</code></li>
                        <li><strong>3. Start Backend:</strong> Run <code className="bg-gray-100 px-1 rounded">python main.py</code></li>
                        <li><strong>4. Start Frontend:</strong> Run <code className="bg-gray-100 px-1 rounded">npm run dev</code></li>
                        <li><strong>5. Configure Claude Desktop:</strong> Set up MCP server connection</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-600 mb-2">🚀 Daily Workflow</h4>
                      <ol className="text-sm text-gray-600 space-y-2">
                        <li><strong>1. Check Stats:</strong> Review daily metrics and performance</li>
                        <li><strong>2. Process DMs:</strong> Use Chat interface for active conversations</li>
                        <li><strong>3. Get AI Suggestions:</strong> Let AI generate contextual replies</li>
                        <li><strong>4. Copy MCP Commands:</strong> Use in Claude Desktop to send replies</li>
                        <li><strong>5. Track Outcomes:</strong> Monitor response effectiveness in Logs</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-600 mb-2">🎯 Best Practices</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Regular Prompt Updates:</strong> Refine AI behavior based on results</li>
                        <li>• <strong>Monitor Analytics:</strong> Track response times and conversion rates</li>
                        <li>• <strong>Export Data:</strong> Regular CSV exports for external analysis</li>
                        <li>• <strong>Test New Features:</strong> Use Playground before production</li>
                        <li>• <strong>Backup Logs:</strong> Regular data exports for safekeeping</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">🔧 Troubleshooting</h3>
                  
                  <div className="border rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="bg-red-50 p-3 rounded">
                        <h5 className="font-semibold text-red-800 mb-1">❌ Common Issues</h5>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• <strong>Backend Connection:</strong> Ensure <code className="bg-red-100 px-1 rounded">python main.py</code> is running</li>
                          <li>• <strong>MCP Connection:</strong> Check Claude Desktop MCP server setup</li>
                          <li>• <strong>Environment Variables:</strong> Verify <code className="bg-red-100 px-1 rounded">.env</code> configuration</li>
                          <li>• <strong>Port Conflicts:</strong> Ensure ports 8000 (backend) and 5173 (frontend) are free</li>
                        </ul>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded">
                        <h5 className="font-semibold text-yellow-800 mb-1">⚠️ Performance Tips</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• <strong>Clear Logs:</strong> Export and clear old logs for better performance</li>
                          <li>• <strong>Prompt Optimization:</strong> Shorter, focused prompts work better</li>
                          <li>• <strong>Regular Restarts:</strong> Restart services weekly for optimal performance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">💡 Need Help?</h3>
                  <p className="text-gray-600 mb-3">
                    This system is designed to be self-contained and user-friendly. For additional support:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Check the README.md file for detailed setup instructions</li>
                    <li>• Review the MCP_TOOLS.md for Claude Desktop integration</li>
                    <li>• Use the Playground to test features safely</li>
                    <li>• Export logs for external analysis and debugging</li>
                  </ul>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
