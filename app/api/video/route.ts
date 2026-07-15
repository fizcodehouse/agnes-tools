import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      apiKey, 
      prompt, 
      height, 
      width, 
      numFrames, 
      frameRate, 
      seed, 
      negativePrompt,
      mode,
      imageInput,
      keyframeInputs
    } = await request.json()

    if (!apiKey || !prompt) {
      return NextResponse.json({ error: 'API key and prompt are required' }, { status: 400 })
    }

    const body: any = {
      model: 'agnes-video-v2.0',
      prompt,
      height,
      width,
      num_frames: numFrames,
      frame_rate: frameRate
    }

    if (seed) body.seed = parseInt(seed)
    if (negativePrompt) body.negative_prompt = negativePrompt

    if (mode === 'image-to-video' && imageInput) {
      body.image = imageInput
    }

    if (mode === 'keyframes' && keyframeInputs && keyframeInputs.length >= 2) {
      body.extra_body = {
        image: keyframeInputs.filter((i: string) => i),
        mode: 'keyframes'
      }
    }

    const response = await fetch('https://apihub.agnes-ai.com/v1/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message || data.detail || 'API request failed' }, { status: response.status })
    }

    return NextResponse.json({ video_id: data.id || data.video_id })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const apiKey = searchParams.get('apiKey')

  if (!videoId || !apiKey) {
    return NextResponse.json({ error: 'videoId and apiKey are required' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://apihub.agnes-ai.com/agnesapi?video_id=${videoId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}