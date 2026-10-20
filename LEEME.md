# Tarjetas digitales de asesores

Cada asesor tiene su propia tarjeta en internet, su código QR para imprimir y su archivo de contacto (.vcf).

- Tarjeta de Adrián: https://ninno103515-oss.github.io/tarjetas-digitales/adrian-olguin/
- Cada tarjeta nueva queda en: `https://ninno103515-oss.github.io/tarjetas-digitales/RUTA-DEL-ASESOR/`

## Qué hay en esta carpeta

| Archivo o carpeta | Para qué sirve | ¿Se edita a mano? |
|---|---|---|
| `asesores.json` | **Los datos de todos los asesores.** Es lo único que normalmente cambias. | Sí |
| `recursos/fotos/` | Las fotos de los asesores. | Sí (agregas fotos) |
| `recursos/logo-elektra.png` | El logo (no lo cambies). | No |
| `plantilla/` | El diseño (colores, botones, textos fijos). | Solo si quieres cambiar el diseño |
| `docs/` | Las tarjetas ya listas que se publican en internet. Se crean solas. | **No** |
| `vista-previa/` | Tarjetas de prueba (las que tienen `"publicar": false`). No se publican. | **No** |
| `codigos-qr/` | Los QR listos para imprimir, uno por asesor (`ruta.png`). | **No** |

> `docs/`, `vista-previa/` y `codigos-qr/` se borran y se vuelven a crear cada vez que corres `npm run generar`.

## Los 3 comandos

Abre una terminal en esta carpeta (en el Explorador de archivos: clic derecho en la carpeta → "Abrir en Terminal") y escribe:

| Comando | Qué hace |
|---|---|
| `npm run generar` | Crea o actualiza todas las tarjetas, sus .vcf y sus QR. |
| `npm run probar` | Revisa que los links respondan, que el .vcf esté bien y que cada QR se pueda leer. |
| `npm run ver` | Abre las tarjetas en tu computadora: entra a http://localhost:8090 (para cerrar: Ctrl + C). |

## Cómo agregar a un compañero

1. Pídele estos datos: nombre, apellidos, puesto, sucursal, WhatsApp (10 dígitos), su link de Google Maps de la sucursal, **su** link de solicitud de crédito con **su** código de asesor, horario y una foto de frente.
2. Guarda su foto en `recursos/fotos/` con un nombre sin espacios ni acentos, por ejemplo `juan-perez.jpg`.
3. Abre `asesores.json` y copia el bloque de un asesor (desde `{` hasta `}`), pégalo después de otro y pon una coma entre los dos bloques. Cambia los datos:

```json
{
  "ruta": "juan-perez",
  "publicar": true,
  "nombre": "Juan",
  "apellidos": "Pérez García",
  "puesto": "Asesor de Ventas a Crédito",
  "sucursal": "Elektra Nombre de la Sucursal",
  "whatsapp": "5512345678",
  "telefono": "5512345678",
  "mensajeWhatsApp": "Hola Juan, vi tu tarjeta digital y quiero información sobre un crédito",
  "mapa": "https://maps.app.goo.gl/...",
  "linkCredito": "https://bazsolicitudunica.com.mx/...",
  "horario": "Lunes a domingo, 9:00 a 21:00",
  "productos": ["movilidad", "hogar", "conectividad"],
  "requisitos": ["INE vigente", "Comprobante de domicilio", "Número de celular"],
  "foto": "recursos/fotos/juan-perez.jpg"
}
```

Reglas importantes:

- **`ruta`**: es la parte final del link. Solo minúsculas, números y guiones, sin acentos ni espacios (`maria-lopez`, no `María López`). No la cambies después de imprimir el QR, porque el QR dejaría de funcionar.
- **`publicar`**: `true` para que salga en internet; `false` para dejarla solo de prueba.
- **`productos`**: solo puedes usar `movilidad`, `hogar` y `conectividad`, en el orden que quieras.
- **Si falta un dato**, ponlo entre corchetes, por ejemplo `"[FALTA LINK DE GOOGLE MAPS]"`. El botón aparecerá desactivado y `npm run generar` te avisará.
- **`fotoRecorte`** (opcional): si la cara sale cortada, indica el cuadro a recortar en pixeles de la foto original, por ejemplo `"fotoRecorte": { "izquierda": 0, "arriba": 290, "tamano": 900 }`. Sin esto, el recorte se hace automáticamente.

4. Corre `npm run generar` y luego `npm run ver` para ver cómo quedó.
5. Publica los cambios (ver abajo).
6. Imprime su QR desde `codigos-qr/juan-perez.png`.

Los asesores Juan Pérez y María López que ya están en el archivo son **de ejemplo** (con `"publicar": false`). Puedes borrarlos cuando quieras.

## Cómo actualizar datos

1. Cambia el dato en `asesores.json` (por ejemplo, el horario).
2. `npm run generar`
3. Publica los cambios (abajo).

El link y el QR **no cambian** al actualizar datos, mientras no cambies la `ruta`. No hace falta reimprimir.

## Cómo publicar los cambios

Las tarjetas están en GitHub Pages (gratis). Para publicar, en la terminal de esta carpeta:

```
npm run generar
git add asesores.json recursos docs codigos-qr plantilla generar.js
git commit -m "Actualizo tarjetas"
git push
```

Entre 1 y 3 minutos después, los cambios ya se ven en el link. Si en el celular sigue viéndose lo anterior, recarga la página.

Para revisar que todo quedó en línea: `node probar.js --en-linea`

## Privacidad

El proyecto es **público** en GitHub (así lo exige el plan gratuito de GitHub Pages). Cualquiera puede ver los datos que pongas en `asesores.json` y las fotos. Pon solo lo que de todos modos aparece en la tarjeta. Nunca pongas contraseñas, datos de clientes ni documentos.
