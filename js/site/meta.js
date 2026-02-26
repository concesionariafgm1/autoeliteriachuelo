// Meta tags (SEO + Social). Respeta branding en config/site.js
function upsertMeta(selector, attrs, content) {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attrs).forEach(([k,v]) => tag.setAttribute(k, v));
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export function applyMeta(branding = {}, env = {}) {
  const title = branding.metaTitle || branding.name || document.title;
  const desc = branding.metaDescription || '';
  const theme = branding.themeColor || '';
  const baseUrl = (env.baseUrl || '').replace(/\/$/, '');
  const url = baseUrl ? (baseUrl + window.location.pathname) : window.location.href;

  if (title) document.title = title;

  if (desc) upsertMeta('meta[name="description"]', { name: 'description' }, desc);
  if (theme) upsertMeta('meta[name="theme-color"]', { name: 'theme-color' }, theme);

  // Open Graph
  if (title) upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  if (desc) upsertMeta('meta[property="og:description"]', { property: 'og:description' }, desc);
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);

  // Imagen OG: usa logo si no hay una específica
  const ogImage = branding.ogImage || branding.logo || '';
  if (ogImage) {
    const ogImgAbs = (baseUrl && ogImage.startsWith('/')) ? (baseUrl + ogImage) : ogImage;
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, ogImgAbs);
  }

  // Twitter Card
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
  if (title) upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  if (desc) upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, desc);
  if (ogImage) {
    const twImgAbs = (baseUrl && ogImage.startsWith('/')) ? (baseUrl + ogImage) : ogImage;
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, twImgAbs);
  }

  // Canonical
  if (baseUrl) upsertLink('canonical', url);

  // Staging: noindex
  if (String(env.mode || '').toLowerCase() === 'staging') {
    upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex,nofollow');
  }
}
