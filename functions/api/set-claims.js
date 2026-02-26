import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app;

export async function onRequestPost(context) {

  // Seguridad b\u00e1sica (clave secreta para que solo vos puedas usarlo)
  const secret = context.request.headers.get("x-admin-secret");

  if (secret !== context.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Datos enviados
  const body = await context.request.json();
  const { uid, clientId } = body;

  if (!app) {
    app = initializeApp({
      credential: cert({
        projectId: context.env.FIREBASE_PROJECT_ID,
        clientEmail: context.env.FIREBASE_CLIENT_EMAIL,
        privateKey: context.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  }

  const auth = getAuth();

  await auth.setCustomUserClaims(uid, { clientId });

  return new Response(JSON.stringify({ success: true }));
}