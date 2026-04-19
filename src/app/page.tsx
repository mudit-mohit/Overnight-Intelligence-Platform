'use client';

import React, { useState, useEffect } from 'react';
import SiteMap from '@/components/SiteMap';
import DronePatrolSimulation from '@/components/DronePatrolSimulation';
import EventReviewPanel from '@/components/EventReviewPanel';
import MorningBriefing from '@/components/MorningBriefing';
import { overnightEvents, siteLocations, Event } from '@/data/simulatedEvents';
import { RealAIInvestigator, AIInvestigationStep } from '@/lib/realAgent';

export default function Home() {
  const [events, setEvents] = useState<Event[]>(overnightEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [investigationResults, setInvestigationResults] = useState<any>(null);
  const [aiSteps, setAiSteps] = useState<AIInvestigationStep[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'briefing'>('overview');

  const investigator = new RealAIInvestigator();

  useEffect(() => {
    // Auto-start investigation on load
    runInvestigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runInvestigation = async () => {
    setIsInvestigating(true);
    setAiSteps([]);
    
    const { results, steps } = await investigator.investigate(events, siteLocations);
    
    // Update events with AI assessments
    const updatedEvents = events.map(event => {
      const assessment = results.eventAssessments.find((a: any) => a.eventId === event.id);
      if (assessment) {
        return { ...event, aiAssessment: assessment.assessment };
      }
      return event;
    });
    
    setEvents(updatedEvents);
    setInvestigationResults(results);
    setAiSteps(steps);
    setIsInvestigating(false);
  };

  const handleEventUpdate = (eventId: string, review: Event['humanReview']) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, humanReview: review } : e
    ));
  };

  const handlePatrolComplete = (patrolId: string, findings: string) => {
    // Could add logic to record patrol results
    console.log(`Patrol ${patrolId} complete: ${findings}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Overnight Intelligence Platform</h1>
              <p className="text-sm text-zinc-400 mt-1">Ridgeway Site • 6:10 AM Review</p>
            </div>
            <div className="flex items-center gap-4">
              {isInvestigating ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-sm">AI Investigating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm">Investigation Complete</span>
                </div>
              )}
              <button
                onClick={runInvestigation}
                disabled={isInvestigating}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors disabled:opacity-50"
              >
                Re-run AI
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview & Map
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'review'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Event Review
            {events.filter(e => !e.humanReview?.status).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                {events.filter(e => !e.humanReview?.status).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('briefing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'briefing'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Morning Briefing
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Reasoning Panel */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-zinc-100">AI Reasoning Process</h3>
                <div className="text-xs text-zinc-500">
                  {aiSteps.length} steps
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {aiSteps.length === 0 && isInvestigating && (
                  <div className="text-sm text-zinc-400">AI is thinking...</div>
                )}
                {aiSteps.map((step, i) => (
                  <div key={i} className="text-sm">
                    {step.type === 'thought' && (
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400">💭</span>
                        <span className="text-zinc-300">{step.content}</span>
                      </div>
                    )}
                    {step.type === 'tool_call' && (
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">🔧</span>
                        <div className="flex-1">
                          <div className="text-zinc-300">{step.content}</div>
                          <div className="text-xs text-zinc-500 mt-1">
                            Tool: {step.toolCall?.toolName}
                          </div>
                        </div>
                      </div>
                    )}
                    {step.type === 'conclusion' && (
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400">✓</span>
                        <span className="text-zinc-300">{step.content}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            {investigationResults && (
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">AI Investigation Summary</h3>
                <p className="text-sm text-zinc-300">{investigationResults.summary}</p>
                {investigationResults.patterns.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="text-sm font-medium text-zinc-200 mb-2">Patterns Detected:</div>
                    <div className="space-y-1">
                      {investigationResults.patterns.map((pattern: any, i: number) => (
                        <div key={i} className="text-xs text-zinc-400">
                          • {pattern.type}: {pattern.description} (confidence: {Math.round(pattern.confidence * 100)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map and Drone Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SiteMap
                  locations={siteLocations}
                  events={events}
                  selectedEvent={selectedEvent}
                  onEventSelect={setSelectedEvent}
                />
              </div>
              <div>
                <DronePatrolSimulation
                  events={events}
                  onPatrolComplete={handlePatrolComplete}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 text-center">
                <div className="text-3xl font-bold text-zinc-200">{events.length}</div>
                <div className="text-xs text-zinc-400 mt-1">Total Events</div>
              </div>
              <div className="bg-red-900/20 rounded-lg border border-red-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-red-400">
                  {events.filter(e => e.aiAssessment?.riskLevel === 'escalation').length}
                </div>
                <div className="text-xs text-zinc-400 mt-1">Escalation</div>
              </div>
              <div className="bg-amber-900/20 rounded-lg border border-amber-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">
                  {events.filter(e => e.aiAssessment?.riskLevel === 'uncertain').length}
                </div>
                <div className="text-xs text-zinc-400 mt-1">Uncertain</div>
              </div>
              <div className="bg-green-900/20 rounded-lg border border-green-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {events.filter(e => e.aiAssessment?.riskLevel === 'harmless').length}
                </div>
                <div className="text-xs text-zinc-400 mt-1">Harmless</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventReviewPanel
              events={events}
              onEventUpdate={handleEventUpdate}
            />
            <div>
              {selectedEvent ? (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">Selected Event Context</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-zinc-400">Description:</span>
                      <span className="text-zinc-200 ml-2">{selectedEvent.description}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Location:</span>
                      <span className="text-zinc-200 ml-2">{selectedEvent.location.name}</span>
                      {selectedEvent.location.restricted && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                          Restricted
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-400">Time:</span>
                      <span className="text-zinc-200 ml-2">{selectedEvent.timestamp.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Confidence:</span>
                      <span className="text-zinc-200 ml-2">{Math.round(selectedEvent.confidence * 100)}%</span>
                    </div>
                    {selectedEvent.relatedEventIds && selectedEvent.relatedEventIds.length > 0 && (
                      <div>
                        <span className="text-zinc-400">Related Events:</span>
                        <div className="mt-1 space-y-1">
                          {selectedEvent.relatedEventIds.map(id => {
                            const related = events.find(e => e.id === id);
                            return related ? (
                              <div key={id} className="text-zinc-300 ml-2">
                                • {related.description}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
                  <div className="text-zinc-400">Select an event from the review panel to view details</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'briefing' && (
          <MorningBriefing
            events={events}
            investigationResults={investigationResults}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-500">
          Overnight Intelligence Platform v1.0 • Built for Ridgeway Site Operations
        </div>
      </footer>
    </div>
  );
}
