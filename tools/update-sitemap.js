#!/usr/bin/env node
/**
 * Actualiza sitemap.xml reemplazando __BASE__ con env.baseUrl de config/site.js
 * Uso: node tools/update-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sitePath = path.join(root, 'config', 'site.js');
const sitemapPath = path.join(root, 'sitemap.xml');

const site = fs.readFileSync(sitePath, 'utf8');
const m = site.match(/baseUrl:\s*["']([^"']*)["']/);
const baseUrl = (m && m[1] ? m[1] : '').replace(/\/$/, '');

if (!baseUrl) {
  console.error('[update-sitemap] No se encontró env.baseUrl en config/site.js');
  process.exit(1);
}

let xml = fs.readFileSync(sitemapPath, 'utf8');
xml = xml.replace(/__BASE__/g, baseUrl);
fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log('[update-sitemap] sitemap.xml actualizado con baseUrl:', baseUrl);
