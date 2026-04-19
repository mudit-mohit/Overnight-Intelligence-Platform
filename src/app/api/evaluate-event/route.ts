import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    console.log('GROQ_API_KEY from env:', apiKey ? 'Present' : 'Missing');
    console.log('GROQ_API_KEY value:', apiKey?.substring(0, 10) + '...');
    
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return NextResponse.json(
        { 
          error: 'Groq API key not configured',
          message: 'Please add your Groq API key to .env.local file'
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const body = await request.json();
    const { event, context, patterns } = body;

    const prompt = `You are a security analyst for Ridgeway Site. Evaluate the risk level of this event:

Event: ${event.description}
Type: ${event.type}
Location: ${event.location.name} (${event.location.type}${event.location.restricted ? ', RESTRICTED' : ''})
Severity: ${event.severity}
Time: ${new Date(event.timestamp).toLocaleTimeString()}
Confidence: ${Math.round(event.confidence * 100)}%

Context: ${context}
${patterns ? `Patterns: ${patterns}` : ''}

Determine the risk level as one of:
- harmless: Can be safely ignored (environmental noise, routine activity)
- uncertain: Needs human review (insufficient information, ambiguous)
- escalation: Requires immediate attention (security threat, unauthorized access)

Provide your reasoning and suggest an action if follow-up is needed.

Respond in JSON format:
{
  "riskLevel": "harmless|uncertain|escalation",
  "reasoning": "your reasoning here",
  "requiresFollowUp": true/false,
  "suggestedAction": "action if needed"
}`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Groq evaluation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to evaluate event', 
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      },
      { status: 500 }
    );
  }
}
