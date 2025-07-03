import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Agent, BackgroundTask, AgentDailySummary } from '../types';
import { dbService } from '../services/database';
import { MarkdownRenderer } from './MarkdownRenderer';

export const LearningCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dailySummaries, setDailySummaries] = useState<{ [key: string]: AgentDailySummary }>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadDailySummaries();
    }
  }, [selectedAgent, currentDate]);

  const loadAgents = () => {
    const savedAgents = localStorage.getItem('agents');
    if (savedAgents) {
      const allAgents = JSON.parse(savedAgents);
      setAgents(allAgents);
      if (allAgents.length > 0 && !selectedAgent) {
        setSelectedAgent(allAgents[0].id);
      }
    }
  };

  const loadDailySummaries = async () => {
    if (!selectedAgent) return;
    
    setIsLoading(true);
    try {
      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) return;

      const allTasks = await dbService.getBackgroundTasks();
      const agentTasks = allTasks.filter(task => task.agentId === selectedAgent);
      
      // Group tasks by date
      const summariesByDate: { [key: string]: AgentDailySummary } = {};
      
      agentTasks.forEach(task => {
        const dateKey = task.timestamp.toISOString().split('T')[0];
        
        if (!summariesByDate[dateKey]) {
          summariesByDate[dateKey] = {
            agentId: selectedAgent,
            agentName: agent.name,
            date: dateKey,
            totalTasks: 0,
            completedTasks: 0,
            averageRating: 0,
            tasks: [],
            learningInsights: []
          };
        }
        
        const summary = summariesByDate[dateKey];
        summary.totalTasks++;
        summary.tasks.push(task);
        
        if (task.status === 'completed') {
          summary.completedTasks++;
        }
      });
      
      // Calculate averages and insights
      Object.values(summariesByDate).forEach(summary => {
        const ratedTasks = summary.tasks.filter(task => task.rating);
        if (ratedTasks.length > 0) {
          summary.averageRating = ratedTasks.reduce((sum, task) => sum + (task.rating || 0), 0) / ratedTasks.length;
        }
        
        // Generate learning insights
        summary.learningInsights = generateLearningInsights(summary);
      });
      
      setDailySummaries(summariesByDate);
    } catch (error) {
      console.error('Error loading daily summaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLearningInsights = (summary: AgentDailySummary): string[] => {
    const insights: string[] = [];
    
    if (summary.completedTasks === 0) {
      insights.push('No completed tasks - check for configuration issues');
    } else if (summary.completedTasks / summary.totalTasks < 0.5) {
      insights.push('Low completion rate - may need prompt optimization');
    } else if (summary.completedTasks === summary.totalTasks) {
      insights.push('Perfect completion rate - agent performing well');
    }
    
    if (summary.averageRating >= 4) {
      insights.push('High quality outputs - maintain current approach');
    } else if (summary.averageRating <= 2) {
      insights.push('Low ratings - review and improve prompts');
    } else if (summary.averageRating > 0) {
      insights.push('Moderate performance - room for improvement');
    }
    
    const errorTasks = summary.tasks.filter(task => task.status === 'error');
    if (errorTasks.length > 0) {
      insights.push(`${errorTasks.length} errors encountered - investigate common issues`);
    }
    
    return insights;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDayKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getDaySummary = (day: number) => {
    const dayKey = getDayKey(day);
    return dailySummaries[dayKey];
  };

  const getDayClassName = (day: number | null) => {
    if (!day) return 'p-2';
    
    const summary = getDaySummary(day);
    const dayKey = getDayKey(day);
    const isSelected = selectedDay === dayKey;
    
    let className = 'p-2 cursor-pointer rounded-lg transition-all hover:bg-blue-100 ';
    
    if (isSelected) {
      className += 'bg-blue-200 border-2 border-blue-400 ';
    } else if (summary) {
      if (summary.averageRating >= 4) {
        className += 'bg-green-100 border border-green-300 ';
      } else if (summary.averageRating <= 2 && summary.averageRating > 0) {
        className += 'bg-red-100 border border-red-300 ';
      } else if (summary.totalTasks > 0) {
        className += 'bg-yellow-100 border border-yellow-300 ';
      } else {
        className += 'border border-gray-200 ';
      }
    } else {
      className += 'border border-gray-200 ';
    }
    
    return className;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    const dayKey = getDayKey(day);
    setSelectedDay(selectedDay === dayKey ? null : dayKey);
  };

  const selectedDaySummary = selectedDay ? dailySummaries[selectedDay] : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center">
            <Calendar size={20} className="mr-2" />
            Learning Calendar
          </h2>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-sm bg-white shadow-sm"
          >
            <option value="">Select an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-medium text-blue-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {selectedAgent ? (
            <div className="bg-white rounded-lg border border-blue-200 shadow-sm h-full">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 p-4 border-b border-blue-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-blue-700 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 p-4 h-full">
                {getDaysInMonth(currentDate).map((day, index) => (
                  <div
                    key={index}
                    className={getDayClassName(day)}
                    onClick={() => day && handleDayClick(day)}
                  >
                    {day && (
                      <>
                        <div className="text-sm font-medium text-blue-800">{day}</div>
                        {getDaySummary(day) && (
                          <div className="mt-1">
                            <div className="text-xs text-blue-600">
                              {getDaySummary(day)!.totalTasks} tasks
                            </div>
                            {getDaySummary(day)!.averageRating > 0 && (
                              <div className="flex items-center text-xs text-yellow-600">
                                <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1" />
                                {getDaySummary(day)!.averageRating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-blue-500 mt-8">
              <Calendar size={48} className="mx-auto mb-4 text-blue-300" />
              <p>Select an agent to view their learning calendar</p>
            </div>
          )}
        </div>

        {/* Daily Summary Panel */}
        {selectedDaySummary && (
          <div className="w-96 border-l border-blue-200 bg-white overflow-y-auto">
            <div className="p-4 border-b border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-blue-800">
                {selectedDaySummary.agentName} - {new Date(selectedDaySummary.date).toLocaleDateString()}
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700">Total Tasks</div>
                  <div className="text-xl font-bold text-blue-900">{selectedDaySummary.totalTasks}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-700">Completed</div>
                  <div className="text-xl font-bold text-green-900">{selectedDaySummary.completedTasks}</div>
                </div>
              </div>

              {selectedDaySummary.averageRating > 0 && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-700 mb-1">Average Rating</div>
                  <div className="flex items-center">
                    <Star size={16} className="fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-lg font-bold text-yellow-900">
                      {selectedDaySummary.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Learning Insights */}
              {selectedDaySummary.learningInsights.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <TrendingUp size={16} className="mr-1" />
                    Learning Insights
                  </h4>
                  <div className="space-y-2">
                    {selectedDaySummary.learningInsights.map((insight, index) => (
                      <div key={index} className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task List */}
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Tasks</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDaySummary.tasks.map((task) => (
                    <div key={task.id} className="border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {task.status === 'completed' ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : task.status === 'error' ? (
                            <XCircle size={14} className="text-red-500" />
                          ) : (
                            <Clock size={14} className="text-yellow-500" />
                          )}
                          <span className="font-medium text-blue-800 capitalize">{task.status}</span>
                        </div>
                        {task.rating && (
                          <div className="flex items-center space-x-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-blue-600">{task.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-blue-700 mb-2">{task.prompt}</p>
                      {task.result && (
                        <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                          <MarkdownRenderer 
                            content={task.result.substring(0, 150) + (task.result.length > 150 ? '...' : '')}
                            className="prose-xs"
                          />
                        </div>
                      )}
                      {task.error && (
                        <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                          Error: {task.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};