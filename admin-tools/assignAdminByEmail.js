#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ============================================
// PARSE ARGUMENTS
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    email: null,
    clientId: null,
    revoke: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      params.email = args[i + 1];
      i++;
    } else if (args[i] === '--clientId' && args[i + 1]) {
      params.clientId = args[i + 1];
      i++;
    } else if (args[i] === '--revoke') {
      params.revoke = true;
    }
  }

  return params;
}

// ============================================
// MAIN
// ============================================

(async () => {
  try {
    // Check if GOOGLE_APPLICATION_CREDENTIALS is configured
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('❌ ERROR: Variable GOOGLE_APPLICATION_CREDENTIALS no configurada.');
      console.error('\n📋 Setup requerido:');
      console.error('  1. Obtener serviceAccount.json de Firebase Console');
      console.error('  2. Guardar en admin-tools/serviceAccount.json');
      console.error('  3. Configurar la variable de entorno:');
      console.error('\n     Windows (PowerShell):');
      console.error('     $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\serviceAccount.json"');
      console.error('\n     Linux/Mac:');
      console.error('     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"');
      console.error('\n  4. Re-ejecutar el script');
      process.exit(1);
    }

    // Parse arguments
    const params = parseArgs();

    // Validate required arguments
    if (!params.email) {
      console.error('❌ Uso: node assignAdminByEmail.js --email "admin@x.com" --clientId "autoelite" [--revoke]');
      process.exit(1);
    }

    if (!params.revoke && !params.clientId) {
      console.error('❌ Uso: node assignAdminByEmail.js --email "admin@x.com" --clientId "autoelite" [--revoke]');
      process.exit(1);
    }

    // Initialize Firebase Admin using Application Default Credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });

    // Get user by email
    console.log(`🔍 Buscando usuario: ${params.email}`);
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(params.email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.error(`❌ Usuario no encontrado: ${params.email}`);
      } else {
        console.error(`❌ Error obteniendo usuario:`, err.message);
      }
      process.exit(1);
    }

    const uid = userRecord.uid;
    console.log(`✓ Usuario encontrado - UID: ${uid}`);

    // Set or revoke claims
    let claims;
    if (params.revoke) {
      console.log(`⚠️  Revocando claims para: ${params.email}`);
      claims = {};
    } else {
      console.log(`⚙️  Asignando claims a ${params.email}`);
      claims = {
        clientId: params.clientId,
        role: 'admin'
      };
    }

    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, claims);

    if (params.revoke) {
      console.log('✅ Claims revocados:', {
        email: params.email,
        uid: uid,
        claims: 'vacío (revocado)'
      });
    } else {
      console.log('✅ Claims asignados:', {
        email: params.email,
        uid: uid,
        claims: claims
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
