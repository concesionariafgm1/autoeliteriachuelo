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

export const onRequest = async (context) => {
  const { request } = context;

  // Solo POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parsear body
    const body = await request.json();
    const { clientId, folder } = body;

    // Validar clientId
    if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'clientId es requerido y debe ser un string no vacío' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar folder (opcional, default "vehicles")
    const folderValue = folder && typeof folder === 'string' ? folder.trim() : 'vehicles';

    // Leer credenciales de env
    const cloudName = context.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = context.env.CLOUDINARY_API_KEY;
    const apiSecret = context.env.CLOUDINARY_API_SECRET;

    // Validar que existan las credenciales
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Credenciales de Cloudinary no configuradas en env');
      return new Response(
        JSON.stringify({ error: 'Configuración de servidor incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar timestamp (segundos desde epoch)
    const timestamp = Math.floor(Date.now() / 1000);

    // Construir folder final
    const finalFolder = `tenants/${clientId}/${folderValue}`;

    // Construir string para firmar según Cloudinary
    // Formato: api_key={api_key}&folder={folder}&timestamp={timestamp}
    // IMPORTANTE: Los parámetros deben ir ordenados alfabéticamente
    const paramsToSign = `api_key=${apiKey}&folder=${finalFolder}&timestamp=${timestamp}`;

    // Generar SHA-1 signature usando Web Crypto API
    const signature = await sha1Hex(paramsToSign + apiSecret);

    // Responder con datos para el cliente
    return new Response(
      JSON.stringify({
        cloudName,
        apiKey,
        timestamp,
        folder: finalFolder,
        signature
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error en cloudinary-sign:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
