# Guía de Integración Final del Sistema de Informes Psicológicos

Esta guía te ayudará a completar la implementación del sistema con todas las funcionalidades requeridas.

## 1. Configuración Inicial

### Estructura del proyecto

Asegúrate de que la estructura de tu proyecto luzca así:

```
psychological-report-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── aiController.js        (NUEVO)
│   │   ├── authController.js
│   │   ├── baseController.js
│   │   ├── configController.js
│   │   ├── emailController.js     (ACTUALIZADO)
│   │   ├── fileController.js      (NUEVO)
│   │   ├── passwordController.js  (ACTUALIZADO)
│   │   ├── pdfController.js       (NUEVO) 
│   │   └── templateController.js
│   ├── middleware/
│   │   ├── auditMiddleware.js
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── securityHeaders.js
│   ├── models/
│   │   ├── AuditLog.js
│   │   ├── Template.js
│   │   └── User.js
│   ├── routes/
│   │   ├── aiRoutes.js           (NUEVO)
│   │   ├── authRoutes.js
│   │   ├── configRoutes.js
│   │   ├── fileRoutes.js         (NUEVO)
│   │   ├── index.js
│   │   ├── reportRoutes.js       (NUEVO)
│   │   └── templateRoutes.js
│   ├── services/
│   │   ├── aiService.js          (NUEVO)
│   │   ├── emailService.js       (NUEVO)
│   │   └── fileService.js        (NUEVO)
│   └── server.js                  (ACTUALIZADO)
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   ├── auth.js           (NUEVO)
│   │   │   └── main.js           (ACTUALIZADO)
│   │   └── images/
│   ├── forgot-password.html
│   ├── index.html                 (ACTUALIZADO)
│   ├── login.html                 (ACTUALIZADO)
│   ├── register.html              (NUEVO)
│   ├── reset-password.html
│   └── verify-email.html
├── uploads/                       (NUEVA CARPETA)
│   ├── logos/
│   ├── signatures/
│   ├── watermarks/
│   ├── headers/
│   ├── footers/
│   ├── reports/
│   └── temp/
├── .env                          (ACTUALIZADO)
├── package.json                  (ACTUALIZADO)
├── README.md                     (NUEVO)
└── setup.sh                      (NUEVO)
```

### Instalación

1. Ejecuta el script de configuración:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. Instala dependencias adicionales:
   ```bash
   npm install openai@4.0.0 --save  # Si planeas usar OpenAI
   ```

## 2. Configuración de la API de IA

Para integrar el Asistente IA con OpenAI:

1. Obtén una clave API de OpenAI en https://platform.openai.com/account/api-keys

2. Agrega la clave a tu archivo `.env`:
   ```
   OPENAI_API_KEY=tu_clave_api_aquí
   ```

3. Modifica `backend/services/aiService.js` para usar la API de OpenAI:

```javascript
const { OpenAI } = require('openai');

// Inicialización del cliente
const initialize = (config = {}) => {
    if (!process.env.OPENAI_API_KEY && !config.apiKey) {
        console.warn('OpenAI API key not found. AI features will use fallback mode.');
        return;
    }
    
    aiClient = new OpenAI({ 
        apiKey: config.apiKey || process.env.OPENAI_API_KEY 
    });
    
    console.log('OpenAI client initialized');
};

// Generación de respuestas
const generateResponse = async (prompt, options = {}) => {
    // ... resto del código ...
    
    // Implementación real con OpenAI
    const completion = await aiClient.chat.completions.create({
        model: options.model || "gpt-3.5-turbo",
        messages: [
            { role: "system", content: options.systemPrompt || "You are a helpful assistant for psychological reports." },
            { role: "user", content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
    });
    
    return completion.choices[0].message.content;
    
    // ... resto del código ...
};
```

## 3. Ajustes Finales para la Generación de PDF

Para asegurarte de que la generación de PDF funcione correctamente:

1. Crea la carpeta de temporales:
   ```bash
   mkdir -p temp
   ```

2. Asegúrate de que PDFKit tenga las fuentes correctas:
   ```bash
   # En sistemas basados en Debian/Ubuntu
   sudo apt-get install fonts-liberation
   
   # En macOS
   # No se requiere instalación adicional
   
   # En Windows
   # Asegúrate de tener instaladas las fuentes Arial, Times New Roman, etc.
   ```

## 4. Prueba del Sistema

Para probar que todo funciona correctamente:

1. Inicia el servidor:
   ```bash
   npm run dev
   ```

2. Abre el navegador en http://localhost:5000

3. Realiza las siguientes pruebas:
   - Registro de usuario
   - Inicio de sesión
   - Verificación de email (en desarrollo se mostrarán los tokens en la consola)
   - Personalización de la interfaz
   - Creación y edición de plantillas
   - Generación de informes
   - Exportación a PDF
   - Uso del asistente IA

## 5. Solución de Problemas Comunes

### Error de conexión a MongoDB

```
Error: MongoNetworkError: failed to connect to server
```

**Solución**: Asegúrate de que MongoDB está corriendo:
```bash
sudo systemctl start mongod   # Para Linux
brew services start mongodb-community  # Para macOS
```

### Error en el envío de correos

```
Error: Invalid login
```

**Solución**: Verifica tus credenciales de email en `.env` o utiliza el modo de prueba:
```
EMAIL_TEST_MODE=true
```

### Error en la generación de PDF

```
Error: font not found
```

**Solución**: Instala las fuentes necesarias o modifica el controlador `pdfController.js` para usar fuentes disponibles en tu sistema.

### Error con el Asistente IA

```
Error: Failed to generate AI response
```

**Solución**: Verifica que tienes configurada correctamente la API key o activa el modo de simulación:
```
AI_SERVICE_MOCK=true
```

## 6. Despliegue a Producción

Cuando estés listo para desplegar en producción:

1. Cambia las configuraciones en `.env`:
   ```
   NODE_ENV=production
   EMAIL_TEST_MODE=false
   MONGO_URI=tu_uri_de_mongo_en_produccion
   ```

2. Inicia el servidor en modo producción:
   ```bash
   npm start
   ```

3. Considera usar un servicio como PM2 para gestionar el proceso:
   ```bash
   npm install pm2 -g
   pm2 start backend/server.js --name psychological-reports
   ```

## Conclusión

¡Felicidades! Has completado la implementación de un sistema completo de Informes Psicológicos. Este sistema incluye todas las funcionalidades solicitadas:

✅ Generación de PDF funcional
✅ Integración de correo electrónico
✅ Asistente IA para redacción y mejora de informes
✅ Sistema de manejo de archivos para logos, firmas, etc.

Para cualquier mejora adicional o personalización, consulta la documentación disponible en el README.md o contacta al desarrollador.