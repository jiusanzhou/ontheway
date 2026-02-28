import { NextRequest, NextResponse } from 'next/server'

/**
 * AI Generate Onboarding Steps
 * 
 * Accepts page DOM structure + user intent, returns suggested steps.
 * Supports any OpenAI-compatible API (OpenAI, Anthropic via proxy, local models).
 */

const SYSTEM_PROMPT = `You are an expert onboarding UX designer. Given a webpage's DOM structure and a user's intent, generate onboarding tour steps that guide end-users through the interface.

## Selector Priority (MUST follow this order)
1. **data-ontheway-id** — ALWAYS prefer \`[data-ontheway-id="value"]\` if the attribute exists on the element
2. **id** — Use \`#element-id\` if the element has a unique, stable id (not auto-generated like \`:r0:\`)
3. **Unique semantic selector** — Use tag + unique class/attribute combo, e.g. \`button.submit-btn\`, \`nav.main-nav\`, \`[role="button"][aria-label="Save"]\`
4. **Contextual path** — As a last resort, use a short parent > child path (max 3 levels)

## Step Content Rules
- **title**: Short, action-oriented (2-6 words). Use verbs: "Click", "Enter", "Select", "Review"
- **description**: Written for END USERS (not developers). Friendly, concise (1-2 sentences max). Explain WHY and WHAT to do, not implementation details.
- **Language**: Match the language of the user's intent. If intent is in Chinese, write titles and descriptions in Chinese. If in English, write in English.
- **side**: Choose based on element's position annotation — use "bottom" for top-area elements, "top" for bottom-area elements, "left"/"right" to avoid going off-screen.

## Cross-Page Tours
- If the intent implies steps across multiple pages, include a \`url\` field with the path the user should be on for that step.
- Steps on the same page should NOT have a \`url\` field (or it should match the current page).

## Output Format
Return a JSON object (no markdown fences, no explanation) with this exact structure:
{
  "taskName": "Human-readable task name (in the same language as the intent)",
  "slug": "kebab-case-slug-in-english",
  "steps": [
    {
      "element": "[data-ontheway-id=\\"some-id\\"]",
      "popover": {
        "title": "Step Title",
        "description": "Friendly description for end users",
        "side": "bottom"
      },
      "url": "/optional/path",
      "advanceOnClick": true
    }
  ]
}

## Rules
- Each step MUST reference a real CSS selector from the provided DOM. Do NOT invent selectors.
- Generate 3-7 steps per task, in logical user flow order.
- Set \`advanceOnClick: true\` for buttons and clickable actions.
- Elements marked as [INTERACTIVE] in the DOM are the primary candidates.
- Elements marked as [OUT OF VIEWPORT] should be used sparingly and only if essential to the flow.
- If no suitable interactive elements exist for the intent, use structural landmarks (headings, sections).`

interface GenerateRequest {
  intent: string
  dom: string
  url?: string
  taskName?: string
  model?: string
  locale?: string
}

export async function POST(request: NextRequest) {
  const body: GenerateRequest = await request.json()
  const { intent, dom, url, taskName, model: requestModel, locale } = body

  if (!intent || !dom) {
    return NextResponse.json({ error: 'intent and dom are required' }, { status: 400 })
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  const apiBase = process.env.AI_API_BASE || 'https://api.openai.com/v1'
  const model = requestModel || process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    // Fallback: generate basic steps from DOM analysis without AI
    const steps = generateFallbackSteps(dom, intent)
    return NextResponse.json({
      steps,
      taskName: taskName || intentToTaskName(intent),
      slug: intentToSlug(intent),
      source: 'heuristic',
    })
  }

  try {
    const localeInstruction = locale && locale !== 'en'
      ? `\n\nIMPORTANT: Write all step titles and descriptions in locale "${locale}". Do NOT use English for user-facing text.`
      : ''

    const userPrompt = `Page URL: ${url || 'unknown'}
${taskName ? `Task name: ${taskName}` : ''}

User intent: "${intent}"${localeInstruction}

Page DOM structure (simplified, interactive elements marked with [INTERACTIVE]):
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
        slug: intentToSlug(intent),
        source: 'heuristic',
        warning: 'AI API unavailable, using heuristic generation',
      })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || '{}'

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonStr)

    // Support both old array format and new object format
    const rawSteps = Array.isArray(parsed) ? parsed : (parsed.steps || [])
    const aiTaskName = parsed.taskName || taskName || intentToTaskName(intent)
    const aiSlug = parsed.slug || intentToSlug(aiTaskName)

    return NextResponse.json({
      steps: rawSteps.map((s: Record<string, unknown>) => {
        const popover = s.popover as Record<string, unknown> | undefined
        return {
          element: s.element || s.selector,
          popover: {
            title: popover?.title || s.title || '',
            description: popover?.description || s.description || s.content || '',
            side: popover?.side || s.position || undefined,
          },
          url: s.url || undefined,
          advanceOnClick: s.advanceOnClick !== undefined ? s.advanceOnClick : undefined,
        }
      }),
      taskName: aiTaskName,
      slug: aiSlug,
      source: 'ai',
    })
  } catch (e) {
    console.error('[AI Generate] Error:', e)
    const steps = generateFallbackSteps(dom, intent)
    return NextResponse.json({
      steps,
      taskName: taskName || intentToTaskName(intent),
      slug: intentToSlug(intent),
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
    { re: /data-ontheway-id="([^"]+)"/gi, weight: 12, type: 'ontheway' },
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
      const selector = p.type === 'ontheway'
        ? `[data-ontheway-id="${id}"]`
        : match[1] ? `#${id}` : `.${id.split(/\s+/)[0]}`
      const text = match[3] || match[2] || id
      candidates.push({ selector, type: p.type, text: text.trim(), weight: p.weight })
      if (candidates.length > 20) break
    }
  }

  // Sort by weight, pick top 5
  candidates.sort((a, b) => b.weight - a.weight)
  const top = candidates.slice(0, 5)

  const typeLabels: Record<string, string> = {
    ontheway: 'Feature',
    heading: 'Welcome',
    nav: 'Navigation',
    button: 'Action',
    link: 'Link',
    input: 'Input',
    form: 'Form',
  }

  top.forEach((c, i) => {
    steps.push({
      element: c.selector,
      popover: {
        title: `${typeLabels[c.type] || 'Step'} ${i + 1}`,
        description: `This is the ${c.type} element: ${c.text.substring(0, 50)}`,
        side: i === 0 ? 'bottom' : undefined,
      },
      advanceOnClick: c.type === 'button',
    })
  })

  return steps.length > 0 ? steps : [{
    element: 'body',
    popover: {
      title: 'Welcome',
      description: intent || 'Let us show you around!',
      side: 'bottom',
    },
  }]
}

function intentToTaskName(intent: string): string {
  return intent
    .replace(/[^\w\s\u4e00-\u9fff]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map(w => {
      // Don't capitalize Chinese characters
      if (/[\u4e00-\u9fff]/.test(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

function intentToSlug(intent: string): string {
  return intent
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, (match) => {
      // Simple pinyin-like slug for Chinese — just use a hash
      return 'task-' + Math.abs(hashCode(match)).toString(36).substring(0, 4)
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40) || 'new-task'
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}
