
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stats } from '@/types/dashboard';

interface StatsOverviewProps {
  stats: Stats | null;
}

const StatsOverview = ({ stats }: StatsOverviewProps) => {
  if (!stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const totalIntentMessages = Object.values(stats.messagesByIntent).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              All messages processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.averageResponseTime}min</div>
            <p className="text-xs text-gray-600 mt-1">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorized Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalIntentMessages.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              Messages by intent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Messages by Intent */}
      <Card>
        <CardHeader>
          <CardTitle>Messages by Intent</CardTitle>
          <CardDescription>
            Breakdown of messages handled by intent category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.messagesByIntent)
              .sort(([, a], [, b]) => b - a)
              .map(([intent, count]) => {
                const percentage = totalIntentMessages > 0 ? (count / totalIntentMessages) * 100 : 0;
                return (
                  <div key={intent} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getIntentColor(intent)}>
                        {intent.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600 capitalize">
                        {intent.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-sm font-medium text-gray-900 w-12 text-right">
                        {count}
                      </div>
                      <div className="text-xs text-gray-500 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* API Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration</CardTitle>
          <CardDescription>
            Backend connection status and endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Targets API</div>
                <div className="text-sm text-gray-600">GET/POST/DELETE /api/targets</div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Ready to Connect
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Templates API</div>
                <div className="text-sm text-gray-600">GET/PUT /api/templates</div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Ready to Connect
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Stats API</div>
                <div className="text-sm text-gray-600">GET /api/stats</div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Ready to Connect
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
