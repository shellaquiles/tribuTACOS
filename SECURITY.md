# Política de Seguridad 🛡️

## Compromiso de Privacidad y Soberanía Local

**tribuTACOS** procesa datos fiscales y contables altamente sensibles (RFCs, UUIDs fiscales, cadenas originales del SAT, montos de ingresos, gastos y retenciones). 

El diseño arquitectónico de **tribuTACOS** opera bajo una estricta política de **soberanía local**:
* Toda la base de datos relacional y los archivos procesados residen exclusivamente en la máquina del usuario (`backend/tributacos.db`).
* La plataforma **no transmite datos a servidores remotos, telemetría de terceros ni proveedores externos de IA en la nube**.

---

## Reporte Responsable de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en **tribuTACOS** (por ejemplo, en el parser XML de `lxml`, inyecciones SQL en consultas parametrizadas, o exposición de puertos indebida):

1. **Por favor, no abras un issue público** en GitHub.
2. Envía un reporte detallado de forma privada a los mantenedores del repositorio.
3. Incluye en tu reporte:
   - Descripción clara de la vulnerabilidad.
   - Pasos detallados para reproducir el fallo o vector de ataque.
   - Versión afectada del sistema y entorno operativo.

El equipo mantenedor revisará y responderá a los reportes de seguridad en un plazo prioritario, publicando un parche de seguridad de forma coordinada.
