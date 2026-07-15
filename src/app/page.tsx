"use client";

import { useState, useRef } from "react";

const IMAGE_API = "https://apihub.agnes-ai.com/v1/images/generations";
const VIDEO_API = "https://apihub.agnes-ai.com/v1/videos";
const VIDEO_POLL = "https://apihub.agnes-ai.com/agnesapi";

type Tab = "image" | "video";
type ImageSize = "1K" | "2K" | "3K" | "4K";
type VideoDimension = "480p" | "720p" | "1080p";

const IMAGE_SIZES: ImageSize[] = ["1K", "2K", "3K", "4K"];
const IMAGE_RATIOS = ["1:1", "4:3", "3:2", "16:9", "9:16", "21:9"];
const VIDEO_DIMENSIONS: Record<VideoDimension, { width: number; height: number }> = {
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("image");
  const [apiKey, setApiKey] = useState("");

  // Image state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgSize, setImgSize] = useState<ImageSize>("1K");
  const [imgRatio, setImgRatio] = useState("1:1");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgBase64, setImgBase64] = useState("");
  const [imgReturnBase64, setImgReturnBase64] = useState(false);
  const [imgResponseFormat, setImgResponseFormat] = useState("");

  // Video state
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidDimension, setVidDimension] = useState<VideoDimension>("720p");
  const [vidFrames, setVidFrames] = useState(121);
  const [vidFps, setVidFps] = useState(24);
  const [vidSeed, setVidSeed] = useState<number | "">("");
  const [vidNegPrompt, setVidNegPrompt] = useState("");
  const [vidImageUrl, setVidImageUrl] = useState("");
  const [vidKeyframes, setVidKeyframes] = useState("");
  const [vidKeyframeMode, setVidKeyframeMode] = useState("");

  // Shared result/loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [videoId, setVideoId] = useState("");
  const [pollStatus, setPollStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImgFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        setImgBase64(b64.split(",")[1]);
      };
      reader.readAsDataURL(file);
    } else {
      setImgBase64("");
    }
  };

  // ── Image Generation ──
  const generateImage = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const body: Record<string, any> = {
        model: "agnes-image-2.1-flash",
        prompt: imgPrompt,
        size: imgSize,
        ratio: imgRatio,
      };
      if (imgBase64) body.image = imgBase64;
      if (imgReturnBase64) body.return_base64 = true;
      if (imgResponseFormat.trim()) {
        body.response_format = imgResponseFormat.trim();
      }

      const res = await fetch(IMAGE_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.message || `HTTP ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Video Generation ──
  const generateVideo = async () => {
    setError("");
    setResult(null);
    setVideoId("");
    setPollStatus("");
    setLoading(true);

    const { width, height } = VIDEO_DIMENSIONS[vidDimension];

    try {
      const body: Record<string, any> = {
        model: "agnes-video-v2.0",
        prompt: vidPrompt,
        height,
        width,
        num_frames: vidFrames,
        frame_rate: vidFps,
      };
      if (vidSeed !== "") body.seed = vidSeed;
      if (vidNegPrompt.trim()) body.negative_prompt = vidNegPrompt.trim();
      if (vidImageUrl.trim()) body.image_url = vidImageUrl.trim();

      // Keyframe mode
      if (vidKeyframes.trim() || vidKeyframeMode.trim()) {
        body.extra_body = {};
        if (vidKeyframes.trim()) {
          try {
            body.extra_body.image = JSON.parse(vidKeyframes.trim());
          } catch {
            body.extra_body.image = vidKeyframes.trim().split(",").map((s) => s.trim());
          }
        }
        if (vidKeyframeMode.trim()) {
          body.extra_body.mode = vidKeyframeMode.trim();
        }
      }

      const res = await fetch(VIDEO_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.message || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }

      // Extract video_id
      const vId = data.video_id || data.id || data.data?.video_id || data.data?.id;
      if (vId) {
        setVideoId(vId);
        setResult(data);
        // Start polling
        pollVideo(vId);
      } else {
        setResult(data);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Request failed");
      setLoading(false);
    }
  };

  const pollVideo = async (vId: string) => {
    setPollStatus("Processing...");
    const poll = async () => {
      try {
        const res = await fetch(`${VIDEO_POLL}?video_id=${encodeURIComponent(vId)}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setPollStatus(`Poll error: ${data.message || `HTTP ${res.status}`}`);
          setLoading(false);
          return;
        }

        const status = (data.status || data.state || "").toLowerCase();
        setPollStatus(`Status: ${status || "unknown"}`);

        if (status === "completed" || status === "done" || status === "succeeded" || data.video_url || data.url) {
          setResult(data);
          setPollStatus("Completed!");
          setLoading(false);
        } else if (status === "failed" || status === "error") {
          setError(data.error?.message || data.message || "Video generation failed");
          setLoading(false);
        } else {
          setTimeout(poll, 3000);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };
    setTimeout(poll, 3000);
  };

  // ── Render helpers ──
  const renderResult = () => {
    if (!result) return null;

    const maybeUrl = result.url || result.data?.url || result.video_url || result.data?.video_url;
    const maybeB64 = result.base64 || result.data?.base64 || result.image_base64 || result.data?.image_base64;
    const imagesArr = result.data?.images || result.images || [];

    return (
      <div className="mt-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Result</h3>

        {/* Image URL */}
        {maybeUrl && (
          <div className="mb-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">URL:</p>
            <a href={maybeUrl} target="_blank" rel="noopener noreferrer"
               className="text-[var(--accent)] text-sm break-all hover:underline">{maybeUrl}</a>
            {maybeUrl.match(/\.(mp4|webm|mov)/i) ? (
              <video controls className="mt-2 max-w-full rounded-lg max-h-96"
                     src={maybeUrl} />
            ) : (
              <img src={maybeUrl} alt="Generated" className="mt-2 max-w-full rounded-lg max-h-96 object-contain" />
            )}
          </div>
        )}

        {/* Base64 */}
        {maybeB64 && (
          <div className="mb-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Base64 Image:</p>
            {maybeB64.startsWith("data:") ? (
              <img src={maybeB64} alt="Generated base64" className="max-w-full rounded-lg max-h-96 object-contain" />
            ) : (
              <img src={`data:image/png;base64,${maybeB64}`} alt="Generated base64"
                   className="max-w-full rounded-lg max-h-96 object-contain" />
            )}
          </div>
        )}

        {/* Images array */}
        {imagesArr.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {imagesArr.map((img: any, i: number) => {
              const u = img.url || img;
              return (
                <img key={i} src={u} alt={`Generated ${i}`}
                     className="w-full rounded-lg object-contain" />
              );
            })}
          </div>
        )}

        {/* Poll status */}
        {pollStatus && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className={pollStatus.includes("Completed") ? "text-[var(--success)]" : "text-[var(--warning)]"}>
              {pollStatus}
            </span>
          </div>
        )}

        {/* Raw JSON */}
        <details>
          <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
            Raw JSON Response
          </summary>
          <pre className="mt-2 text-xs text-[var(--text-muted)] overflow-auto max-h-64 bg-[var(--bg-primary)] p-3 rounded-lg">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  // ── Main UI ──
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agnes Tools</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">AI Image & Video Generation</p>
      </div>

      {/* API Key */}
      <div className="mb-6">
        <label htmlFor="api-key">API Key</label>
        <input
          id="api-key"
          type="password"
          placeholder="Enter your Agnes AI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">Your key stays in your browser and is sent directly to Agnes AI.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--border-color)] mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium transition-all ${
            activeTab === "image" ? "tab-active" : "tab-inactive"
          }`}
          onClick={() => setActiveTab("image")}
        >
          Image Generation
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-all ${
            activeTab === "video" ? "tab-active" : "tab-inactive"
          }`}
          onClick={() => setActiveTab("video")}
        >
          Video Generation
        </button>
      </div>

      {/* ──── Image Tab ──── */}
      {activeTab === "image" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="img-prompt">Prompt</label>
            <textarea
              id="img-prompt"
              rows={3}
              placeholder="Describe the image you want to generate..."
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="img-size">Size</label>
              <select id="img-size" value={imgSize} onChange={(e) => setImgSize(e.target.value as ImageSize)}>
                {IMAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="img-ratio">Ratio</label>
              <select id="img-ratio" value={imgRatio} onChange={(e) => setImgRatio(e.target.value)}>
                {IMAGE_RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="img-file">Image Input (for image-to-image)</label>
            <div className="flex items-center gap-3">
              <input
                id="img-file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--accent-bg)] file:text-[var(--accent)] hover:file:bg-opacity-20"
              />
              {imgFile && (
                <span className="text-xs text-[var(--text-muted)]">{imgFile.name}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={imgReturnBase64}
                  onChange={(e) => setImgReturnBase64(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Return as Base64</span>
              </label>
            </div>
            <div>
              <label htmlFor="img-response-format">Response Format (optional)</label>
              <input
                id="img-response-format"
                placeholder='e.g. "b64_json"'
                value={imgResponseFormat}
                onChange={(e) => setImgResponseFormat(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary w-full"
            disabled={loading || !apiKey || !imgPrompt.trim()}
            onClick={generateImage}
          >
            {loading ? "Generating..." : "Generate Image"}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          {renderResult()}
        </div>
      )}

      {/* ──── Video Tab ──── */}
      {activeTab === "video" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="vid-prompt">Prompt</label>
            <textarea
              id="vid-prompt"
              rows={3}
              placeholder="Describe the video you want to generate..."
              value={vidPrompt}
              onChange={(e) => setVidPrompt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vid-dimension">Dimension Preset</label>
              <select 
                id="vid-dimension" 
                value={vidDimension} 
                onChange={(e) => setVidDimension(e.target.value as VideoDimension)}
              >
                <option value="480p">480p (854×480)</option>
                <option value="720p">720p (1280×720)</option>
                <option value="1080p">1080p (1920×1080)</option>
              </select>
            </div>
            <div>
              <label htmlFor="vid-image-url">Image URL (optional)</label>
              <input
                id="vid-image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={vidImageUrl}
                onChange={(e) => setVidImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vid-frames">Number of Frames (8n+1, ≤441)</label>
              <input
                id="vid-frames"
                type="number"
                min={1}
                max={441}
                value={vidFrames}
                onChange={(e) => setVidFrames(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="vid-fps">Frame Rate (1-60)</label>
              <input
                id="vid-fps"
                type="number"
                min={1}
                max={60}
                value={vidFps}
                onChange={(e) => setVidFps(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vid-seed">Seed (optional)</label>
              <input
                id="vid-seed"
                type="number"
                placeholder="Random if empty"
                value={vidSeed}
                onChange={(e) => setVidSeed(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="vid-neg-prompt">Negative Prompt (optional)</label>
              <input
                id="vid-neg-prompt"
                placeholder="Things to avoid..."
                value={vidNegPrompt}
                onChange={(e) => setVidNegPrompt(e.target.value)}
              />
            </div>
          </div>

          {/* Keyframe mode */}
          <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)]">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Keyframe Mode (optional)</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="vid-keyframes">Image URLs (JSON array or comma-separated)</label>
                <input
                  id="vid-keyframes"
                  placeholder='["https://...", "https://..."] or url1, url2'
                  value={vidKeyframes}
                  onChange={(e) => setVidKeyframes(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="vid-keyframe-mode">Mode</label>
                <input
                  id="vid-keyframe-mode"
                  placeholder="e.g. frame_interpolation"
                  value={vidKeyframeMode}
                  onChange={(e) => setVidKeyframeMode(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            className="btn-primary w-full"
            disabled={loading || !apiKey || !vidPrompt.trim()}
            onClick={generateVideo}
          >
            {loading ? "Generating..." : "Generate Video"}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          {renderResult()}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-6">
        Powered by <a href="https://agnes-ai.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Agnes AI</a>
        {" "}·{" "}
        <a href="https://github.com/fizcodehouse/agnes-tools" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">GitHub</a>
      </div>
    </div>
  );
}