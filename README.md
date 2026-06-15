# RuedaRD MVP

Demo navegable de una plataforma de alquiler de vehiculos en Republica Dominicana.

## Cuentas demo

En la pantalla de acceso hay botones directos para probar estos perfiles:

- Rentador: `rentador@demo.ruedard.do`
- Socio individual: `socio@demo.ruedard.do`
- Empresa Rent Car: `empresa@demo.ruedard.do`
- Codigo 2FA de prueba: `246810`

Los pagos, retenciones, retiros y verificaciones son simulaciones. No se procesan fondos reales.

## Demo en GitHub Pages

GitHub Pages publica este portal desde la rama `main`, carpeta `/(root)`.

La version de Pages guarda cuentas, solicitudes de vehiculos, reservas y saldos demo en `localStorage` del navegador. Cada visitante utiliza datos aislados en su dispositivo.

## Backend local

```bash
cd backend-mvp
npm start
```

Abrir `http://127.0.0.1:8787/`.

El backend incluido es un MVP con persistencia JSON. No debe usarse en produccion sin base de datos, cifrado de contrasenas, WebAuthn criptografico completo, almacenamiento seguro de documentos y proveedores reales de identidad y pagos.
