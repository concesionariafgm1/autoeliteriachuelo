# Admin Tools - Setup Guide

## Seguridad: Credenciales de Firebase Admin

Este directorio contiene scripts administrativos que requieren credenciales de Firebase.

### ⚠️ IMPORTANTE: Nunca commitear `serviceAccount.json`

El archivo `serviceAccount.json` contiene credenciales sensibles y **NUNCA debe ser comiteado** al repositorio. Está incluido en `.gitignore`.

### Setup Local

#### 1. Obtener el serviceAccount.json desde Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar el proyecto
3. Ir a: **Project Settings > Service Accounts**
4. Hacer clic en **Generate New Private Key**
5. Se descargará un archivo JSON con las credenciales

#### 2. Colocar el archivo localmente

Copiar el archivo descargado a:
```
admin-tools/serviceAccount.json
```

**Este archivo nunca será comiteado** (está en .gitignore).

#### 3. Alternativa: Usar Application Default Credentials (Recomendado)

Si está usando credenciales de Application Default, configurar la variable de entorno:

```bash
# En Windows (PowerShell):
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccount.json"

# En Linux/Mac:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
```

### Scripts Disponibles

- **`assignAdminByEmail.js`**: Asigna permisos de admin a un usuario por email
- **`createClient.js`**: Crea un cliente en la base de datos
- **`setClaim.js`**: Asigna claims personalizados a un usuario

### Uso

```bash
# Ejemplo
node assignAdminByEmail.js --email admin@example.com --clientId autoelite
```

### Seguridad

- Los scripts verifican automáticamente si las credenciales están configuradas
- Si falta la configuración, mostrarán un error claro
- Las credenciales nunca se imprimen en consola
