// Archivo original movido aquí para evitar conflictos con Cloudflare Pages.
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app;

export async function onRequestPost(context) {
  const secret = context.request.headers.get("x-admin-secret");
  if (secret !== context.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { uid } = await context.request.json();
  if (!uid) return new Response("Missing uid", { status: 400 });

  if (!app) {
    app = initializeApp({
      credential: cert({
        projectId: context.env.FIREBASE_PROJECT_ID,
        clientEmail: context.env.FIREBASE_CLIENT_EMAIL,
        privateKey: context.env.FIREBASE_PRIVATE_KEY.replace(/\n/g, "\n"),
      }),
    });
  }

  await getAuth().setCustomUserClaims(uid, { admin: true });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}