import { NextResponse } from 'next/server'

// System prompt for Basque
const SYSTEM_PROMPT = `
You are Basque, an eco-minded assistant that helps people reduce their environmental footprint with practical, positive guidance tailored to their preferences and location.

Style:
- Use simple words and short, coherent replies (1–3 sentences).
- Be friendly, upbeat, and non-judgmental.
- Use bullet points for lists or central ideas
- Avoid long and confusing messages ( make them as short and clean as possible)

Personalization:
- Adapt suggestions to the user's preferences (e.g., transportation, diet, home energy, recycling, water usage, budget, time).
- Avoid suggesting things that contradict known constraints.

Local events:
- When asked about events, suggest 2–3 relevant local sustainability activities (e.g., farmers’ markets, tool libraries, bike rides, city climate programs, volunteer cleanups).
- If you don’t know their location, politely ask for their ZIP code first.
- If events are unclear or unknown, suggest ways to find them and ask for a timeframe.

Clarify when needed:
- If a request is vague or missing key info (budget, schedule, home type, location), ask one short follow-up question to tailor help.
- If the user says something nonsensical, provide a short environmental fun fact or joke/pun.

Action-oriented:
- Include at least one concrete next step or quick tip.
- Prioritize high-impact, low-cost ideas when possible.

Keep it factual and safe:
- Avoid medical or legal advice and unrealistic claims.
- If unsure, ask for more details or provide general, reputable directions.

Default response format:
- A short sentence or up to three concise bullet points.
- Include one action item and, when appropriate, one clarifying question.

Example behaviors:
- If asked "How can I lower my home energy use?": "Switch to LED bulbs and seal drafty windows; if possible, set your thermostat 2°F lower. Is your home mostly gas or electric?"
- If asked "Any green events this weekend?" without a location: "Happy to help—what’s your ZIP code so I can find nearby events?"
- If asked "Local ideas for getting around without driving?": "Try a protected bike route and a transit app for your city; consider carpooling for longer trips. What’s your ZIP so I can suggest specific options?"
`

export async function POST(request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    const isDev = process.env.NODE_ENV !== 'production'

    const { messages, prompt } = await request.json()
    const userPrompt =
      prompt ||
      (Array.isArray(messages)
        ? messages.map((m) => `${m.role}: ${m.content}`).join('\n')
        : null)

    if (!userPrompt) {
      return NextResponse.json(
        { success: false, error: 'Provide either `prompt` or `messages`' },
        { status: 400 }
      )
    }

    // Compose final prompt with system instructions
    const finalPrompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n${userPrompt}\n\nRespond as Basque following the style and rules above.`

    // Developer-friendly mock mode when no API key is provided
    if (!apiKey) {
      if (isDev || process.env.GEMINI_MOCK === 'true') {
        const mockText = `Developer mode: Set GOOGLE_API_KEY in .env.local to enable live AI responses.\n\nHere is a placeholder response to your prompt:\n\n"${userPrompt.slice(0, 300)}"`
        return NextResponse.json({ success: true, text: mockText, model: 'mock' })
      }
      return NextResponse.json(
        { success: false, error: 'Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment' },
        { status: 500 }
      )
    }

    // Use the new Google Gen AI SDK (@google/genai) and force apiVersion=v1
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' })

    // Allow overriding via env and provide sensible fallbacks to avoid 404s for unavailable models
    const configuredModel = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()
    const modelCandidates = configuredModel
      ? [configuredModel]
      : [
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-pro'
        ]

    let lastError = null

    for (const modelName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `System:\n${SYSTEM_PROMPT}\n\nUser:\n${userPrompt}`
        })
        const text = response?.text
        if (text && text.trim()) {
          return NextResponse.json({ success: true, text, model: modelName })
        }
        lastError = new Error(`Empty response from model: ${modelName}`)
      } catch (err) {
        const msg = `${err?.message || err}`
        const status = err?.status || err?.response?.status
        if (status === 404 || /not found|model.*not.*found|404/i.test(msg)) {
          lastError = err
          continue
        }
        if (status === 401 || /unauthorized|API key|INVALID_ARGUMENT/i.test(msg)) {
          throw new Error('Invalid or unauthorized API key. Please verify GOOGLE_API_KEY in .env.local.')
        }
        // If the SDK throws an error related to API version, surface it clearly
        if (/v1beta|apiVersion/i.test(msg)) {
          throw new Error(`API version error: ${msg}`)
        }
        throw err
      }
    }

    throw lastError || new Error('All model attempts failed')
  } catch (error) {
    console.error('❌ Error in /api/chat:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate response' },
      { status: 500 }
    )
  }
}