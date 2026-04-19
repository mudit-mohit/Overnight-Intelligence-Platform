'use client';

import React from 'react';
import { Event } from '@/data/simulatedEvents';
import { format } from 'date-fns';

interface MorningBriefingProps {
  events: Event[];
  investigationResults: any;
}

export default function MorningBriefing({ events, investigationResults }: MorningBriefingProps) {
  const escalationEvents = events.filter(e => e.aiAssessment?.riskLevel === 'escalation');
  const uncertainEvents = events.filter(e => e.aiAssessment?.riskLevel === 'uncertain');
  const harmlessEvents = events.filter(e => e.aiAssessment?.riskLevel === 'harmless');
  const reviewedEvents = events.filter(e => e.humanReview?.status);

  const generateBriefing = () => {
    const sections = [];

    // Executive Summary
    sections.push({
      title: 'Executive Summary',
      content: `Overnight review complete. ${events.length} events analyzed between 12:00 AM and 6:00 AM. ` +
        `${escalationEvents.length} require escalation, ${uncertainEvents.length} require follow-up, ` +
        `${harmlessEvents.length} assessed as harmless. ${reviewedEvents.length} events reviewed by operations.`
    });

    // Escalations
    if (escalationEvents.length > 0) {
      sections.push({
        title: '🚨 Requires Escalation',
        content: escalationEvents.map(e => 
          `• ${e.description} at ${e.location.name} (${e.timestamp.toLocaleTimeString()}). ` +
          `AI: ${e.aiAssessment?.reasoning} ` +
          (e.humanReview?.status ? `| Human: ${e.humanReview.status} by ${e.humanReview.reviewer}` : '') +
          (e.humanReview?.notes ? `| Notes: ${e.humanReview.notes}` : '')
        ).join('\n')
      });
    }

    // Follow-up Items
    if (uncertainEvents.length > 0) {
      sections.push({
        title: '⚠️ Requires Follow-up',
        content: uncertainEvents.map(e => 
          `• ${e.description} at ${e.location.name} (${e.timestamp.toLocaleTimeString()}). ` +
          `Action: ${e.aiAssessment?.suggestedAction || 'Manual review required'}` +
          (e.humanReview?.status ? ` | Human: ${e.humanReview.status} by ${e.humanReview.reviewer}` : '') +
          (e.humanReview?.notes ? ` | Notes: ${e.humanReview.notes}` : '')
        ).join('\n')
      });
    }

    // Drone Coverage
    const dronePatrols = events.filter(e => e.type === 'drone_patrol');
    if (dronePatrols.length > 0) {
      sections.push({
        title: '🛸 Drone Patrol Coverage',
        content: dronePatrols.map(e => 
          `• ${e.description} - ${e.details?.findings || 'Routine patrol'}`
        ).join('\n')
      });
    }

    // Patterns Detected
    if (investigationResults?.patterns?.length > 0) {
      sections.push({
        title: '🔍 Patterns Detected',
        content: investigationResults.patterns.map((p: any) => 
          `• ${p.type}: ${p.description} (confidence: ${Math.round(p.confidence * 100)}%)`
        ).join('\n')
      });
    }

    // Harmless Events
    if (harmlessEvents.length > 0) {
      sections.push({
        title: '✅ Assessed as Harmless',
        content: harmlessEvents.map(e => 
          `• ${e.description} at ${e.location.name}. Reason: ${e.aiAssessment?.reasoning}` +
          (e.humanReview?.status ? ` | Human: ${e.humanReview.status} by ${e.humanReview.reviewer}` : '') +
          (e.humanReview?.notes ? ` | Notes: ${e.humanReview.notes}` : '')
        ).join('\n')
      });
    }

    return sections;
  };

  const briefingSections = generateBriefing();

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Morning Briefing</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Prepared for Nisha, Site Head • {format(new Date(), 'MMMM d, yyyy • h:mm a')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
        >
          Print Briefing
        </button>
      </div>

      <div className="space-y-6">
        {briefingSections.map((section, index) => (
          <div key={index} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <h3 className="text-lg font-semibold text-zinc-200 mb-3">{section.title}</h3>
            <div className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 text-center">
          <div className="text-3xl font-bold text-zinc-200">{events.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Total Events</div>
        </div>
        <div className="bg-red-900/20 rounded-lg border border-red-800/50 p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{escalationEvents.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Escalations</div>
        </div>
        <div className="bg-amber-900/20 rounded-lg border border-amber-800/50 p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{uncertainEvents.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Follow-up</div>
        </div>
        <div className="bg-green-900/20 rounded-lg border border-green-800/50 p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{harmlessEvents.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Harmless</div>
        </div>
      </div>

      {/* Approval Status */}
      <div className="mt-6 bg-zinc-800 rounded-lg border border-zinc-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-zinc-200">Briefing Status</h4>
            <p className="text-sm text-zinc-400 mt-1">
              {reviewedEvents.length === events.length 
                ? 'All events reviewed. Ready for presentation.'
                : `${reviewedEvents.length}/${events.length} events reviewed. Complete review before presentation.`
              }
            </p>
          </div>
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              reviewedEvents.length === events.length
                ? 'bg-green-500/20 text-green-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {reviewedEvents.length === events.length ? 'Ready' : 'In Progress'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
