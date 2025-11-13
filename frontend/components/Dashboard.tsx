'use client';

import { useQuery } from '@tanstack/react-query'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Brain, FlaskConical, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({  
    queryKey: ['dashboard-metrics'],  
    queryFn: () => api.get('/metrics/dashboard').then(res => res.data),
  });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_experiments || 0}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_tests || 0}</div>
            <p className="text-xs text-muted-foreground">+180 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.success_rate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">+5.2% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(metrics?.agent_usage || {}).length}</div>
            <p className="text-xs text-muted-foreground">Gemini, Groq available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height="300">
              <PieChart>
                <Pie
                  data={Object.entries(metrics?.agent_usage || {}).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(metrics?.agent_usage || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.recent_tests?.slice(0, 5).map((test: any) => (
                <div key={test.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{test.task_type}</p>
                    <p className="text-sm text-gray-500">{test.agent_type}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(test.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
