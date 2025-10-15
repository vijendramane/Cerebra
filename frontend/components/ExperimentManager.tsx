'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Update the import path if the file is located elsewhere, for example:
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// Or create the file at components/ui/card.tsx if it does not exist.
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, Eye } from 'lucide-react';
import api from '@/lib/api';

export default function ExperimentManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    domain: '',
    agents: [],
    tasks: [],
    config: {},
  });

  const { data: experiments, isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => api.get('/experiments/list').then(res => res.data),
  });

  const createExperiment = useMutation({
    mutationFn: (data: any) => api.post('/experiments/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      setIsCreateOpen(false);
      setNewExperiment({
        name: '',
        description: '',
        domain: '',
        agents: [],
        tasks: [],
        config: {},
      });
    },
  });

  const runExperiment = useMutation({
    mutationFn: (id: number) => api.post(`/experiments/${id}/run`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
    },
  });

  const handleCreate = () => {
    createExperiment.mutate(newExperiment);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Experiments</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Experiment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Experiment Name</Label>
                <Input
                  id="name"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                  placeholder="e.g., NLP Agent Comparison"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                  placeholder="Describe the experiment..."
                />
              </div>

              <div>
                <Label htmlFor="domain">Domain</Label>
                <Select
                  value={newExperiment.domain}
                  onValueChange={(value) => setNewExperiment({ ...newExperiment, domain: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nlp">Natural Language Processing</SelectItem>
                    <SelectItem value="cv">Computer Vision</SelectItem>
                    <SelectItem value="rl">Reinforcement Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Agents</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewExperiment({
                            ...newExperiment,
                            agents: [...newExperiment.agents, 'gemini'],
                          });
                        } else {
                          setNewExperiment({
                            ...newExperiment,
                            agents: newExperiment.agents.filter(a => a !== 'gemini'),
                          });
                        }
                      }}
                    />
                    Google Gemini
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewExperiment({
                            ...newExperiment,
                            agents: [...newExperiment.agents, 'groq'],
                          });
                        } else {
                          setNewExperiment({
                            ...newExperiment,
                            agents: newExperiment.agents.filter(a => a !== 'groq'),
                          });
                        }
                      }}
                    />
                    Groq
                  </label>
                </div>
              </div>

              <div>
                <Label>Select Tasks</Label>
                <div className="space-y-2 mt-2">
                  {['idea_generation', 'proposal_writing', 'experiment_design', 'paper_writing', 'literature_review'].map(task => (
                    <label key={task} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewExperiment({
                              ...newExperiment,
                              tasks: [...newExperiment.tasks, task],
                            });
                          } else {
                            setNewExperiment({
                              ...newExperiment,
                              tasks: newExperiment.tasks.filter(t => t !== task),
                            });
                          }
                        }}
                      />
                      {task.replace('_', ' ').charAt(0).toUpperCase() + task.replace('_', ' ').slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Experiment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments?.map((experiment: any) => (
          <Card key={experiment.id}>
            <CardHeader>
              <CardTitle className="text-lg">{experiment.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{experiment.description}</p>
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Domain:</span> {experiment.domain}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    experiment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    experiment.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {experiment.status}
                  </span>
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runExperiment.mutate(experiment.id)}
                  disabled={experiment.status === 'running'}
                >
                  <Play className="mr-1 h-3 w-3" />
                  Run
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="mr-1 h-3 w-3" />
                  View Results
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}