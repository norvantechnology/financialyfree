# Cloudflare Stream Integration

## Overview
Cloudflare Stream is the primary video hosting, transcoding, and content delivery infrastructure for the FinanciallyFree LMS course lessons and webinar replay archive.

> **Development Mode Notice**: Per architecture guidelines, development and testing environments use `USE_MOCK_VIDEO=true` which serves public sample video streams (`https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`) with mock signed tokens. Flipped to `false` in staging/production, it interfaces directly with the Cloudflare Stream API.

## Configuration & Credentials

Set the following environment variables in `.env`:

```env
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_STREAM_API_TOKEN="your_cloudflare_stream_api_token"
CLOUDFLARE_STREAM_KEY_ID="your_signing_key_id"
CLOUDFLARE_STREAM_KEY_JWK="your_signing_key_jwk"
CLOUDFLARE_STREAM_DOMAIN="customer-<codecode>.cloudflarestream.com"
USE_MOCK_VIDEO="true"
```

## Architecture & Entitlement Enforcement

1. **Direct Creator Uploads**:
   - Admin uploads lesson raw MP4 / ProRes videos using TUS protocol (`https://api.cloudflare.com/client/v4/accounts/{account_id}/stream?direct_user=true`).
   - Cloudflare automatically encodes adaptive bitrate HLS and DASH manifests.

2. **Signed Token Playback**:
   - Video assets are flagged with `requireSignedURLs: true`.
   - When an authenticated student requests a lesson (`GET /courses/:slug/lessons/:lessonId`), the NestJS API validates whether the student has the `course_lifetime` or active subscription entitlement.
   - If entitled, the API generates a time-limited JSON Web Token (JWT) signed by `CLOUDFLARE_STREAM_KEY_JWK` expiring in 6 hours:
     ```ts
     const signedPlaybackUrl = `https://${domain}/${videoId}/manifest/video.m3u8?token=${jwtToken}`;
     ```

3. **Webhooks for Video Ingestion**:
   - Webhook endpoint: `POST /webhooks/cloudflare-stream`
   - Validates webhook signature header `webhook-signature` using HMAC-SHA256 with the webhook secret.
   - Updates `LessonEntity.durationSeconds` and sets `status = 'ready'`.

## Steps to Go Live Checklist

Follow this checklist before flipping `USE_MOCK_VIDEO=false`:

- [ ] **Cloudflare Stream Subscription**: Active Cloudflare account with Stream add-on enabled (billed per minute viewed/stored).
- [ ] **API Token Creation**: Generate an API Token with `Stream:Edit` permissions.
- [ ] **Playback Key Pair**: In Cloudflare dashboard &rarr; Stream &rarr; Signing Keys:
  - Generate a new signing key pair.
  - Save Key ID into `CLOUDFLARE_STREAM_KEY_ID`.
  - Save JWK into `CLOUDFLARE_STREAM_KEY_JWK`.
- [ ] **Webhook Destination**:
  - Configure notification webhook pointing to `https://api.yourdomain.com/webhooks/cloudflare-stream`.
  - Save webhook secret to `CLOUDFLARE_STREAM_WEBHOOK_SECRET`.
- [ ] **Flip Flag**: Set `USE_MOCK_VIDEO=false` in production environment.
- [ ] **Upload Test**: Upload a short MP4 video clip via admin dashboard; verify transcode completes and signed token plays in player.
