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

## Alcance

Firebase autentica cuentas. No verifica documento, edad, permisos de apuestas ni pagos. Se retiraron los campos de documento y nacimiento que el registro simulado no verificaba ni guardaba. El nombre se guarda en el perfil Firebase; las confirmaciones del formulario no son una verificación de identidad ni un registro legal persistente.

El saldo y el historial existentes siguen siendo datos demo locales. No son dinero real ni datos privados protegidos por un servidor. La navegación del navegador no protege recursos descargables; para pagos, saldos reales o vídeo restringido se necesita autorización en un backend y, para el vídeo, controles de Cloudflare. No almacenar esos datos ni credenciales privadas en el HTML o en localStorage.

Referencias oficiales: https://firebase.google.com/docs/auth/web/google-signin · https://firebase.google.com/docs/auth/web/password-auth · https://firebase.google.com/docs/auth/web/auth-state-persistence
