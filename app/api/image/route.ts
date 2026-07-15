import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, prompt, size, ratio, imageUrl } = await request.json()

    if (!apiKey || !prompt) {
      return NextResponse.json({ error: 'API key and prompt are required' }, { status: 400 })
    }

    const response = await fetch('https://apihub.agnes-ai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'agnes-image-2.1-flash',
        prompt,
        size,
        ratio,
        ...(imageUrl && { image: [imageUrl] }),
        extra_body: {
          response_format: 'url'
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message || data.detail || 'API request failed' }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}