import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, BarChart3, Target, Award, Brain } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Message } from '../types';
import { dbService } from '../services/database';

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  recentTrend: number[];
  improvementRate: number;
}

export const LearningPanel: React.FC = () => {
  const [stats, setStats] = useState<RatingStats>({
    totalRatings: 0,
    averageRating: 0,
    ratingDistribution: {},
    recentTrend: [],
    improvementRate: 0
  });
  const [ratedMessages, setRatedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLearningData();
    
    const interval = setInterval(loadLearningData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadLearningData = async () => {
    try {
      const responses = await dbService.getRatedResponses();
      setRatedMessages(responses);
      
      if (responses.length > 0) {
        const ratings = responses.map(msg => msg.rating!).filter(rating => rating !== undefined);
        
        // Calculate basic stats
        const totalRatings = ratings.length;
        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;
        
        // Rating distribution
        const distribution: { [key: number]: number } = {};
        for (let i = 0.5; i <= 5; i += 0.5) {
          distribution[i] = ratings.filter(r => r === i).length;
        }
        
        // Recent trend (last 10 ratings)
        const recentRatings = ratings.slice(-10);
        
        // Improvement rate (compare first half vs second half)
        const midpoint = Math.floor(ratings.length / 2);
        const firstHalf = ratings.slice(0, midpoint);
        const secondHalf = ratings.slice(midpoint);
        
        const firstHalfAvg = firstHalf.length > 0 ? 
          firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length : 0;
        const secondHalfAvg = secondHalf.length > 0 ? 
          secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length : 0;
        
        const improvementRate = firstHalf.length > 0 && secondHalf.length > 0 ? 
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
        
        setStats({
          totalRatings,
          averageRating,
          ratingDistribution: distribution,
          recentTrend: recentRatings,
          improvementRate
        });
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImprovementColor = (rate: number) => {
    if (rate > 5) return 'text-green-600';
    if (rate > 0) return 'text-blue-600';
    if (rate > -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImprovementIcon = (rate: number) => {
    if (rate > 5) return <TrendingUp className="text-green-600\" size={16} />;
    if (rate > 0) return <TrendingUp className="text-blue-600\" size={16} />;
    return <BarChart3 className="text-yellow-600" size={16} />;
  };

  const renderRatingBar = (rating: number, count: number, maxCount: number) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    
    return (
      <div key={rating} className="flex items-center space-x-3 mb-2">
        <div className="flex items-center space-x-1 w-12">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium">{rating}</span>
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Brain size={48} className="mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className="text-blue-600">Loading learning analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <h2 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
          <TrendingUp size={20} className="mr-2" />
          Reinforcement Learning
        </h2>
        <p className="text-sm text-blue-600">
          Track how the AI improves through user feedback
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {stats.totalRatings === 0 ? (
          <div className="text-center text-blue-500 mt-8">
            <Award size={48} className="mx-auto mb-4 text-blue-300" />
            <p>No ratings yet</p>
            <p className="text-xs mt-2">Start rating responses to see learning analytics</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Average Rating</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.averageRating.toFixed(1)}
                    </p>
                  </div>
                  <Star className="text-blue-500 fill-blue-500" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-100 to-cyan-200 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-700">Total Ratings</p>
                    <p className="text-2xl font-bold text-cyan-900">{stats.totalRatings}</p>
                  </div>
                  <Target className="text-cyan-500" size={24} />
                </div>
              </div>
            </div>

            {/* Improvement Rate */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-blue-800">Learning Progress</h3>
                {getImprovementIcon(stats.improvementRate)}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold ${getImprovementColor(stats.improvementRate)}`}>
                  {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate.toFixed(1)}%
                </span>
                <span className="text-sm text-blue-600">
                  {stats.improvementRate > 0 ? 'improvement' : stats.improvementRate < 0 ? 'decline' : 'stable'}
                </span>
              </div>
              <p className="text-xs text-blue-500 mt-1">
                Comparing first half vs second half of all ratings
              </p>
            </div>

            {/* Rating Distribution */}
            <div>
              <h3 className="font-medium text-blue-800 mb-3">Rating Distribution</h3>
              <div className="space-y-1">
                {Object.entries(stats.ratingDistribution)
                  .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                  .map(([rating, count]) => {
                    const maxCount = Math.max(...Object.values(stats.ratingDistribution));
                    return renderRatingBar(parseFloat(rating), count, maxCount);
                  })}
              </div>
            </div>

            {/* Recent Trend */}
            {stats.recentTrend.length > 0 && (
              <div>
               <h3 className="font-medium text-blue-800 mb-3">Recent Ratings Trend</h3>
               <div className="flex items-end space-x-1 h-20 bg-blue-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                  {stats.recentTrend.map((rating, index) => {
                    const height = (rating / 5) * 100;
                    return (
                      <div
                        key={index}
                       className="flex-1 bg-gradient-to-t from-blue-400 to-blue-300 rounded-sm min-w-0 relative group"
                        style={{ height: `${height}%` }}
                      >
                       <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {rating}
                        </div>
                      </div>
                    );
                  })}
                </div>
               <p className="text-xs text-blue-500 mt-2">
                  Last {stats.recentTrend.length} ratings (hover to see values)
                </p>
              </div>
            )}

            {/* Recent Rated Messages */}
            <div>
             <h3 className="font-medium text-blue-800 mb-3">Recent Rated Responses</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {ratedMessages
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 5)
                  .map((message) => (
                   <div key={message.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < Math.floor(message.rating!)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : i === Math.floor(message.rating!) && message.rating! % 1 !== 0
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                          <span className="text-sm font-medium ml-2">{message.rating}</span>
                        </div>
                       <span className="text-xs text-blue-500">
                          {message.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                     <div className="text-sm text-blue-700 line-clamp-2">
                        <MarkdownRenderer 
                          content={message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')} 
                          className="prose-sm"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};