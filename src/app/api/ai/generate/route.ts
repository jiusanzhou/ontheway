import { NextRequest, NextResponse } from 'next/server'

/**
 * AI Generate Onboarding Steps
 * 
 * Accepts page DOM structure + user intent, returns suggested steps.
 * Supports any OpenAI-compatible API (OpenAI, Anthropic via proxy, local models).
 */

const SYSTEM_PROMPT = `You are an onboarding UX expert. Given a webpage's DOM structure and a user's intent description, generate onboarding tour steps.

Rules:
1. Each step MUST reference a real CSS selector from the provided DOM
2. Selectors should be specific and stable (prefer #id, [data-*], unique classes)
3. Write concise, friendly titles and descriptions
4. Choose appropriate popover position (top/bottom/left/right) based on element location
5. Order steps in a logical flow that guides the user naturally
6. Typically 3-7 steps per task
7. Do NOT invent selectors that don't exist in the DOM

Output JSON array only, no markdown, no explanation:
[
  {
    "selector": "#element-id",
    "title": "Step Title",
    "description": "Brief helpful description",
    "position": "bottom"
  }
]`

interface GenerateRequest {
  intent: string
  dom: string
  url?: string
  taskName?: string
}

export async function POST(request: NextRequest) {
  const body: GenerateRequest = await request.json()
  const { intent, dom, url, taskName } = body

  if (!intent || !dom) {
    return NextResponse.json({ error: 'intent and dom are required' }, { status: 400 })
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  const apiBase = process.env.AI_API_BASE || 'https://api.openai.com/v1'
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    // Fallback: generate basic steps from DOM analysis without AI
    const steps = generateFallbackSteps(dom, intent)
    return NextResponse.json({
      steps,
      taskName: taskName || intentToTaskName(intent),
      source: 'heuristic',
    })
  }

  try {
    const userPrompt = `Page URL: ${url || 'unknown'}
${taskName ? `Task name: ${taskName}` : ''}

User intent: "${intent}"

Page DOM structure (simplified):
${dom.substring(0, 15000)}`

    const res = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[AI Generate] API error:', err)
      // Fallback to heuristic
      const steps = generateFallbackSteps(dom, intent)
      return NextResponse.json({
        steps,
        taskName: taskName || intentToTaskName(intent),
        source: 'heuristic',
        warning: 'AI API unavailable, using heuristic generation',
      })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || '[]'

    // Parse JSON from response (handle markdown code blocks)
    let stepsJson = content
    if (stepsJson.startsWith('```')) {
      stepsJson = stepsJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const steps = JSON.parse(stepsJson)

    return NextResponse.json({
      steps: steps.map((s: Record<string, unknown>) => ({
        selector: s.selector,
        title: s.title,
        content: s.description || s.content,
        position: s.position || 'auto',
        spotlight: true,
      })),
      taskName: taskName || intentToTaskName(intent),
      source: 'ai',
    })
  } catch (e) {
    console.error('[AI Generate] Error:', e)
    const steps = generateFallbackSteps(dom, intent)
    return NextResponse.json({
      steps,
      taskName: taskName || intentToTaskName(intent),
      source: 'heuristic',
      warning: 'AI generation failed, using heuristic',
    })
  }
}

// ---- Heuristic fallback (no AI key needed) ----

function generateFallbackSteps(dom: string, intent: string): Array<Record<string, unknown>> {
  const steps: Array<Record<string, unknown>> = []

  // Extract interactive elements from DOM
  const patterns: Array<{ re: RegExp; weight: number; type: string }> = [
    { re: /<(?:h1|h2)[^>]*id="([^"]+)"[^>]*>/gi, weight: 10, type: 'heading' },
    { re: /<nav[^>]*(?:id="([^"]+)"|class="([^"]+)")[^>]*>/gi, weight: 8, type: 'nav' },
    { re: /<button[^>]*(?:id="([^"]+)"|class="([^"]+)")[^>]*>([^<]+)</gi, weight: 7, type: 'button' },
    { re: /<a[^>]*(?:id="([^"]+)")[^>]*>([^<]+)</gi, weight: 5, type: 'link' },
    { re: /<input[^>]*(?:id="([^"]+)"|name="([^"]+)")[^>]*>/gi, weight: 6, type: 'input' },
    { re: /<form[^>]*(?:id="([^"]+)"|class="([^"]+)")[^>]*>/gi, weight: 9, type: 'form' },
  ]

  const candidates: Array<{ selector: string; type: string; text: string; weight: number }> = []

  for (const p of patterns) {
    let match
    while ((match = p.re.exec(dom)) !== null) {
      const id = match[1] || match[2]
      if (!id) continue
      const selector = match[1] ? `#${id}` : `.${id.split(/\s+/)[0]}`
      const text = match[3] || match[2] || id
      candidates.push({ selector, type: p.type, text: text.trim(), weight: p.weight })
      if (candidates.length > 20) break
    }
  }

  // Sort by weight, pick top 5
  candidates.sort((a, b) => b.weight - a.weight)
  const top = candidates.slice(0, 5)

  const typeLabels: Record<string, string> = {
    heading: 'Welcome',
    nav: 'Navigation',
    button: 'Action',
    link: 'Link',
    input: 'Input',
    form: 'Form',
  }

  top.forEach((c, i) => {
    steps.push({
      selector: c.selector,
      title: `${typeLabels[c.type] || 'Step'} ${i + 1}`,
      content: `This is the ${c.type} element: ${c.text.substring(0, 50)}`,
      position: i === 0 ? 'bottom' : 'auto',
      spotlight: true,
    })
  })

  return steps.length > 0 ? steps : [{
    selector: 'body',
    title: 'Welcome',
    content: intent || 'Let us show you around!',
    position: 'bottom',
    spotlight: false,
  }]
}

function intentToTaskName(intent: string): string {
  return intent
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
