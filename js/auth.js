import { getAuth, onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase.js";

export const authState = {
  currentUser: null,
  isAdmin: false,
  clientId: null,
  claims: null
};

function updateGlobalState(user, claims) {
  authState.currentUser = user || null;
  authState.claims = claims || null;

  const email = user && user.email ? String(user.email).toLowerCase() : "";
  const allowlist = Array.isArray(window.SITE_ADMIN_EMAILS)
    ? window.SITE_ADMIN_EMAILS.map(e => String(e).toLowerCase())
    : [];

  const isAdminByClaim = Boolean(claims && claims.role === 'admin');
  const isAdminByEmail = email && allowlist.includes(email);

  authState.isAdmin = Boolean(isAdminByClaim || isAdminByEmail);

  // En single-site: si no viene clientId por claim, usar SITE_CLIENT_ID.
  const claimedClientId = claims && claims.clientId ? claims.clientId : null;
  authState.clientId = claimedClientId || (authState.isAdmin ? window.SITE_CLIENT_ID : null);

  window.currentUser = authState.currentUser;
  window.isAdmin = authState.isAdmin;
  window.clientId = authState.clientId;
  window.authClaims = authState.claims;
}

export function initAuthListener(options) {
  const config = options || {};
  const requireAdmin = Boolean(config.requireAdmin);
  const onUnauthorized = typeof config.onUnauthorized === 'function' ? config.onUnauthorized : null;
  const onReady = typeof config.onReady === 'function' ? config.onReady : null;

  const auth = getAuth(app);

  onAuthStateChanged(auth, async function(user) {
    if (!user) {
      updateGlobalState(null, null);
      if (requireAdmin && onUnauthorized) {
        onUnauthorized();
      }
      if (onReady) {
        onReady(authState);
      }
      return;
    }

    try {
      const tokenResult = await getIdTokenResult(user);
      const claims = tokenResult && tokenResult.claims ? tokenResult.claims : {};
      updateGlobalState(user, claims);

      if (requireAdmin && !authState.isAdmin) {
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      if (onReady) {
        onReady(authState);
      }
    } catch (error) {
      console.error('Error leyendo custom claims:', error);
      updateGlobalState(user, null);
      if (requireAdmin && onUnauthorized) {
        onUnauthorized();
      }
      if (onReady) {
        onReady(authState);
      }
    }
  });
}
