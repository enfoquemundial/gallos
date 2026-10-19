# Perfil privado de WhatsApp

Estado: código preparado; activar solo después de crear Firestore y publicar sus reglas. No se envían notificaciones automáticamente.

## Activación en Firebase Console

1. En el proyecto `tu-norte`, abre Firestore Database y crea una base **Standard**, con ID **(default)** y en **modo de producción**. Elige la ubicación antes de confirmar; la ubicación de una base no se cambia después. No actives modo de prueba.
2. En la pestaña **Reglas**, sustituye las reglas iniciales por el contenido completo de `firestore.rules` de esta propuesta y pulsa **Publicar**. Estas reglas están diseñadas para una base nueva dedicada a esta web. Si ya existen otras colecciones con reglas, deben revisarse antes de reemplazarlas.
3. Publica la propuesta de GitHub solo después de estos pasos.
4. Entra con una cuenta de prueba propia, guarda el WhatsApp con `+` y código de país y confirma que aparece en **Firestore Database → Datos → users → UID del usuario**.

## Datos y finalidad

Cada documento `users/{uid}` contiene `uid`, `displayName`, `email`, `whatsapp`, `createdAt`, `updatedAt`, `notificationsConsent`, `consentVersion` y `consentAt`. `createdAt` es la fecha del primer guardado del perfil, no la fecha histórica de creación de la cuenta Auth; esa fecha original se consulta en Authentication → Usuarios. Los tiempos de guardado y aceptación son del servidor.

El formulario dice: «Tu WhatsApp se usará únicamente para enviarte notificaciones sobre próximos en vivo de Tu Norte». La casilla de aceptación empieza desmarcada. El número es obligatorio para completar este flujo y no se verifica por código. No se escribe en localStorage, no se imprime en logs y no se añade a URLs.

Cada usuario puede leer solo su documento por UID y guardar su perfil; no puede listar usuarios ni leer perfiles ajenos. El propietario del proyecto lo consulta mediante Firebase Console con sus permisos IAM, no mediante una puerta de administrador pública en la web. Las reglas rechazan campos adicionales, números sin formato internacional y cambios en la fecha original del perfil.

Para una solicitud de baja, el administrador puede poner `notificationsConsent` en `false` desde la consola. No enviar avisos a ese usuario. El formulario volverá a solicitar aceptación la próxima vez que entre. Cualquier futura integración de envío debe comprobar el consentimiento vigente y ofrecer una forma de darse de baja. Esta propuesta no implementa campañas, envío de mensajes ni panel de administración.

## Verificación

- Cuenta nueva, correo o Google: formulario obligatorio antes de continuar.
- Sesión ya abierta sin perfil: también se solicita el WhatsApp.
- Perfil completo: no se vuelve a pedir al entrar o recargar.
- Número sin `+`, inválido o sin aceptación: no se guarda.
- Error de conexión o permisos: se muestra un error y permite reintentar o cerrar sesión; no se simula un guardado exitoso.
- Cierre de sesión mientras carga o guarda: se descartan los resultados de la sesión anterior.
- En el simulador de reglas: un usuario no puede leer o escribir `users/otroUID`, listar `users`, escribir campos `admin`/`role`, ni falsificar los tiempos. Un visitante anónimo no puede acceder.
- Validar las reglas publicadas con dos cuentas de prueba antes de dar el flujo por finalizado. Las comprobaciones automatizadas locales usan mocks y no sustituyen estas pruebas.

El flujo funciona en GitHub Pages y en el futuro VPS Hostinger con el mismo proyecto Firebase. El diálogo exige el perfil en la interfaz; los recursos públicos siguen siendo públicos y el control de vídeo requiere una autorización independiente en Cloudflare/backend.
