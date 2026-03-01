import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto Scan — Analyze multiple pages and generate tour suggestions.
 *
 * Receives an array of page snapshots (url + DOM), uses AI to identify
 * which pages/flows need onboarding guidance, then generates tours.
 */

const SYSTEM_PROMPT = `You are an expert onboarding UX designer. You receive DOM snapshots from multiple pages of a web application. Your job is to:

1. **Analyze the app structure** — Understand what the app does, identify key user flows
2. **Identify onboarding needs** — Which pages/flows would benefit from guided tours for NEW users
3. **Generate tours** — Create tour definitions for the most important flows

## Analysis Guidelines
- Focus on CORE user journeys: first-time setup, main feature usage, key configurations
- Prioritize pages with forms, CTAs, complex UI, or settings
- Skip simple/static pages (about, terms, etc.)
- Group related steps across pages into logical tours
- Each tour should be 3-7 steps

## Selector Priority
1. data-ontheway-id → [data-ontheway-id="value"]
2. id → #element-id (only stable, non-auto-generated)
3. Semantic selector → tag + unique class/attribute
4. Short parent > child path (max 3 levels)

## Step Content Rules
- title: Action-oriented, 2-6 words, use verbs
- description: For END USERS, friendly, concise (1-2 sentences)
- Match the language of the pages (if Chinese UI, write in Chinese)

## Output Format
Return a JSON object (no markdown, no explanation):
{
  "appSummary": "Brief description of what the app does",
  "tours": [
    {
      "taskName": "Tour name (human-readable)",
      "slug": "kebab-case-slug",
      "priority": "high|medium|low",
      "reason": "Why this tour is needed",
      "trigger": "first-visit|manual",
      "steps": [
        {
          "element": "CSS selector",
          "popover": {
            "title": "Step Title",
            "description": "Description for users",
            "side": "bottom|top|left|right"
          },
          "url": "/page-path",
          "advanceOnClick": true
        }
      ]
    }
  ]
}

## Rules
- Only reference selectors that ACTUALLY EXIST in the provided DOM
- Include the url field for EVERY step so the SDK knows which page it belongs to
- Sort tours by priority (high first)
- Generate 2-6 tours depending on app complexity
- Each tour covers ONE logical flow`

interface PageSnapshot {
  url: string
  title: string
  dom: string
  links: string[]
}

interface ScanRequest {
  pages: PageSnapshot[]
  intent?: string
  model?: string
  locale?: string
}

export async function POST(request: NextRequest) {
  const body: ScanRequest = await request.json()
  const { pages, intent, model: requestModel, locale } = body

  if (!pages || pages.length === 0) {
    return NextResponse.json({ error: 'pages array is required' }, { status: 400 })
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  const apiBase = process.env.AI_API_BASE || 'https://api.openai.com/v1'
  const model = requestModel || process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    // Heuristic fallback
    const tours = generateFallbackTours(pages)
    return NextResponse.json({ tours, source: 'heuristic' })
  }

  try {
    const pagesDescription = pages.map((p, i) => {
      const truncatedDom = p.dom.substring(0, 8000)
      return `=== Page ${i + 1}: ${p.title} ===
URL: ${p.url}
Internal links: ${p.links.slice(0, 10).join(', ')}

DOM:
${truncatedDom}`
    }).join('\n\n')

    const localeHint = locale ? `\nIMPORTANT: Write all user-facing text in locale "${locale}".` : ''
    const intentHint = intent ? `\nUser's specific request: "${intent}"` : ''

    const userPrompt = `Analyze this web application (${pages.length} pages scanned) and generate onboarding tours.
${intentHint}${localeHint}

${pagesDescription}`

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
        max_tokens: 4000,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Auto Scan] API error:', err)
      const tours = generateFallbackTours(pages)
      return NextResponse.json({ tours, source: 'heuristic', warning: 'AI unavailable' })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || '{}'

    let jsonStr = content
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({
      appSummary: parsed.appSummary || '',
      tours: (parsed.tours || []).map((t: any) => ({
        taskName: t.taskName,
        slug: t.slug,
        priority: t.priority || 'medium',
        reason: t.reason || '',
        trigger: t.trigger || 'manual',
        steps: (t.steps || []).map((s: any) => ({
          element: s.element || s.selector,
          popover: {
            title: s.popover?.title || s.title || '',
            description: s.popover?.description || s.description || '',
            side: s.popover?.side || s.position || undefined,
          },
          url: s.url || undefined,
          advanceOnClick: s.advanceOnClick,
        })),
      })),
      source: 'ai',
    })
  } catch (e) {
    console.error('[Auto Scan] Error:', e)
    const tours = generateFallbackTours(pages)
    return NextResponse.json({ tours, source: 'heuristic', warning: 'AI failed' })
  }
}

// ---- Heuristic fallback ----

function generateFallbackTours(pages: PageSnapshot[]) {
  const tours: any[] = []

  for (const page of pages) {
    // Find pages with forms, buttons, inputs
    const hasForm = /<form/i.test(page.dom)
    const buttonCount = (page.dom.match(/<button/gi) || []).length
    const inputCount = (page.dom.match(/<input/gi) || []).length

    if (!hasForm && buttonCount < 2 && inputCount < 1) continue

    const steps: any[] = []

    // Extract key elements
    const headingMatch = page.dom.match(/<h[12][^>]*>([^<]+)</i)
    if (headingMatch) {
      steps.push({
        element: `h1, h2`,
        popover: {
          title: 'Overview',
          description: `This is the ${headingMatch[1].trim()} page.`,
          side: 'bottom',
        },
        url: page.url,
      })
    }

    const buttonMatches = page.dom.matchAll(/<button[^>]*(?:id="([^"]+)"|class="([^"]+)")[^>]*>([^<]+)/gi)
    for (const m of buttonMatches) {
      const selector = m[1] ? `#${m[1]}` : m[2] ? `button.${m[2].split(/\s+/)[0]}` : 'button'
      steps.push({
        element: selector,
        popover: {
          title: `Click: ${(m[3] || '').trim().substring(0, 30)}`,
          description: `Click this button to proceed.`,
          side: 'bottom',
        },
        url: page.url,
        advanceOnClick: true,
      })
      if (steps.length >= 5) break
    }

    if (steps.length > 0) {
      const slug = page.url.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'home'
      tours.push({
        taskName: page.title || slug,
        slug: slug + '-guide',
        priority: hasForm ? 'high' : 'medium',
        reason: `Page has ${buttonCount} buttons, ${inputCount} inputs${hasForm ? ', and a form' : ''}`,
        trigger: 'manual',
        steps,
      })
    }
  }

  return tours.slice(0, 6)
}
