# Sistema de Informes Psicológicos

Una aplicación web para profesionales de la psicología que permite crear, gestionar y personalizar informes psicológicos de manera eficiente.

## Características

- 🔒 **Autenticación y seguridad**: Registro, inicio de sesión, recuperación de contraseñas y verificación de email.
- 📝 **Plantillas personalizables**: Crea y personaliza plantillas para diferentes tipos de informes.
- 🎨 **Personalización visual**: Personaliza la apariencia de tus informes con logos, colores y fuentes.
- 📊 **Generación de informes**: Genera informes profesionales en formato PDF.
- 🤖 **Asistente IA**: Obtén sugerencias para redactar secciones de tus informes.
- 💾 **Respaldo automático**: Tus datos se sincronizan automáticamente con el servidor.

## Requisitos previos

- Node.js (v16 o superior)
- MongoDB (v4.4 o superior)
- Navegador web moderno (Chrome, Firefox, Edge)

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tuusuario/psychological-report-system.git
   cd psychological-report-system
   ```

2. Ejecuta el script de configuración:
   ```bash
   bash setup.sh
   ```

3. El script de configuración instalará todas las dependencias y creará el archivo `.env`. Puedes editar este archivo para configurar:
   - Conexión a MongoDB
   - Clave secreta para JWT
   - Configuración de correo electrónico
   - Puerto del servidor

## Uso

### Iniciar en modo desarrollo

```bash
npm run dev
```

### Iniciar en modo producción

```bash
npm start
```

### Acceder a la aplicación

Abre tu navegador y ve a:
```
http://localhost:5000
```

## Estructura del proyecto

```
├── backend/                # Código del servidor
│   ├── config/             # Configuración de la aplicación
│   ├── controllers/        # Controladores de rutas
│   ├── middleware/         # Middleware de Express
│   ├── models/             # Modelos de datos (Mongoose)
│   ├── routes/             # Rutas de la API
│   └── server.js           # Punto de entrada del servidor
│
├── frontend/               # Código del cliente
│   ├── assets/
│   │   ├── css/            # Hojas de estilo
│   │   ├── js/             # JavaScript del cliente
│   │   └── images/         # Imágenes y recursos
│   ├── *.html              # Páginas HTML
│
├── .env                    # Variables de entorno
├── package.json            # Dependencias y scripts
└── setup.sh                # Script de configuración
```

## Guía rápida de uso

1. **Registro e inicio de sesión**:
   - Crea una cuenta con tu correo electrónico profesional
   - Verifica tu correo electrónico
   - Inicia sesión con tus credenciales

2. **Personalización**:
   - Configura los colores, fuentes y logos para tus informes
   - Estos se aplicarán automáticamente a todos tus documentos

3. **Plantillas**:
   - Crea plantillas para diferentes tipos de evaluaciones
   - Añade secciones con diferentes tipos de campos
   - Organiza las secciones según tus necesidades

4. **Creación de informes**:
   - Selecciona una plantilla
   - Completa la información del paciente y los campos requeridos
   - Previsualiza el informe
   - Guarda o exporta a PDF

5. **Asistente IA**:
   - Utiliza el asistente para obtener sugerencias de redacción
   - Genera contenido para conclusiones y recomendaciones

## Solución de problemas

### La aplicación no se conecta a MongoDB

Asegúrate de que:
1. MongoDB está ejecutándose
2. La URL de conexión en el archivo `.env` es correcta
3. No hay un firewall bloqueando la conexión

### Los correos electrónicos no se envían

1. Verifica que las credenciales de email en `.env` son correctas
2. Si usas Gmail, habilita el acceso de aplicaciones menos seguras o genera una contraseña de aplicación

### Otros problemas

Consulta los logs de la aplicación para obtener más información:
```bash
npm run dev -- --verbose
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.