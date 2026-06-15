# MVP de pagos AZUL y PayPal

## Hallazgos confirmados

### AZUL / Servicios Digitales Popular

- La documentacion oficial publica Webservices en JSON, HTTP Post Form y SOAP.
- Ofrece ambiente de pruebas y produccion.
- Incluye `Hold`, `ProcessPost`, `ProcessVoid`, `Refund`, consultas, tokenizacion y captura parcial/multiple.
- El `ProcessPost` de una retencion debe ejecutarse antes de siete dias.
- El ambiente JSON de pruebas documentado es `https://pruebas.azul.com.do/WebServices/JSON/Default.aspx`.
- Produccion usa `https://pagos.azul.com.do/WebServices/JSON/Default.aspx`, con sitio alterno de contingencia.
- La integracion directa requiere backend, TLS, certificacion, PCI DSS y VPN o autenticacion mutua con certificados.
- AZUL liquida al comercio afiliado. No se encontro evidencia de split automatico a propietarios individuales.
- El uso de US$300 debe confirmarse en la afiliacion y configuracion monetaria del comercio AZUL.

### PayPal

- Orders/Payments API permite `AUTHORIZE`, `CAPTURE`, `VOID`, reautorizacion y reembolso.
- La autorizacion puede durar 29 dias, con periodo recomendado de captura de tres dias.
- PayPal Payouts permite enviar dinero a receptores en Republica Dominicana, sujeto a aprobacion del producto.
- Delayed Disbursement requiere que RuedaRD sea partner aprobado y que cada dueno sea incorporado como vendedor.
- PayPal lista Republica Dominicana con capacidad de enviar, recibir y retirar, pero la moneda local no figura como totalmente localizada.

## Diseno recomendado para RuedaRD

### Formula diaria

El dueno define el precio y recibe ese importe completo. La comision de RuedaRD se anade al precio del cliente:

`Total cliente = precio dueno + US$10 de fee por dia + seguro`

Ejemplo con precio del dueno de US$40 y seguro basico de US$5:

- Dueno recibe: US$40 por dia.
- RuedaRD recibe: US$10 por dia.
- Seguro: US$5 por dia.
- Cliente paga: US$55 por dia.

Para una renta de 3 dias: dueno US$120, RuedaRD US$30, seguro US$15 y cliente US$165, mas el deposito retenido de US$300.

1. Autorizar renta + deposito de US$300 con AZUL o PayPal.
2. Capturar solamente el importe de la renta cuando se entregue el vehiculo.
3. Mantener el deposito autorizado mientras la ventana del proveedor lo permita.
4. Al devolver sin danos, ejecutar `ProcessVoid` en AZUL o `void` en PayPal.
5. Con danos documentados, capturar la cantidad permitida segun contrato y reglas del proveedor.
6. Registrar la ganancia del dueno en un libro contable interno.
7. Liberar el pago del dueno 1-2 dias laborables despues del cierre mediante transferencia o PayPal Payouts.

Para alquileres de 7 dias o mas con AZUL, no debe confiarse en un unico Hold inicial: debe definirse captura anticipada, nueva autorizacion o una politica de deposito distinta. Con PayPal, despues del periodo de honor de 3 dias puede ser necesaria una reautorizacion, aunque la autorizacion total pueda durar hasta 29 dias.

## Lo que funciona en esta prueba

- Flujo de autorizacion aprobado y rechazado.
- Identificador de transaccion y codigo de autorizacion simulados.
- Clave de idempotencia para evitar operaciones duplicadas.
- Deposito tratado por separado del precio de la renta.
- Registro contable de dueno, seguro y comision de RuedaRD.
- Mensajes de error y comprobante visible para demostraciones.

Tarjeta aprobada: `4111 1111 1111 1111`

Tarjeta rechazada: `4000 0000 0000 0002`

PayPal aprobado: `comprador@ejemplo.com`

PayPal rechazado: `rechazo@ejemplo.com`

No se mueve dinero real ni se almacenan CVV o numeros completos de tarjeta.

## Para conectar Azul en produccion

1. Afiliar RuedaRD como comercio AZUL y crear cuenta PayPal Business.
2. Confirmar con Azul las operaciones disponibles: autorizacion, captura, anulacion y reembolso.
3. Implementar un backend HTTPS. Las credenciales nunca deben estar en el HTML.
4. Usar tokenizacion o formulario alojado por la pasarela para reducir alcance PCI DSS.
5. Guardar unicamente token, ultimos cuatro digitos, marca, estado y referencias.
6. Verificar la autenticidad de respuestas y notificaciones.
7. Anadir reintentos controlados, idempotencia persistente y conciliacion diaria.
8. Procesar el saldo del dueno mediante transferencia bancaria o PayPal Payouts 1-2 dias laborables despues de cerrar la renta.
9. Definir reglas para depositos, danos, anulaciones, reembolsos y disputas.
10. Completar pruebas de certificacion antes de activar produccion.

## Estados recomendados

`CREATED -> AUTHORIZING -> AUTHORIZED -> CAPTURED -> COMPLETED`

Rutas alternativas: `DECLINED`, `VOIDED`, `REFUNDED`, `DISPUTED`.
