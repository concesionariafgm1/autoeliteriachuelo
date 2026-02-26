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

async function sha1Hex(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { env } = context;
    const CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
    const API_KEY = env.CLOUDINARY_API_KEY;
    const API_SECRET = env.CLOUDINARY_API_SECRET;

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing Cloudinary env vars" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const body = await context.request.json().catch(() => ({}));
    const folder = body.folder || "uploads";
    const public_id = body.public_id || undefined;

    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signature base: sort params alphabetically and join with &
    // Only include params you actually send to Cloudinary in the upload request.
    const params = {
      folder,
      timestamp: String(timestamp),
      ...(public_id ? { public_id } : {})
    };

    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");

    const toSign = `${sorted}${API_SECRET}`;
    const signature = await sha1Hex(toSign);

    return new Response(
      JSON.stringify({
        cloudName: CLOUD_NAME,
        apiKey: API_KEY,
        timestamp,
        signature,
        folder,
        ...(public_id ? { public_id } : {})
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "cloudinary-sign failed", detail: String(err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
