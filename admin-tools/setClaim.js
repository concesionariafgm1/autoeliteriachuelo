const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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

// Initialize Firebase Admin using Application Default Credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const uid = "szlEEJYT7ceL0zbKkxdHVObDkWF2";

(async () => {
  try {
    await admin.auth().setCustomUserClaims(uid, {
      role: "admin",
      clientId: "concesionaria_demo"
    });

    console.log("✅ Custom claims asignados correctamente");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error asignando custom claims:", err);
    process.exit(1);
  }
})();
