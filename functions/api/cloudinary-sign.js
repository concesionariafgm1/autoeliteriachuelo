/**
 * Cloudenary Signed Upload Handler
 * POST /api/cloudinary-sign
 * 
 * Genera firma segura para uploads a Cloudinary
 * Body: { clientId: "autoelite", folder: "vehicles" }
 */

// Helpers para Web Crypto API (Cloudflare Workers compatible)
function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha1Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return toHex(digest);
}

export async function onRequestPost(context) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = context.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return new Response("Missing Cloudinary environment variables", { status: 500 });
  }

  const body = await context.request.json();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = require('crypto')
    .createHash('sha1')
    .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest('hex');

  return new Response(
    JSON.stringify({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
