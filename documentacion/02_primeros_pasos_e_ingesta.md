# tribuTACOS — Manual de Usuario

# Capítulo 02: Primeros Pasos e Ingesta de Comprobantes

Guía paso a paso para la inicialización del entorno, selección de contribuyente, ejercicio fiscal e ingesta masiva de archivos XML y documentos SAT.

---

## 1. Puesta en Marcha Inicial

Para arrancar el sistema completo con servidores de backend y frontend sincronizados:

```bash
# Instalación y preparación con base de datos demo
make setup

# Ejecución paralela de servicios (Backend :8010 + Frontend :3000)
make dev
```

La plataforma estará disponible de inmediato en:
* **Interfaz de Usuario:** `http://localhost:3000`
* **API REST y Swagger:** `http://localhost:8010/docs`

---

## 2. Selector de Contribuyente y Ejercicio Fiscal

En el panel lateral izquierdo (*Sidebar*), el usuario dispone de los selectores maestros:

1. **Selector de Contribuyente:** Permite alternar entre diferentes personas físicas registradas en el sistema (por ejemplo, `SHLL250825XYZ - Sheila Shellaquiles Ortega`).
2. **Selector de Ejercicio Fiscal:** Permite navegar instantáneamente entre los ejercicios fiscales **2021 a 2026**, recalculando la base gravable y las tarifas oficiales en menos de 15 milisegundos.
3. **Botón de Sincronización:** Fuerza la reevaluación de los comprobantes y la invalidación de la caché.

---

## 3. Ingesta Masiva de Comprobantes XML

Al hacer clic en el botón principal **"Cargar Comprobantes XML"**, se despliega el modal interactivo de ingesta:

![Modal de Ingesta y Carga de XMLs](img/02_upload_modal.png)

### 3.1 Métodos de Carga Soportados:
* **Arrastrar y Soltar (Drag & Drop):** Arrastre de múltiples archivos `.xml` o carpetas completas directamente sobre el área punteada.
* **Archivos Comprimidos (.ZIP):** Carga de paquetes `.zip` con cientos de facturas timbradas; el backend descomprime y clasifica cada archivo en memoria.
* **Explorador de Archivos:** Clic sobre el área de carga para seleccionar archivos locales desde el explorador del sistema operativo.

### 3.2 Pipeline Automático de Procesamiento:
1. **Validación de Esquema XML:** Comprobación del estándar Anexo 20 (CFDI 3.3 y CFDI 4.0) mediante el parser optimizado en C (`lxml`).
2. **Deduplicación por UUID Fiscal:** Si un comprobante ya fue registrado previamente en la base de datos, se omite de forma idempotente sin duplicar montos.
3. **Clasificación por RFC:** Si el RFC del contribuyente activo coincide con el emisor, se clasifica como *Ingreso / Emitido*; si coincide con el receptor, se clasifica como *Gasto / Deducción / Recibido*.
4. **Invalidación de Caché:** Se actualiza automáticamente el registro en `summary_cache` para reflejar las nuevas cifras en tiempo real.
