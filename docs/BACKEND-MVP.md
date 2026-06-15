# RuedaRD Backend MVP

Backend local funcional, sin dependencias externas.

```bash
npm start
```

Abrir `http://127.0.0.1:8787`.

Incluye almacenamiento de solicitudes de propietarios, reservas y aceptacion contractual en `db.json`. Los endpoints disponibles son `GET /api/health`, `GET /api/vehicles`, `POST /api/owner-applications` y `POST /api/reservations`.

Azul y PayPal continuan como sandbox. Para produccion hacen falta credenciales comerciales aprobadas, PostgreSQL, autenticacion, cifrado, almacenamiento privado de documentos, auditoria y webhooks. Nunca se deben guardar numeros completos de tarjetas.
