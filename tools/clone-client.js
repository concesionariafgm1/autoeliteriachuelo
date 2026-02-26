#!/usr/bin/env node
/**
 * Clonar un sitio para un nuevo cliente (1 cliente = 1 web).
 * Uso:
 *   node tools/clone-client.js --out ../cliente-nuevo --clientId acme --name "ACME Consultora" --pack consulting
 */
const fs = require('fs');
const path = require('path');

function arg(name, def=null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  return process.argv[i+1] ?? def;
}

const OUT = arg('out');
if (!OUT) {
  console.error('Falta --out');
  process.exit(1);
}
const clientId = arg('clientId', 'cliente');
const name = arg('name', 'Mi Negocio');
const pack = arg('pack', 'consulting');

const SRC = path.resolve(__dirname, '..');
const DEST = path.resolve(process.cwd(), OUT);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(SRC, DEST);

// Patch config/site.js
const cfgPath = path.join(DEST, 'config', 'site.js');
let cfg = fs.readFileSync(cfgPath, 'utf8');
cfg = cfg.replace(/pack:\s*'[^']*'/, `pack: '${pack}'`);
cfg = cfg.replace(/clientId:\s*'[^']*'/, `clientId: '${clientId}'`);
cfg = cfg.replace(/name:\s*'[^']*'/, `name: '${name}'`);
fs.writeFileSync(cfgPath, cfg, 'utf8');

console.log('Clonado listo en:', DEST);
console.log('Editá config/site.js para branding, redes y layout.');
