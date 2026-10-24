# Activación del panel Tu Norte

La interfaz está en admin.html. No usa auth.js para evitar el recorrido de registro/WhatsApp/ciudades de los clientes. Usa Firebase Authentication con sesiones del navegador y roles verificables en Firestore. Ninguna cuenta de prueba recibe privilegios. El correo dueño de Firebase no define los administradores de la web.

## Activación inicial por el propietario técnico

1. Publicar firestore.rules en las reglas de Cloud Firestore, conservando las reglas de perfiles incluidas. Este archivo del repositorio NO despliega reglas automáticamente.
2. Elegir una cuenta real de Firebase Authentication y copiar su UID. En Firestore crear adminRoles/{UID} con role (string) = owner, active (boolean) = true y email (string) = correo de esa cuenta. El primer propietario se provisiona por consola o Admin SDK de confianza, nunca desde el cliente. No usar las cuentas de prueba. No se ha provisionado ninguna cuenta en esta entrega.
3. Entrar a admin.html. Los siguientes editores/operadores se autorizan desde Equipo con su correo, tras registrarse y completar su perfil. El propietario no puede revocar su propio acceso desde el panel. Las reglas impiden autoasignarse permisos.
4. Para subir archivos, activar Cloud Storage, revisar si exige plan Blaze y aprobar sus costos antes de habilitar facturación. Publicar storage.rules. La referencia a roles de Firestore requiere habilitar el permiso entre servicios solicitado por Firebase. Hasta entonces se pueden usar direcciones HTTPS de archivos ya alojados, después de activar Firestore.
5. Probar con propietario, editor, operador y usuario sin rol; intentar escrituras directas prohibidas. Compilar/probar reglas con Emulator Suite antes de operar. Las reglas preparadas no se han desplegado ni probado contra el proyecto real en esta entrega.

## Funcionamiento

- siteContent/main publica un mapa de reemplazos de medios y textos; el resto de la web conserva sus originales como respaldo. 44 espacios catalogados, incluyendo portada, fondo móvil, mosaico, ciudades, galerías, deportes, logos y video del feed.
- Las fotos nuevas se optimizan en navegador a WebP, lado mayor 1600px. Los archivos subidos son inmutables. Restaurar original quita la referencia; los archivos anteriores se conservan para recuperación. La eliminación física, gestión de archivos huérfanos y subida de animaciones sin perder animación quedan pendientes.
- liveEvents/main es un único evento compartido por las ciudades actuales. Estados preparado/en vivo/finalizado y UID público de Cloudflare. No guardar claves de emisión. Cambiar de estado no enciende una cámara ni crea un canal del proveedor. Si no hay evento configurado se conserva el reproductor existente. No ofrece protección de URL con tokens firmados todavía.
- adminAudit registra cambios del panel y no permite reescribirlos. No sustituye auditoría financiera de servidor; las escrituras privilegiadas desde consola no quedan registradas ahí.
- Los clientes leen contenido editorial público y el evento con autenticación. No se guardan datos personales en documentos públicos.
- Apuestas, pagos, saldos y liquidaciones NO se han implementado. Botones deshabilitados, sin cambios a dinero real.
- Usuarios y WhatsApp solo para propietarios; listado paginado. No se envían avisos automáticamente.

## Pendientes de producción

Activación real y pruebas de permisos/reglas, almacenamiento y costos, pruebas visuales con navegador, MFA/seguridad reforzada para administradores, eliminación de medios, edición completa de textos y orden del mosaico, varios eventos simultáneos por gallera, copias de seguridad, permisos financieros/servidor, pasarela y pruebas completas. Cambiar propietario del proyecto Firebase es un trámite distinto de cambiar cuentas del panel.
