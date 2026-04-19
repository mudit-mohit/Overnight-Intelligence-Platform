import { Event, SiteLocation } from '@/data/simulatedEvents';

// MCP-style tool interface
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

// Tool 1: Event Context Gatherer
export const eventContextGatherer: Tool = {
  name: 'gather_event_context',
  description: 'Gathers detailed context about an event including related events, location details, and temporal patterns',
  parameters: {
    eventId: { type: 'string', description: 'The ID of the event to investigate' },
    allEvents: { type: 'array', description: 'All overnight events' },
    locations: { type: 'array', description: 'Site locations' }
  },
  execute: async ({ eventId, allEvents, locations }) => {
    const event = allEvents.find((e: Event) => e.id === eventId);
    if (!event) return { error: 'Event not found' };

    const location = locations.find((l: SiteLocation) => l.id === event.location.id);
    const relatedEvents = allEvents.filter((e: Event) => 
      event.relatedEventIds?.includes(e.id) || 
      e.relatedEventIds?.includes(eventId) ||
      (e.location.id === event.location.id && Math.abs(e.timestamp.getTime() - event.timestamp.getTime()) < 3600000)
    );

    const nearbyEvents = allEvents.filter((e: Event) => {
      const dist = Math.sqrt(
        Math.pow(e.location.x - event.location.x, 2) + 
        Math.pow(e.location.y - event.location.y, 2)
      );
      return dist < 150 && e.id !== eventId;
    });

    return {
      event,
      location,
      relatedEvents,
      nearbyEvents,
      contextSummary: `Event at ${location?.name} (${location?.type}${location?.restricted ? ', restricted' : ''}). ` +
        `Found ${relatedEvents.length} directly related events and ${nearbyEvents.length} nearby events.`
    };
  }
};

// Tool 2: Pattern Analyzer
export const patternAnalyzer: Tool = {
  name: 'analyze_patterns',
  description: 'Analyzes patterns across multiple events to identify correlations, sequences, or anomalies',
  parameters: {
    events: { type: 'array', description: 'Events to analyze' },
    locations: { type: 'array', description: 'Site locations' }
  },
  execute: async ({ events, locations }) => {
    const patterns = [];

    // Check for repeated failed badge swipes
    const badgeSwipes = events.filter((e: Event) => e.type === 'badge_swipe');
    if (badgeSwipes.length >= 3) {
      const sameLocation = badgeSwipes.every((e: Event) => e.location.id === badgeSwipes[0].location.id);
      if (sameLocation) {
        patterns.push({
          type: 'repeated_access_attempts',
          severity: 'high',
          description: `${badgeSwipes.length} failed badge swipes at ${badgeSwipes[0].location.name}`,
          confidence: 0.9,
          events: badgeSwipes.map((e: Event) => e.id)
        });
      }
    }

    // Check for events near restricted areas
    const restrictedAreaEvents = events.filter((e: Event) => e.location.restricted && e.type !== 'drone_patrol');
    if (restrictedAreaEvents.length > 0) {
      patterns.push({
        type: 'restricted_area_activity',
        severity: 'medium',
        description: `${restrictedAreaEvents.length} events in restricted areas`,
        confidence: 0.7,
        events: restrictedAreaEvents.map((e: Event) => e.id)
      });
    }

    // Check for temporal clustering
    const sortedEvents = [...events].sort((a: Event, b: Event) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const timeDiff = sortedEvents[i + 1].timestamp.getTime() - sortedEvents[i].timestamp.getTime();
      if (timeDiff < 300000) { 
        patterns.push({
          type: 'temporal_cluster',
          severity: 'medium',
          description: `Events clustered within 5 minutes at ${sortedEvents[i].timestamp.toLocaleTimeString()}`,
          confidence: 0.6,
          events: [sortedEvents[i].id, sortedEvents[i + 1].id]
        });
      }
    }

    // Check for drone patrol coverage
    const dronePatrols = events.filter((e: Event) => e.type === 'drone_patrol');
    const patrolledLocations = new Set(dronePatrols.map((e: Event) => e.location.id));
    const unpatrolledHighSeverityEvents = events.filter((e: Event) => 
      e.severity === 'high' && !patrolledLocations.has(e.location.id)
    );
    if (unpatrolledHighSeverityEvents.length > 0) {
      patterns.push({
        type: 'unpatrolled_high_severity',
        severity: 'high',
        description: `${unpatrolledHighSeverityEvents.length} high-severity events not followed by drone patrol`,
        confidence: 0.8,
        events: unpatrolledHighSeverityEvents.map((e: Event) => e.id)
      });
    }

    return { patterns };
  }
};

