import { Event, SiteLocation } from '@/data/simulatedEvents';

// Tool implementations
const toolImplementations = {
  gather_event_context: async (params: { eventId: string }, events: Event[], locations: SiteLocation[]) => {
    const event = events.find((e: Event) => e.id === params.eventId);
    if (!event) return { error: 'Event not found' };

    const location = locations.find((l: SiteLocation) => l.id === event.location.id);
    const relatedEvents = events.filter((e: Event) => 
      event.relatedEventIds?.includes(e.id) || 
      e.relatedEventIds?.includes(params.eventId) ||
      (e.location.id === event.location.id && Math.abs(e.timestamp.getTime() - event.timestamp.getTime()) < 3600000)
    );

    const nearbyEvents = events.filter((e: Event) => {
      const dist = Math.sqrt(
        Math.pow(e.location.x - event.location.x, 2) + 
        Math.pow(e.location.y - event.location.y, 2)
      );
      return dist < 150 && e.id !== params.eventId;
    });

    return {
      event: {
        id: event.id,
        type: event.type,
        description: event.description,
        timestamp: event.timestamp.toISOString(),
        severity: event.severity,
        confidence: event.confidence,
      },
      location: {
        id: location?.id,
        name: location?.name,
        type: location?.type,
        restricted: location?.restricted,
      },
      relatedEvents: relatedEvents.map(e => ({
        id: e.id,
        type: e.type,
        description: e.description,
        timestamp: e.timestamp.toISOString(),
      })),
      nearbyEvents: nearbyEvents.map(e => ({
        id: e.id,
        type: e.type,
        description: e.description,
        timestamp: e.timestamp.toISOString(),
      })),
      summary: `Event at ${location?.name || 'unknown'} (${location?.type || 'unknown'}${location?.restricted ? ', restricted' : ''}). ` +
        `Found ${relatedEvents.length} directly related events and ${nearbyEvents.length} nearby events.`
    };
  },

  analyze_patterns: async (params: {}, events: Event[]) => {
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
          eventIds: badgeSwipes.map(e => e.id),
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
        eventIds: restrictedAreaEvents.map(e => e.id),
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
          eventIds: [sortedEvents[i].id, sortedEvents[i + 1].id],
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
        eventIds: unpatrolledHighSeverityEvents.map(e => e.id),
      });
    }

    return {
      patterns,
      summary: `Detected ${patterns.length} pattern(s) across ${events.length} events.`
    };
  },

  evaluate_event_risk: async (params: { eventId: string; context: string; patterns?: string }, events: Event[]) => {
    const event = events.find((e: Event) => e.id === params.eventId);
    if (!event) return { error: 'Event not found' };

    // Check if API key is likely configured
    // If using fallback mode, skip API call entirely
    const usingFallback = false; 
    
    if (!usingFallback) {
      try {
        // Call API route for Groq evaluation
        const response = await fetch('/api/evaluate-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: {
              description: event.description,
              type: event.type,
              location: event.location,
              severity: event.severity,
              timestamp: event.timestamp.toISOString(),
              confidence: event.confidence,
            },
            context: params.context,
            patterns: params.patterns,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error === 'Groq API key not configured') {
            console.log('Groq API key not configured, using fallback logic');
          } else {
            throw new Error(`API call failed: ${response.statusText}`);
          }
        } else {
          const result = await response.json();
          return {
            riskLevel: result.riskLevel || 'uncertain',
            reasoning: result.reasoning || 'AI evaluation completed',
            requiresFollowUp: result.requiresFollowUp !== false,
            suggestedAction: result.suggestedAction,
            confidence: event.confidence,
          };
        }
      } catch (error) {
        console.error('AI evaluation error:', error);
      }
    }
    
    // Fallback to basic logic
    let riskLevel: 'harmless' | 'uncertain' | 'escalation' = 'uncertain';
    let reasoning = 'Using basic rule-based assessment (Groq API not configured)';
    
    // Check drone patrol first
    if (event.type === 'drone_patrol') {
      riskLevel = 'harmless';
      reasoning = 'Routine drone patrol activity';
    }
    // Check high severity
    else if (event.severity === 'high') {
      riskLevel = 'escalation';
      reasoning = 'High severity event detected';
    }
    // Check fence alert
    else if (event.type === 'fence_alert' && event.details?.intensity === 'low') {
      riskLevel = 'harmless';
      reasoning = 'Low-intensity fence alert likely environmental';
    }
    // Check badge swipes
    else if (event.type === 'badge_swipe' && event.details?.attempts >= 3) {
      riskLevel = 'escalation';
      reasoning = 'Multiple failed access attempts';
    }
    // Check restricted area
    else if (event.location.restricted) {
      riskLevel = 'uncertain';
      reasoning = 'Event in restricted area requires review';
    }
    
    const requiresFollowUp = riskLevel !== 'harmless';
    const suggestedAction = riskLevel === 'escalation' ? 'Immediate review required' : 
                          riskLevel === 'uncertain' ? 'Manual review recommended' : undefined;
    
    return {
      riskLevel,
      reasoning,
      requiresFollowUp,
      suggestedAction,
      confidence: event.confidence,
    };
  },
};

