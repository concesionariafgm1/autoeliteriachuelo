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
    clientId: null,
    domain: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--clientId' && args[i + 1]) {
      params.clientId = args[i + 1];
      i++;
    } else if (args[i] === '--domain' && args[i + 1]) {
      params.domain = args[i + 1];
      i++;
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
    if (!params.clientId) {
      console.error('❌ Uso: node createClient.js --clientId "autoelite" --domain "www.autoelite.com.ar"');
      process.exit(1);
    }

    if (!params.domain) {
      console.error('❌ Uso: node createClient.js --clientId "autoelite" --domain "www.autoelite.com.ar"');
      process.exit(1);
    }

    // Initialize Firebase Admin using Application Default Credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });

    const db = admin.firestore();

    console.log(`📝 Creando cliente: ${params.clientId}`);
    console.log(`🌐 Dominio: ${params.domain}`);

    // Step 1: Upsert clients/{clientId}
    console.log(`⚙️  Creando documento: clients/${params.clientId}`);
    await db.collection('clients').doc(params.clientId).set(
      {
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    console.log(`✓ Documento clients/${params.clientId} creado/actualizado`);

    // Step 2: Upsert clients/{clientId}/settings/public
    console.log(`⚙️  Creando documento: clients/${params.clientId}/settings/public`);
    const publicSettings = {
      brandName: '',
      logo: '',
      phone: '',
      email: '',
      address: '',
      heroTitle: '',
      heroSubtitle: '',
      whatsapp: '',
      templateVariant: 'classic'
    };

    await db
      .collection('clients')
      .doc(params.clientId)
      .collection('settings')
      .doc('public')
      .set(publicSettings, { merge: true });
    console.log(`✓ Documento clients/${params.clientId}/settings/public creado/actualizado`);

    // Step 3: Upsert domains/{domain}
    console.log(`⚙️  Creando documento: domains/${params.domain}`);
    await db.collection('domains').doc(params.domain).set(
      {
        clientId: params.clientId
      },
      { merge: true }
    );
    console.log(`✓ Documento domains/${params.domain} creado/actualizado`);

    // Success
    console.log('\n✅ Cliente creado exitosamente:', {
      clientId: params.clientId,
      domain: params.domain,
      documents: [
        `clients/${params.clientId}`,
        `clients/${params.clientId}/settings/public`,
        `domains/${params.domain}`
      ]
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code) {
      console.error('   Código:', err.code);
    }
    process.exit(1);
  }
})();
