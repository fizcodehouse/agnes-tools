'use client'

import { useState } from 'react'

export default function ImageGenerator() {
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState('1K')
  const [ratio, setRatio] = useState('1:1')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sizes = ['1K', '2K', '3K', '4K']
  const ratios = ['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9']

  const generateImage = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          prompt,
          size,
          ratio,
          imageUrl: imageUrl || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }
      
      setResult(data.url || data.data?.[0]?.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Image Generation (agnes-image-2.1-flash)</h2>
      
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
        <label style={{ display: 'block', marginBottom: 5 }}>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={4}
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Ratio</label>
          <select
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {ratios.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Input Image URL (optional - for image-to-image)</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.png"
          style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      <button
        onClick={generateImage}
        disabled={loading || !apiKey || !prompt}
        style={{
          width: '100%',
          padding: 15,
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 15 }}>{error}</p>}
      
      {result && (
        <div style={{ marginTop: 20 }}>
          <img src={result} alt="Generated" style={{ maxWidth: '100%', borderRadius: 4 }} />
          <a href={result} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 10 }}>
            Open image in new tab
          </a>
        </div>
      )}
    </div>
  )
}