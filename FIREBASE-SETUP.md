# Activar Firebase Authentication

La integración está preparada, pero no debe publicarse con `firebase-config.js` en `null`.

1. Abre https://console.firebase.google.com/ con tu cuenta Google. Crea un proyecto «Tu Norte». Google Analytics es opcional y no se necesita para el acceso. No hace falta activar facturación para empezar.
2. En Configuración del proyecto → Tus apps, registra una app web (icono `</>`) llamada «Tu Norte Web». No es necesario configurar Firebase Hosting: esta web sigue en GitHub Pages.
3. Copia el objeto `firebaseConfig` y asígnalo a `window.TU_NORTE_FIREBASE_CONFIG` en `firebase-config.js`, sustituyendo `null`. Esta configuración web es pública. No uses un archivo de cuenta de servicio, clave privada, contraseña ni secreto OAuth.
4. En Authentication → Comenzar → Método de acceso habilita **Correo electrónico/contraseña** (sin enlace de acceso por correo) y **Google**. Selecciona un correo de asistencia al habilitar Google y guarda.
5. En Authentication → Configuración → Dominios autorizados agrega **enfoquemundial.github.io**. Es solo el dominio: sin `https://` y sin `/gallos/`. Conserva el dominio Firebase del proyecto como `authDomain` en la configuración. Se utiliza una ventana emergente de Google, no una redirección entre dominios.
6. Para probar localmente, autoriza `localhost` explícitamente y usa un servidor HTTP, no abras los HTML como archivos.
7. Revisa las plantillas de correo de Authentication para recuperación de contraseña. La acción de cambio de contraseña usa el manejador alojado por Firebase y vuelve a `/gallos/login.html`.

## Prueba antes de publicar

- Registro con un correo de prueba propio: aparece en Authentication → Usuarios. No se acepta la antigua cuenta demo ni una marca `gc_auth` del navegador.
- Cerrar sesión e iniciar sesión con correo y contraseña; contraseña incorrecta muestra un mensaje y permite reintentar.
- Continuar con Google; el usuario elige su cuenta y realiza personalmente el inicio de sesión. Cancelar la ventana no debe romper la página.
- Recargar y cerrar/reabrir el navegador: persiste la sesión hasta cerrar sesión. Otra pestaña del mismo sitio refleja el cierre de sesión.
- Recuperar contraseña con un correo propio, recibir el mensaje, abrir el enlace y cambiarla personalmente. Verificar acceso con la nueva contraseña.
- Abrir `evento.html` y `billetera.html` sin sesión lleva al login. Tras entrar regresa a esa página. Un `next` externo o desconocido se ignora.
- Verificar en móvil y escritorio los formularios y la navegación. Las páginas públicas, incluyendo `en-vivo.html`, siguen disponibles sin sesión.
- Verificar el reproductor Cloudflare en las páginas que lo incluyen. `stream-config.js`, `stream-player.js` y los iframes no se cambian.

## Migración a VPS Hostinger

La autenticación no depende de GitHub Pages. Copia los mismos archivos al VPS y conserva el proyecto Firebase y su configuración pública: los usuarios existentes se mantienen. Sirve la web con HTTPS y autoriza el dominio final (y `www` si se utiliza) en Authentication → Configuración → Dominios autorizados. No cambies `authDomain` por el dominio del VPS sin configurar previamente un dominio de autenticación personalizado; el dominio Firebase funciona con el flujo de ventana emergente actual.

Los enlaces de navegación son relativos y el regreso del correo de recuperación se calcula desde la URL de `login.html`, por lo que funcionan tanto en `/gallos/` como en la raíz del dominio. Revisa también las plantillas de correo y cualquier restricción HTTP de la API key para incluir el dominio nuevo. Cada usuario deberá iniciar sesión de nuevo en el dominio nuevo: las cuentas se conservan, pero el almacenamiento del navegador pertenece al dominio anterior. Durante la transición pueden permanecer autorizados ambos dominios.

Para funciones privadas que se añadan en Hostinger, el backend debe verificar los ID tokens con Firebase Admin SDK y aplicar sus permisos. Las credenciales Admin se guardan exclusivamente en el servidor. El VPS por sí solo no transforma el saldo demo en un saldo real ni protege un vídeo público.

## Límites de esta integración

Firebase autentica cuentas. No verifica documento, edad, permisos de apuestas ni pagos. Se retiraron los campos de documento y nacimiento que el registro simulado no verificaba ni guardaba. El nombre se guarda en el perfil Firebase; las confirmaciones del formulario no son una verificación de identidad ni un registro legal persistente.

El saldo y el historial existentes siguen siendo datos demo locales. No son dinero real ni datos privados protegidos por un servidor. La navegación del navegador no protege recursos descargables; para pagos, saldos reales o vídeo restringido se necesita autorización en un backend y, para el vídeo, controles de Cloudflare. No almacenar esos datos ni credenciales privadas en el HTML o en localStorage.

Referencias oficiales: https://firebase.google.com/docs/auth/web/google-signin · https://firebase.google.com/docs/auth/web/password-auth · https://firebase.google.com/docs/auth/web/auth-state-persistence

