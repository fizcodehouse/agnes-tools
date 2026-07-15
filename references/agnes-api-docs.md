# Agnes AI API Documentation

## Image Generation - agnes-image-2.1-flash

**Endpoint:** `POST https://apihub.agnes-ai.com/v1/images/generations`

### Parameters
- `model` (required): `agnes-image-2.1-flash`
- `prompt` (required): Text description
- `size` (required): `1K`, `2K`, `3K`, or `4K`
- `ratio` (optional): `1:1`, `3:4`, `4:3`, `16:9`, `9:16`, `2:3`, `3:2`, `21:9`
- `image` (optional): Array of image URLs for image-to-image
- `extra_body.response_format`: `url` (default) or `b64_json`

### Dimensions Reference
| Ratio | 1K | 2K | 3K | 4K |
|-------|-----|-----|-----|-----|
| 1:1 | 1024x1024 | 2048x2048 | 3072x3072 | 4096x4096 |
| 16:9 | 1312x736 | 2624x1472 | 3936x2208 | 5248x2944 |

---

## Video Generation - agnes-video-v2.0

**Create Task:** `POST https://apihub.agnes-ai.com/v1/videos`
**Poll Result:** `GET https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>`

### Parameters
- `model` (required): `agnes-video-v2.0`
- `prompt` (required): Text description
- `height` (optional): Default 768
- `width` (optional): Default 1152
- `num_frames` (optional): Must be 8n+1, ≤441
- `frame_rate` (optional): 1-60, default 24
- `seed` (optional): Random seed
- `negative_prompt` (optional): Content to avoid
- `image` (optional): Image URL for image-to-video
- `extra_body.image` (optional): Array for keyframes
- `extra_body.mode` (optional): `keyframes` for keyframe animation

---

## Source Docs
- https://agnes-ai.com/en/docs/agnes-image-21-flash
- https://agnes-ai.com/en/docs/agnes-video-v20