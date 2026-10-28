# Demo compartida de apuestas (sin dinero real)

El usuario autorizó explícitamente activar permisos limitados de demostración. Se añadieron únicamente reglas para demoRooms/{room}/offers/{id} en Firebase Console; el editor las compiló y la versión publicada figura como activa. Se conservaron los perfiles privados. NO se desplegaron los permisos del panel administrativo.

## Uso
Iniciar sesión con dos cuentas diferentes en navegadores/perfiles distintos o dos dispositivos. Elegir la MISMA provincia y gallera. Un usuario selecciona monto normal o ventaja y pulsa Publicar demo en su lado. El otro ve la oferta y acepta el lado opuesto. Se actualiza como Emparejada. El autor puede cancelar ofertas abiertas; expiran para aceptación a los diez minutos. Se muestran las últimas treinta ofertas de la sala.

## Garantías de alcance
- Solo ofertas ficticias, ninguna reserva, depósito, retiro, premio o modificación de billetera.
- Las reglas comprueban autor, monto permitido, ventaja de mitad, fechas del servidor y cambios de estado.
- Aceptación por transacción, no puede aceptarla el autor ni cambiarla un segundo contrincante tras emparejarse.
- Las reglas limitan consultas a cincuenta documentos. No son rate limiting de producción ni sustituyen App Check.
- No hay liquidación ni ganador financiero. El futuro backend real debe implementar reservas, cierres, idempotencia, resultados y auditoría.
- No aparecen correos, nombres privados ni WhatsApp de otros usuarios en las ofertas.
- firestore-demo-live.rules refleja las reglas activas (perfiles + demo). firestore.rules conserva la propuesta más amplia con panel todavía no desplegada.

Actualización: al publicar ofertas recíprocas en lados contrarios se emparejan automáticamente. Las dos ofertas se actualizan en una transacción y las reglas comprueban vínculos recíprocos con getAfter. Para 100 a 50 debe haber una oferta que aporte 100 y otra que aporte 50; no se emparejan dos ofertas que ambas aporten 100 contra 50. Aceptar demo genera la oferta recíproca cuando hace falta.