// Tool 3: Escalation Evaluator
export const escalationEvaluator: Tool = {
  name: 'evaluate_escalation',
  description: 'Evaluates whether an event or pattern requires escalation based on severity, context, and risk factors',
  parameters: {
    event: { type: 'object', description: 'The event to evaluate' },
    context: { type: 'object', description: 'Context from event context gatherer' },
    patterns: { type: 'array', description: 'Patterns from pattern analyzer' }
  },
  execute: async ({ event, context, patterns }) => {
    let riskLevel: 'harmless' | 'uncertain' | 'escalation' = 'harmless';
    let reasoning = '';
    let requiresFollowUp = false;
    let suggestedAction = '';

    // Base severity assessment
    if (event.severity === 'high') {
      riskLevel = 'escalation';
      reasoning += 'High severity event detected. ';
      requiresFollowUp = true;
    }

    // Check for related patterns
    const relatedPatterns = patterns.filter((p: any) => p.events?.includes(event.id));
    if (relatedPatterns.length > 0) {
      riskLevel = 'escalation';
      reasoning += `Part of ${relatedPatterns.length} concerning pattern(s): ${relatedPatterns.map((p: any) => p.type).join(', ')}. `;
      requiresFollowUp = true;
    }

    // Location-based assessment
    if (event.location.restricted) {
      if (riskLevel === 'harmless') {
        riskLevel = 'uncertain';
      }
      reasoning += 'Event in restricted area. ';
      if (event.type !== 'drone_patrol') {
        requiresFollowUp = true;
      }
    }

    // Type-specific assessment
    if (event.type === 'badge_swipe' && event.details?.attempts >= 3) {
      riskLevel = 'escalation';
      reasoning += 'Multiple failed access attempts indicate potential security breach. ';
      suggestedAction = 'Review access logs, verify identity, consider temporary access restriction';
      requiresFollowUp = true;
    }

    if (event.type === 'vehicle_path' && event.location.restricted) {
      riskLevel = 'escalation';
      reasoning += 'Unauthorized vehicle in restricted area. ';
      suggestedAction = 'Review surveillance footage, dispatch security team to investigate';
      requiresFollowUp = true;
    }

    if (event.type === 'fence_alert') {
      if (event.details?.weather === 'windy' && event.details?.intensity === 'low') {
        riskLevel = 'harmless';
        reasoning += 'Low-intensity fence alert during windy conditions likely environmental. ';
      } else {
        riskLevel = 'uncertain';
        reasoning += 'Fence alert requires verification to distinguish environmental from intentional. ';
        requiresFollowUp = true;
      }
    }

    if (event.type === 'drone_patrol') {
      riskLevel = 'harmless';
      reasoning += 'Drone patrol is routine activity. ';
    }

    if (event.type === 'motion_detected' && event.confidence < 0.5) {
      riskLevel = 'harmless';
      reasoning += 'Low confidence motion detection likely false positive. ';
    }

    // Default uncertain
    if (riskLevel === 'uncertain' && !reasoning) {
      reasoning = 'Insufficient context to determine risk level. Manual review recommended.';
      requiresFollowUp = true;
    }

    if (!suggestedAction && requiresFollowUp) {
      suggestedAction = 'Manual review recommended to verify nature of event';
    }

    return {
      riskLevel,
      reasoning,
      requiresFollowUp,
      suggestedAction,
      confidence: event.confidence
    };
  }
};

// AI Agent that decides which tools to use
export class AIInvestigator {
  private tools: Tool[];

  constructor() {
    this.tools = [eventContextGatherer, patternAnalyzer, escalationEvaluator];
  }

  async investigateOvernight(events: Event[], locations: SiteLocation[]): Promise<any> {
    const results = {
      summary: '',
      eventAssessments: [] as any[],
      patterns: [] as any[],
      escalationRequired: [] as string[],
      harmlessEvents: [] as string[],
      uncertainEvents: [] as string[]
    };

    // Step 1: Analyze patterns across all events
    const patternResult = await this.tools[1].execute({ events, locations });
    results.patterns = patternResult.patterns;

    // Step 2: Assess each event
    for (const event of events) {
      // Gather context
      const contextResult = await this.tools[0].execute({ 
        eventId: event.id, 
        allEvents: events, 
        locations 
      });

      // Evaluate escalation
      const escalationResult = await this.tools[2].execute({
        event,
        context: contextResult,
        patterns: patternResult.patterns
      });

      // Attach AI assessment to event
      event.aiAssessment = {
        classification: escalationResult.riskLevel,
        riskLevel: escalationResult.riskLevel,
        reasoning: escalationResult.reasoning,
        requiresFollowUp: escalationResult.requiresFollowUp,
        suggestedAction: escalationResult.suggestedAction
      };

      results.eventAssessments.push({
        eventId: event.id,
        assessment: event.aiAssessment
      });

      // Categorize
      if (escalationResult.riskLevel === 'escalation') {
        results.escalationRequired.push(event.id);
      } else if (escalationResult.riskLevel === 'harmless') {
        results.harmlessEvents.push(event.id);
      } else {
        results.uncertainEvents.push(event.id);
      }
    }

    // Generate summary
    results.summary = `Overnight review complete. Analyzed ${events.length} events. ` +
      `Found ${results.patterns.length} pattern(s). ` +
      `${results.escalationRequired.length} event(s) require escalation, ` +
      `${results.harmlessEvents.length} appear harmless, ` +
      `${results.uncertainEvents.length} require further review.`;

    return results;
  }

  getAvailableTools() {
    return this.tools.map(t => ({
      name: t.name,
      description: t.description
    }));
  }
}
