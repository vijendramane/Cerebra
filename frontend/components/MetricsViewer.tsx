'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

export default function MetricsViewer() {
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');

  const { data: metrics } = useQuery({
    queryKey: ['performance-metrics', selectedAgent, selectedTask],
    queryFn: () => api.get('/metrics/performance', {
      params: {
        agent_type: selectedAgent !== 'all' ? selectedAgent : undefined,
        task_type: selectedTask !== 'all' ? selectedTask : undefined,
      }
    }).then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Filter by Agent</label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Filter by Task</label>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="idea_generation">Idea Generation</SelectItem>
              <SelectItem value="proposal_writing">Proposal Writing</SelectItem>
              <SelectItem value="experiment_design">Experiment Design</SelectItem>
              <SelectItem value="paper_writing">Paper Writing</SelectItem>
              <SelectItem value="literature_review">Literature Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {(metrics?.average_quality * 100)?.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Average quality across all tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completeness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {(metrics?.average_completeness * 100)?.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Average completeness of outputs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height="300">
            <BarChart
              data={Object.entries(metrics?.task_distribution || {}).map(([task, count]) => ({
                task: task.replace('_', ' '),
                count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="task" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
