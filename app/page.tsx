'use client'

import { useState } from 'react'
import ImageGenerator from './components/ImageGenerator'
import VideoGenerator from './components/VideoGenerator'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>🎨 Agnes Tools</h1>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
        <button 
          onClick={() => setActiveTab('image')}
          style={{ 
            padding: '10px 20px', 
            background: activeTab === 'image' ? '#0070f3' : '#f0f0f0',
            color: activeTab === 'image' ? 'white' : 'black',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          Image Generation
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          style={{ 
            padding: '10px 20px', 
            background: activeTab === 'video' ? '#0070f3' : '#f0f0f0',
            color: activeTab === 'video' ? 'white' : 'black',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          Video Generation
        </button>
      </div>

      {activeTab === 'image' ? <ImageGenerator /> : <VideoGenerator />}
    </main>
  )
}