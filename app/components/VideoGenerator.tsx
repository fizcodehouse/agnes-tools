'use client'

import { useState } from 'react'

export default function VideoGenerator() {
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [height, setHeight] = useState(768)
  const [width, setWidth] = useState(1152)
  const [numFrames, setNumFrames] = useState(121)
  const [frameRate, setFrameRate] = useState(24)
  const [seed, setSeed] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [mode, setMode] = useState('text-to-video')
  const [imageInput, setImageInput] = useState('')
  const [keyframeInputs, setKeyframeInputs] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  const pollVideoResult = async (videoId: string) => {
    setPolling(true)
    const maxAttempts = 30
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const resp = await fetch(`/api/video?videoId=${videoId}&apiKey=${encodeURIComponent(apiKey)}`)
        const data = await resp.json()
        
        if (data.status === 'completed' && data.url) {
          setResult(data.url)
          setPolling(false)
          return
        }
        
        if (data.status === 'failed') {
          throw new Error(data.error || 'Video generation failed')
        }
        
        await delay(5000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Polling error')
        setPolling(false)
        return
      }
    }
    
    setError('Video generation timed out. Try again later.')
    setPolling(false)
  }

  const generateVideo = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          prompt,
          height,
          width,
          numFrames,
          frameRate,
          seed: seed || undefined,
          negativePrompt: negativePrompt || undefined,
          mode,
          imageInput: imageInput || undefined,
          keyframeInputs: mode === 'keyframes' ? keyframeInputs.filter(i => i) : undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video')
      }
      
      if (data.video_id) {
        pollVideoResult(data.video_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Video Generation (agnes-video-v2.0)</h2>
      
      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Agnes AI API key"
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="text-to-video">Text-to-Video</option>
          <option value="image-to-video">Image-to-Video</option>
          <option value="keyframes">Keyframe Animation</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={3}
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      {mode === 'image-to-video' && (
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Input Image URL</label>
          <input
            type="text"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="https://example.com/image.png"
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
      )}

      {mode === 'keyframes' && (
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Keyframe Image URLs (2-4)</label>
          {keyframeInputs.map((url, idx) => (
            <input
              key={idx}
              type="text"
              value={url}
              onChange={(e) => {
                const newInputs = [...keyframeInputs]
                newInputs[idx] = e.target.value
                setKeyframeInputs(newInputs)
              }}
              placeholder={`Keyframe ${idx + 1} URL`}
              style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8 }}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>Frames (8n+1, ≤441)</label>
          <input
            type="number"
            value={numFrames}
            onChange={(e) => setNumFrames(Number(e.target.value))}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>Frame Rate (1-60)</label>
          <input
            type="number"
            value={frameRate}
            onChange={(e) => setFrameRate(Number(e.target.value))}
            min={1}
            max={60}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Seed (optional)</label>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Random seed for reproducibility"
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Negative Prompt (optional)</label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="What to avoid in the video..."
          rows={2}
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      <button
        onClick={generateVideo}
        disabled={loading || !apiKey || !prompt || (mode === 'image-to-video' && !imageInput) || (mode === 'keyframes' && keyframeInputs.filter(i => i).length < 2)}
        style={{
          width: '100%',
          padding: 15,
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: (loading || !apiKey || !prompt) ? 'default' : 'pointer',
          opacity: (loading || !apiKey || !prompt) ? 0.6 : 1
        }}
      >
        {loading ? (polling ? 'Processing video...' : 'Generating...') : 'Generate Video'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 15 }}>{error}</p>}
      
      {result && (
        <div style={{ marginTop: 20 }}>
          <video src={result} controls style={{ maxWidth: '100%', borderRadius: 4 }} />
          <a href={result} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 10 }}>
            Download video
          </a>
        </div>
      )}
    </div>
  )
}