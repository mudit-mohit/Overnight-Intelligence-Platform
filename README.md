# Overnight Intelligence Platform

An AI-first overnight activity review and morning briefing system for Ridgeway Site operations.

## Overview

The Overnight Intelligence Platform helps operations leads (like Maya) review overnight activity and prepare morning briefings before leadership arrives at 8:00 AM. The system uses **real AI** (Groq Llama 3) to investigate events, gather context, identify patterns, and surface what matters most while keeping humans in control of final decisions.

## Real AI Integration

This application uses **actual AI decision-making**, not pre-programmed logic:

- **Groq Llama 3** (free tier) evaluates each event's risk level based on context, patterns, and event details
- **Transparent tool-calling** - The AI's reasoning process is visible in the "AI Reasoning Process" panel
- **Uncertainty surfaced honestly** - The AI expresses when it's uncertain and needs human review
- **Human-in-the-loop** - All AI decisions can be inspected, overridden, or refined by humans

### Setting Up Groq API Key (Free)

To enable real AI functionality with Groq's free tier:

1. Create a Groq account at https://console.groq.com/
2. Generate an API key at https://console.groq.com/keys
3. Add API key to `.env.local`:
   
   ```
   GROQ_API_KEY=gsk_-actual-groq-api-key-here
   ```
5. Change `usingFallback` to `false` in `src/lib/realAgent.ts` (line 129):
   ```typescript
   const usingFallback = false;
   ```
6. Restart the development server

**Without an API key or with `usingFallback = true`**, the application uses rule-based assessment and will show "Using basic rule-based assessment" in the reasoning panel.

## Features

### AI-First Workflow
- **Automated Investigation**: The system automatically investigates overnight events using an AI agent
- **Tool-Calling Architecture**: MCP-style interface with three specialized tools:
  - Event Context Gatherer: Collects related events, location details, and temporal patterns
  - Pattern Analyzer: Identifies correlations, sequences, and anomalies across events
  - Escalation Evaluator: Determines risk levels and recommended actions
- **Confidence Scoring**: Every assessment includes confidence levels to surface uncertainty

### Interactive Site Map
- **Spatial Visualization**: SVG-based map showing all site locations (gates, storage yards, access points, work zones, perimeters)
- **Event Overlay**: Events plotted on the map with severity-based color coding
- **Drone Routes**: Visual representation of patrol routes
- **Interactive Selection**: Click events or locations to view details

### Drone Patrol Simulation
- **Route Selection**: Choose between predefined patrol routes
- **Real-time Progress**: Animated patrol with waypoint tracking
- **Findings Generation**: Automatic reporting of events encountered during patrol
- **Coverage Analysis**: Identifies high-severity events not followed by drone patrol

### Human Review Interface
- **Event Inspection**: Detailed view of each event with AI assessment
- **Override Capability**: Humans can approve, override, or flag events for investigation
- **Review Notes**: Add context and corrections to AI assessments
- **Status Tracking**: Visual indicators of review progress

### Morning Briefing
- **Executive Summary**: High-level overview for site leadership
- **Categorized Events**: Escalations, follow-ups, and harmless items clearly separated
- **Pattern Highlights**: Detected patterns with confidence scores
- **Drone Coverage Report**: Summary of patrol activities
- **Print-Ready**: Formatted for morning presentation

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application page
├── components/
│   ├── SiteMap.tsx          # Interactive site map component
│   ├── DronePatrolSimulation.tsx  # Drone patrol simulation
│   ├── EventReviewPanel.tsx       # Human review interface
│   └── MorningBriefing.tsx        # Morning briefing generator
├── data/
│   └── simulatedEvents.ts   # Simulated overnight event data
├── lib/
│   ├── agent.ts             # AI agent with tool-calling
│   └── utils.ts             # Utility functions
```

## Agent Design

The AI agent follows a tool-calling architecture inspired by MCP (Model Context Protocol):

### Tools

1. **Event Context Gatherer**
   - Gathers detailed context about an event
   - Finds related events based on location and timing
   - Identifies nearby events within spatial proximity
   - Returns context summary for human consumption

2. **Pattern Analyzer**
   - Detects repeated failed badge swipes at same location
   - Identifies activity in restricted areas
   - Finds temporal clustering of events
   - Checks drone patrol coverage gaps

3. **Escalation Evaluator**
   - Evaluates events based on severity, context, and patterns
   - Classifies as: harmless, uncertain, or escalation
   - Provides reasoning for each classification
   - Suggests follow-up actions when needed

### Investigation Workflow

1. Analyze patterns across all events
2. For each event:
   - Gather context using related events and location
   - Evaluate escalation risk using patterns and context
   - Attach AI assessment to event
3. Generate summary with categorization

## Design Decisions

### Why Tool-Calling Architecture?

Tool-calling allows the AI to:
- Use specialized tools for specific tasks
- Maintain transparency about what actions it's taking
- Enable humans to inspect tool usage and results
- Scale by adding new tools without changing core agent logic

### Why SVG Map?

SVG provides:
- Crisp rendering at any zoom level
- Simple interactivity without heavy mapping libraries
- Full control over visual styling
- Fast performance with minimal dependencies

### Why Confidence Scoring?

Confidence scoring:
- Surfaces uncertainty honestly
- Helps humans trust or challenge the system
- Guides where manual review is most needed
- Aligns with the principle of "judgment under uncertainty"

### Why Human-in-the-Loop?

Human oversight is critical because:
- Real-world operations have context AI cannot access
- False positives have real consequences
- Accountability requires human approval
- The system should augment, not replace, human judgment

## Tradeoffs

### Simulated Data
- **Decision**: Used seeded/simulated data as permitted by assignment
- **Rationale**: Focus on product architecture without needing real sensor integrations
- **Impact**: Easy to swap real data sources when ready

### Lightweight Drone Simulation
- **Decision**: 2D route animation instead of physics-based simulation
- **Impact**: Sufficient for demonstrating patrol workflow without complexity

### Single-Page Application
- **Decision**: All functionality in one view with tabs
- **Rationale**: Simplifies the 6:10 AM time-pressure scenario
- **Impact**: Easy to navigate, but could be split into separate pages for larger deployments

## AI Tool Usage During Development

This project was built with AI assistance (Cascade/Claude Code) for:

- **Rapid Prototyping**: Quick iteration on component designs
- **Code Generation**: Boilerplate and repetitive code patterns
- **Debugging**: TypeScript error resolution and logic fixes
- **Architecture Decisions**: Tool-calling pattern selection and agent design

The AI tools accelerated development while maintaining code quality and architectural coherence.

✅ AI-first workflow where system investigates before manual work
✅ Simple but real agent that decides which tools to use
✅ At least one tool used through MCP-style interface (3 implemented)
✅ Map or spatial interface meaningfully part of workflow
✅ Lightweight drone patrol simulation
✅ Review layer for human inspection, override, refine, approve
✅ Clear morning summary and briefing

## Future Enhancements

- Real-time data ingestion from actual sensors
- Historical pattern analysis across multiple nights
- Multi-user collaboration for shift handoffs
- Mobile interface for on-site review
- Integration with actual drone fleet APIs
- Video/image analysis for visual confirmation
- Automated escalation notifications to security teams
