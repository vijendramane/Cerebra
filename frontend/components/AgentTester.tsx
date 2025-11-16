'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Bot } from 'lucide-react';
import api from '@/lib/api';
 
interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

interface TaskType {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function AgentTester() {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [parameters, setParameters] = useState<any>({});
  const [result, setResult] = useState<any>(null);

  // Fetch available agents
  const { data: agents } = useQuery<{ agents: Agent[] }>({
    queryKey: ['agents'],
    queryFn: () => api.get('/agents/available-agents').then(res => res.data),
  });

  // Fetch task types
  const { data: taskTypes } = useQuery<{ tasks: TaskType[] }>({
    queryKey: ['taskTypes'],
    queryFn: () => api.get('/agents/task-types').then(res => res.data),
  });

  // Execute task mutation
  const executeTask = useMutation({
    mutationFn: (data: any) => api.post('/agents/execute-task', data),
    onSuccess: (response) => {
      setResult(response.data);
    },
  });

  const handleExecute = () => {
    if (!selectedAgent || !selectedTask) return;

    executeTask.mutate({
      agent_type: selectedAgent,
      task_type: selectedTask,
      parameters,
    });
  };

  const getParameterInputs = () => {
    switch (selectedTask) {
      case 'idea_generation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Research Topic</Label>
              <Textarea
                id="topic"
                placeholder="e.g., Transformer architectures for efficient NLP"
                value={parameters.topic || ''}
                onChange={(e) => setParameters({ ...parameters, topic: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );
      case 'proposal_writing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="idea">Research Idea</Label>
              <Textarea
                id="idea"
                placeholder="Describe your research idea..."
                value={parameters.idea || ''}
                onChange={(e) => setParameters({ ...parameters, idea: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );
      case 'experiment_design':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hypothesis">Hypothesis</Label>
              <Textarea
                id="hypothesis"
                placeholder="State your hypothesis..."
                value={parameters.hypothesis || ''}
                onChange={(e) => setParameters({ ...parameters, hypothesis: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );
      case 'paper_writing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="section">Paper Section</Label>
              <Select
                value={parameters.section || ''}
                onValueChange={(value) => setParameters({ ...parameters, section: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="methodology">Methodology</SelectItem>
                  <SelectItem value="results">Results</SelectItem>
                  <SelectItem value="conclusion">Conclusion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content/Data</Label>
              <Textarea
                id="content"
                placeholder="Provide content or data for this section..."
                value={parameters.content || ''}
                onChange={(e) => setParameters({ ...parameters, content: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );
      case 'literature_review':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic for Review</Label>
              <Textarea
                id="topic"
                placeholder="e.g., Recent advances in few-shot learning"
                value={parameters.topic || ''}
                onChange={(e) => setParameters({ ...parameters, topic: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            Configure Agent Task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="agent">Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger id="agent" className="mt-1">
                <SelectValue placeholder="Choose an AI agent" />
              </SelectTrigger>
              <SelectContent>
                {agents?.agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="task">Select Task Type</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger id="task" className="mt-1">
                <SelectValue placeholder="Choose a task" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes?.tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTask && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Task Parameters</h3>
              {getParameterInputs()}
            </div>
          )}

          <Button
            onClick={handleExecute}
            disabled={!selectedAgent || !selectedTask || executeTask.isPending}
            className="w-full"
          >
            {executeTask.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Execute Task
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Results</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Task ID: {result.task_id}
                </p>
                <p className="text-sm text-green-800">
                  Status: {result.status}
                </p>
              </div>
              {result.message && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {result.message}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Execute a task to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
