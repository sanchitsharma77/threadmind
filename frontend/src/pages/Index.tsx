import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, TrendingUp, Activity, Zap, Search, Download, Filter, Copy, Send } from 'lucide-react';
import { Stats } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const Index = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);

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
    
    setFilteredLogs(filtered);
  };

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, dateFilter]);

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
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="stats">Stats Overview</TabsTrigger>
            <TabsTrigger value="logs" onClick={loadLogs}>Logs</TabsTrigger>
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
                              intent === 'pricing_inquiry' ? 'bg-blue-100 text-blue-800' :
                              intent === 'sales_lead' ? 'bg-orange-100 text-orange-800' :
                              intent === 'complaint' ? 'bg-red-100 text-red-800' :
                              intent === 'greeting' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {intent.replace('_', ' ')}
                            </div>
                            <span className="text-gray-600 capitalize">{intent.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className={`h-2 rounded-full ${
                              intent === 'question' ? 'bg-green-500' :
                              intent === 'pricing_inquiry' ? 'bg-blue-500' :
                              intent === 'sales_lead' ? 'bg-orange-500' :
                              intent === 'complaint' ? 'bg-red-500' :
                              intent === 'greeting' ? 'bg-purple-500' :
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
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
