'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeView, setActiveView] = useState('test');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchResults();
    fetchAgents();
    fetchMetrics();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/results');
      const data = await response.json();
      setTestResults(data.results || []);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/agents');
      const data = await response.json();
      setAgents(data || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 100
    },
    headerContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#0f172a'
    },
    nav: {
      display: 'flex',
      gap: '0.5rem'
    },
    navButton: (isActive: boolean) => ({
      padding: '0.5rem 1.25rem',
      background: isActive ? '#3b82f6' : 'transparent',
      color: isActive ? '#ffffff' : '#64748b',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    main: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2rem'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>AI Agent Testing Platform</div>
          <nav style={styles.nav}>
            <button
              style={styles.navButton(activeView === 'test')}
              onClick={() => setActiveView('test')}
            >
              Test Agent
            </button>
            <button
              style={styles.navButton(activeView === 'results')}
              onClick={() => setActiveView('results')}
            >
              Results
            </button>
            <button
              style={styles.navButton(activeView === 'comparison')}
              onClick={() => setActiveView('comparison')}
            >
              Comparison
            </button>
            <button
              style={styles.navButton(activeView === 'dashboard')}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {activeView === 'test' && (
          <TestInterface 
            onTestComplete={() => {
              fetchResults();
              fetchAgents();
              fetchMetrics();
            }}
          />
        )}
        {activeView === 'results' && <ResultsView results={testResults} />}
        {activeView === 'comparison' && <ComparisonView agents={agents} />}
        {activeView === 'dashboard' && <Dashboard metrics={metrics} agents={agents} />}
      </main>
    </div>
  );
}

