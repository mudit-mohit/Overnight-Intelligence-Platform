'use client';

import React, { useState } from 'react';
import { Event } from '@/data/simulatedEvents';
import { cn } from '@/lib/utils';

interface EventReviewPanelProps {
  events: Event[];
  onEventUpdate: (eventId: string, review: Event['humanReview']) => void;
}

export default function EventReviewPanel({ events, onEventUpdate }: EventReviewPanelProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleReviewAction = (action: 'approved' | 'overridden' | 'needs_investigation') => {
    if (!selectedEvent) return;

    onEventUpdate(selectedEvent.id, {
      status: action,
      reviewer: 'Maya',
      notes: reviewNotes,
      timestamp: new Date()
    });

    setReviewNotes('');
    setSelectedEvent(null);
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'escalation': return 'text-red-400';
      case 'uncertain': return 'text-amber-400';
      case 'harmless': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  const getReviewStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'overridden': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'needs_investigation': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const reviewedCount = events.filter(e => e.humanReview?.status).length;
  const totalCount = events.length;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">Event Review</h3>
        <div className="text-sm text-zinc-400">
          {reviewedCount}/{totalCount} reviewed
        </div>
      </div>

      {!selectedEvent ? (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {events.map(event => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                event.humanReview?.status 
                  ? getReviewStatusColor(event.humanReview.status)
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-750"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-200 truncate">{event.description}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {event.timestamp.toLocaleTimeString()} • {event.location.name}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={cn("text-xs font-medium", getRiskColor(event.aiAssessment?.riskLevel))}>
                    {event.aiAssessment?.riskLevel || 'pending'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {Math.round(event.confidence * 100)}% conf
                  </div>
                </div>
              </div>
              {event.humanReview?.status && (
                <div className="mt-2 pt-2 border-t border-current opacity-50">
                  <div className="text-xs">Reviewed by {event.humanReview.reviewer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Event details */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-zinc-200">{selectedEvent.description}</h4>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-zinc-400">Type</div>
                <div className="text-zinc-200">{selectedEvent.type}</div>
              </div>
              <div>
                <div className="text-zinc-400">Severity</div>
                <div className={cn(
                  "capitalize",
                  selectedEvent.severity === 'high' ? 'text-red-400' :
                  selectedEvent.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                )}>
                  {selectedEvent.severity}
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Location</div>
                <div className="text-zinc-200">{selectedEvent.location.name}</div>
              </div>
              <div>
                <div className="text-zinc-400">Time</div>
                <div className="text-zinc-200">{selectedEvent.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>

            {selectedEvent.details && (
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <div className="text-zinc-400 text-sm mb-1">Details</div>
                <pre className="text-xs text-zinc-300 bg-zinc-900 p-2 rounded overflow-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* AI Assessment */}
          {selectedEvent.aiAssessment && (
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <h4 className="font-medium text-zinc-200 mb-2">AI Assessment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Classification:</span>
                  <span className={cn("font-medium", getRiskColor(selectedEvent.aiAssessment.riskLevel))}>
                    {selectedEvent.aiAssessment.riskLevel}
                  </span>
                </div>
                <div className="text-zinc-300">{selectedEvent.aiAssessment.reasoning}</div>
                {selectedEvent.aiAssessment.suggestedAction && (
                  <div className="pt-2 border-t border-zinc-700">
                    <div className="text-zinc-400 mb-1">Suggested Action:</div>
                    <div className="text-zinc-200">{selectedEvent.aiAssessment.suggestedAction}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Review Notes (optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your observations or corrections..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReviewAction('approved')}
                disabled={!!selectedEvent.humanReview?.status}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
              >
                Approve AI
              </button>
              <button
                onClick={() => handleReviewAction('overridden')}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Override
              </button>
              <button
                onClick={() => handleReviewAction('needs_investigation')}
                className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
              >
                Investigate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