export interface AIToolCall {
  toolName: string;
  parameters: any;
  result: any;
  timestamp: Date;
}

export interface AIInvestigationStep {
  type: 'thought' | 'tool_call' | 'conclusion';
  content: string;
  toolCall?: AIToolCall;
  timestamp: Date;
}

export class RealAIInvestigator {
  private events: Event[];
  private locations: SiteLocation[];
  private steps: AIInvestigationStep[] = [];

  constructor() {
    this.events = [];
    this.locations = [];
  }

  private addStep(type: AIInvestigationStep['type'], content: string, toolCall?: AIToolCall) {
    this.steps.push({
      type,
      content,
      toolCall,
      timestamp: new Date(),
    });
  }

  async investigate(events: Event[], locations: SiteLocation[]): Promise<{
    results: any;
    steps: AIInvestigationStep[];
  }> {
    this.events = events;
    this.locations = locations;
    this.steps = [];

    try {
      this.addStep('thought', 'Starting investigation of overnight events...');

      // Step 1: Analyze patterns
      this.addStep('thought', 'First, I should analyze patterns across all events to understand the big picture.');
      
      const patternResult = await toolImplementations.analyze_patterns({}, events);
      this.addStep('tool_call', 'Analyzing patterns across all events', {
        toolName: 'analyze_patterns',
        parameters: {},
        result: patternResult,
        timestamp: new Date(),
      });

      // Step 2: Evaluate each event
      const eventAssessments: any[] = [];
      
      for (const event of events) {
        this.addStep('thought', `Investigating event: ${event.description}`);
        
        // Gather context
        const contextResult = await toolImplementations.gather_event_context(
          { eventId: event.id },
          events,
          locations
        );
        this.addStep('tool_call', `Gathering context for event ${event.id}`, {
          toolName: 'gather_event_context',
          parameters: { eventId: event.id },
          result: contextResult,
          timestamp: new Date(),
        });

        // Evaluate risk
        const riskParams: { eventId: string; context: string; patterns?: string } = {
          eventId: event.id,
          context: contextResult.summary || 'No context available',
        };
        if (patternResult.summary) {
          riskParams.patterns = patternResult.summary;
        }
        const riskResult = await toolImplementations.evaluate_event_risk(riskParams, events);
        this.addStep('tool_call', `Evaluating risk for event ${event.id}`, {
          toolName: 'evaluate_event_risk',
          parameters: { eventId: event.id, context: contextResult.summary || 'No context' },
          result: riskResult,
          timestamp: new Date(),
        });

        eventAssessments.push({
          eventId: event.id,
          assessment: riskResult,
        });

        this.addStep('conclusion', `Event ${event.id} assessed as ${riskResult.riskLevel}: ${riskResult.reasoning}`);
      }

      // Final summary
      const escalationCount = eventAssessments.filter((a: any) => a.assessment.riskLevel === 'escalation').length;
      const uncertainCount = eventAssessments.filter((a: any) => a.assessment.riskLevel === 'uncertain').length;
      const harmlessCount = eventAssessments.filter((a: any) => a.assessment.riskLevel === 'harmless').length;

      this.addStep('thought', `Investigation complete. ${escalationCount} events require escalation, ${uncertainCount} are uncertain, ${harmlessCount} are harmless.`);

      return {
        results: {
          eventAssessments,
          patterns: patternResult.patterns,
          summary: `Analyzed ${events.length} events. ${escalationCount} require escalation, ${uncertainCount} need follow-up, ${harmlessCount} are harmless.`
        },
        steps: this.steps,
      };

    } catch (error) {
      console.error('AI investigation error:', error);
      this.addStep('thought', `Error during investigation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to basic analysis
      return this.fallbackAnalysis(events);
    }
  }

  private fallbackAnalysis(events: Event[]): {
    results: any;
    steps: AIInvestigationStep[];
  } {
    this.steps = [];
    this.addStep('thought', 'AI service unavailable. Using fallback analysis...');

    const eventAssessments = events.map(event => ({
      eventId: event.id,
      assessment: {
        riskLevel: event.severity === 'high' ? 'escalation' : 'uncertain',
        reasoning: 'Basic severity-based assessment (AI unavailable)',
        requiresFollowUp: true,
        confidence: event.confidence,
      },
    }));

    return {
      results: {
        eventAssessments,
        patterns: [],
        summary: `Fallback analysis of ${events.length} events. AI service unavailable.`
      },
      steps: this.steps,
    };
  }

  getSteps(): AIInvestigationStep[] {
    return this.steps;
  }
}