// Test Interface Component
function TestInterface({ onTestComplete }: { onTestComplete: () => void }) {
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_type: 'openai',
    agent_endpoint: '',
    agent_api_key: '',
    task_type: 'idea_generation',
    test_input: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
const agentTypes = [
  { value: 'openai', label: 'OpenAI (GPT)', endpoint: 'https://api.openai.com/v1/chat/completions' },
  { value: 'anthropic', label: 'Anthropic (Claude)', endpoint: 'https://api.anthropic.com/v1/messages' },
  { value: 'google', label: 'Google (Gemini)', endpoint: '' },
  { value: 'huggingface', label: 'HuggingFace - Phi-3 Mini', endpoint: 'https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct' },
  { value: 'huggingface', label: 'HuggingFace - Mistral 7B', endpoint: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2' },
  { value: 'huggingface', label: 'HuggingFace - Gemma 2B', endpoint: 'https://api-inference.huggingface.co/models/google/gemma-2b-it' },
  { value: 'custom', label: 'Custom API', endpoint: '' }
];

  const taskTypes = [
    { value: 'idea_generation', label: 'Idea Generation' },
    { value: 'proposal_writing', label: 'Proposal Writing' },
    { value: 'experiment_design', label: 'Experiment Design' },
    { value: 'paper_writing', label: 'Paper Writing' },
    { value: 'literature_review', label: 'Literature Review' },
    { value: 'code_generation', label: 'Code Generation' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'summarization', label: 'Summarization' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Test failed');
      }

      const data = await response.json();
      setResult(data);
      onTestComplete();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem'
    },
    panel: {
      background: '#ffffff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#0f172a'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#475569'
    },
    input: {
      padding: '0.625rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'border 0.2s'
    },
    select: {
      padding: '0.625rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      outline: 'none',
      background: '#ffffff',
      cursor: 'pointer'
    },
    textarea: {
      padding: '0.625rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      outline: 'none',
      minHeight: '120px',
      resize: 'vertical' as const
    },
    button: {
      padding: '0.75rem',
      background: loading ? '#94a3b8' : '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s'
    },
    resultContainer: {
      maxHeight: '600px',
      overflowY: 'auto' as const
    }
  };

  // Update endpoint when agent type changes
  useEffect(() => {
    const selectedAgent = agentTypes.find(a => a.value === formData.agent_type);
    if (selectedAgent && selectedAgent.endpoint) {
      setFormData(prev => ({ ...prev, agent_endpoint: selectedAgent.endpoint }));
    }
  }, [formData.agent_type]);

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <h2 style={styles.title}>Configure Test</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Agent Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g., My GPT Agent"
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Agent Type</label>
            <select
              style={styles.select}
              value={formData.agent_type}
              onChange={(e) => setFormData({ ...formData, agent_type: e.target.value })}
            >
              {agentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Endpoint</label>
            <input
              style={styles.input}
              type="text"
              placeholder="https://api.example.com/endpoint"
              value={formData.agent_endpoint}
              onChange={(e) => setFormData({ ...formData, agent_endpoint: e.target.value })}
              required={formData.agent_type === 'custom'}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Key</label>
            <input
              style={styles.input}
              type="password"
              placeholder="sk-..."
              value={formData.agent_api_key}
              onChange={(e) => setFormData({ ...formData, agent_api_key: e.target.value })}
              required={formData.agent_type !== 'custom'}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Task Type</label>
            <select
              style={styles.select}
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
            >
              {taskTypes.map(task => (
                <option key={task.value} value={task.value}>
                  {task.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Test Input</label>
            <textarea
              style={styles.textarea}
              placeholder={
                formData.task_type === 'idea_generation' ? 'Enter a topic for idea generation...' :
                formData.task_type === 'proposal_writing' ? 'Enter a research topic for proposal...' :
                formData.task_type === 'code_generation' ? 'Describe what code to generate...' :
                'Enter your test input...'
              }
              value={formData.test_input}
              onChange={(e) => setFormData({ ...formData, test_input: e.target.value })}
              required
            />
          </div>

          <button
            style={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Testing Agent...' : 'Run Test'}
          </button>
        </form>
      </div>

      <div style={styles.panel}>
        <h2 style={styles.title}>Test Results</h2>
        <div style={styles.resultContainer}>
          {result ? (
            <AnalysisDisplay result={result} />
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
              Configure and run a test to see results here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Analysis Display Component
function AnalysisDisplay({ result }: { result: any }) {
  const analysis = result.analysis;
  
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.5rem'
    },
    scoreSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem'
    },
    scoreCard: {
      padding: '1rem',
      background: '#f8fafc',
      borderRadius: '0.5rem',
      textAlign: 'center' as const
    },
    scoreLabel: {
      fontSize: '0.75rem',
      color: '#64748b',
      marginBottom: '0.25rem'
    },
    scoreValue: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#0f172a'
    },
    gradeCard: {
      padding: '1.5rem',
      background: analysis.grade === 'A' ? '#10b981' :
                  analysis.grade === 'B' ? '#3b82f6' :
                  analysis.grade === 'C' ? '#f59e0b' :
                  analysis.grade === 'D' ? '#f97316' :
                  '#ef4444',
      color: '#ffffff',
      borderRadius: '0.5rem',
      textAlign: 'center' as const
    },
    grade: {
      fontSize: '3rem',
      fontWeight: '700'
    },
    gradeLabel: {
      fontSize: '0.875rem',
      opacity: 0.9
    },
    detailSection: {
      padding: '1rem',
      background: '#f8fafc',
      borderRadius: '0.5rem'
    },
    detailTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '0.75rem'
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.5rem',
      fontSize: '0.875rem'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between'
    },
    detailLabel: {
      color: '#64748b'
    },
    detailValue: {
      color: '#0f172a',
      fontWeight: '500'
    },
    list: {
      margin: 0,
      paddingLeft: '1.25rem',
      fontSize: '0.875rem',
      color: '#475569'
    },
    responseSection: {
      padding: '1rem',
      background: '#f1f5f9',
      borderRadius: '0.5rem'
    },
    responseTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '0.75rem'
    },
    responseText: {
      fontSize: '0.875rem',
      color: '#475569',
      whiteSpace: 'pre-wrap' as const,
      maxHeight: '200px',
      overflow: 'auto'
    }
  };

  return (
    <div style={styles.container}>
      {/* Grade Display */}
      <div style={styles.gradeCard}>
        <div style={styles.grade}>{analysis.grade}</div>
        <div style={styles.gradeLabel}>Overall Grade</div>
      </div>

      {/* Score Cards */}
      <div style={styles.scoreSection}>
        <div style={styles.scoreCard}>
          <div style={styles.scoreLabel}>Overall Score</div>
          <div style={styles.scoreValue}>{analysis.overall_score}</div>
        </div>
        <div style={styles.scoreCard}>
          <div style={styles.scoreLabel}>Execution Time</div>
          <div style={styles.scoreValue}>{result.execution_time?.toFixed(2)}s</div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div style={styles.detailSection}>
        <div style={styles.detailTitle}>Detailed Scores</div>
        <div style={styles.detailGrid}>
          {Object.entries(analysis.detailed_scores).map(([key, value]: [string, any]) => (
            <div key={key} style={styles.detailRow}>
              <span style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span style={styles.detailValue}>{value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div style={styles.detailSection}>
          <div style={styles.detailTitle}>Strengths</div>
          <ul style={styles.list}>
            {analysis.strengths.map((strength: string, idx: number) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <div style={styles.detailSection}>
          <div style={styles.detailTitle}>Areas for Improvement</div>
          <ul style={styles.list}>
            {analysis.weaknesses.map((weakness: string, idx: number) => (
              <li key={idx}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div style={styles.detailSection}>
          <div style={styles.detailTitle}>Recommendations</div>
          <ul style={styles.list}>
            {analysis.recommendations.map((rec: string, idx: number) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Response Preview */}
      <div style={styles.responseSection}>
        <div style={styles.responseTitle}>Agent Response Preview</div>
        <div style={styles.responseText}>
          {result.agent_response?.substring(0, 500)}
          {result.agent_response?.length > 500 && '...'}
        </div>
      </div>
    </div>
  );
}

// Results View Component
function ResultsView({ results }: { results: any[] }) {
  const styles = {
    container: {
      background: '#ffffff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#0f172a'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    th: {
      textAlign: 'left' as const,
      padding: '0.75rem',
      borderBottom: '2px solid #e2e8f0',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#475569'
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '0.875rem',
      color: '#0f172a'
    },
    badge: (grade: string) => ({
      display: 'inline-block',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: grade === 'A' ? '#dcfce7' :
                  grade === 'B' ? '#dbeafe' :
                  grade === 'C' ? '#fed7aa' :
                  grade === 'D' ? '#fed7aa' :
                  '#fee2e2',
      color: grade === 'A' ? '#166534' :
             grade === 'B' ? '#1e40af' :
             grade === 'C' ? '#ea580c' :
             grade === 'D' ? '#ea580c' :
             '#dc2626'
    }),
    noData: {
      textAlign: 'center' as const,
      padding: '3rem',
      color: '#94a3b8'
    }
  };

  if (results.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Test Results</h2>
        <div style={styles.noData}>No test results yet. Run a test to see results here.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Test Results</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Agent Name</th>
            <th style={styles.th}>Task Type</th>
            <th style={styles.th}>Score</th>
            <th style={styles.th}>Grade</th>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => (
            <tr key={idx}>
              <td style={styles.td}>{result.agent_name}</td>
              <td style={styles.td}>{result.task_type?.replace('_', ' ')}</td>
              <td style={styles.td}>
                {result.success ? result.analysis?.overall_score : '-'}
              </td>
              <td style={styles.td}>
                {result.success && (
                  <span style={styles.badge(result.analysis?.grade)}>
                    {result.analysis?.grade}
                  </span>
                )}
              </td>
              <td style={styles.td}>
                {result.execution_time ? `${result.execution_time.toFixed(2)}s` : '-'}
              </td>
              <td style={styles.td}>
                {result.success ? 
                  <span style={{ color: '#10b981' }}>Success</span> : 
                  <span style={{ color: '#ef4444' }}>Failed</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Comparison View Component
function ComparisonView({ agents }: { agents: any[] }) {
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/comparison');
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
    }
  };

  const styles = {
    container: {
      background: '#ffffff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#0f172a'
    },
    bestPerformer: {
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: '#ffffff',
      borderRadius: '0.5rem',
      marginBottom: '1.5rem',
      textAlign: 'center' as const
    },
    bestTitle: {
      fontSize: '0.875rem',
      opacity: 0.9,
      marginBottom: '0.5rem'
    },
    bestName: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '0.5rem'
    },
    bestScore: {
      fontSize: '2rem',
      fontWeight: '700'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    th: {
      textAlign: 'left' as const,
      padding: '0.75rem',
      borderBottom: '2px solid #e2e8f0',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#475569'
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '0.875rem',
      color: '#0f172a'
    },
    noData: {
      textAlign: 'center' as const,
      padding: '3rem',
      color: '#94a3b8'
    }
  };

  if (!comparison || comparison.agents_tested === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Agent Comparison</h2>
        <div style={styles.noData}>No agents tested yet. Run tests to see comparison.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Agent Comparison</h2>
      
      {comparison.best_performer && (
        <div style={styles.bestPerformer}>
          <div style={styles.bestTitle}>Best Performing Agent</div>
          <div style={styles.bestName}>{comparison.best_performer.agent_name}</div>
          <div style={styles.bestScore}>{comparison.best_performer.average_score}</div>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Agent Name</th>
            <th style={styles.th}>Tests</th>
            <th style={styles.th}>Avg Score</th>
            <th style={styles.th}>Best Score</th>
            <th style={styles.th}>Worst Score</th>
            <th style={styles.th}>Consistency</th>
          </tr>
        </thead>
        <tbody>
          {comparison.comparison.map((agent: any, idx: number) => (
            <tr key={idx}>
              <td style={styles.td}>{idx + 1}</td>
              <td style={styles.td}>{agent.agent_name}</td>
              <td style={styles.td}>{agent.total_tests}</td>
              <td style={styles.td}>{agent.average_score}</td>
              <td style={styles.td}>{agent.best_score}</td>
              <td style={styles.td}>{agent.worst_score}</td>
              <td style={styles.td}>{agent.consistency}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Dashboard Component
function Dashboard({ metrics, agents }: { metrics: any; agents: any[] }) {
  const styles = {
    container: {
      display: 'grid',
      gap: '1.5rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    },
    statCard: {
      background: '#ffffff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#64748b',
      marginBottom: '0.5rem'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#0f172a'
    },
    agentList: {
      background: '#ffffff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#0f172a'
    },
    agentCard: {
      padding: '1rem',
      background: '#f8fafc',
      borderRadius: '0.5rem',
      marginBottom: '0.75rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    agentName: {
      fontWeight: '500',
      color: '#0f172a'
    },
    agentStats: {
      display: 'flex',
      gap: '1.5rem',
      fontSize: '0.875rem',
      color: '#64748b'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Tests</div>
          <div style={styles.statValue}>{metrics?.total_tests || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Success Rate</div>
          <div style={styles.statValue}>{metrics?.success_rate || 0}%</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Agents Tested</div>
          <div style={styles.statValue}>{metrics?.agents_tested || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Failed Tests</div>
          <div style={styles.statValue}>{metrics?.failed_tests || 0}</div>
        </div>
      </div>

      <div style={styles.agentList}>
        <h2 style={styles.title}>Tested Agents</h2>
        {agents.length > 0 ? (
          agents.map((agent, idx) => (
            <div key={idx} style={styles.agentCard}>
              <span style={styles.agentName}>{agent.agent_name}</span>
              <div style={styles.agentStats}>
                <span>Tests: {agent.total_tests}</span>
                <span>Avg Score: {agent.average_score}</span>
                <span>Grade: {agent.grade}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            No agents tested yet
          </div>
        )}
      </div>
    </div>
  );
}
