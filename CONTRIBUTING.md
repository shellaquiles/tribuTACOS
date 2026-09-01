# Guía de Contribución 🤝

¡Gracias por tu interés en colaborar con **tribuTACOS**! Toda contribución que mejore la precisión fiscal, la velocidad de procesamiento, la experiencia de usuario o la documentación es bienvenida.

---

## 🔒 Gobernanza del repositorio

**Regla principal:** todo cambio entra a `main` mediante **Pull Request**. No se hace push directo a `main`, ni siquiera para releases.

| Acción | Flujo correcto |
| :--- | :--- |
| Feature o fix | Rama `feat/...` o `fix/...` → PR → merge cuando CI esté verde |
| Release estable / RC | Rama `release/vX.Y.Z` → PR con `VERSION`, `CHANGELOG`, PDFs → merge → **tag** `vX.Y.Z` en `main` |
| Hotfix urgente | Rama `fix/...` → PR (excepción documentada en el PR) → merge → tag si aplica |

**Protecciones en `main` (GitHub):**

* Pull Request obligatorio antes de merge
* CI obligatorio: `backend-test`, `frontend-lint-build`, `standalone-build`, `docker-build`
* Sin force-push ni borrado de la rama
* Resolver conversaciones del PR antes de merge
* Borrar rama feature tras merge (`deleteBranchOnMerge`)

**Convención de ramas:**

* `feat/descripcion-corta` — funcionalidad
* `fix/descripcion-corta` — corrección
* `release/vX.Y.Z` — preparación de versión (RC o estable)
* `docs/descripcion-corta` — solo documentación

Detalle de releases: [.agent/workflows/release_and_versioning.md](.agent/workflows/release_and_versioning.md).

Lineamientos org-wide (nuevos repos, branch protection, plantillas): repo privado **[github-governance](https://github.com/shellaquiles/github-governance)**.

---

## 🛠️ Entorno de Desarrollo y Requisitos

Asegúrate de contar con las siguientes herramientas en tu entorno:
* **Python 3.11+**
* **Node.js 18+** y **npm**
* **SQLite 3**
* **GNU Make** (Linux/macOS) o **PowerShell/CMD** (Windows)
* **Pandoc** y **Exiftool** (opcional, para compilar la documentación oficial en PDF)

---

## 🚀 Flujo de Trabajo para Contribuir

1. **Haz un Fork** del repositorio oficial.
2. **Crea una rama de trabajo** descriptiva:
   ```bash
   git checkout -b feat/nueva-calculadora-fiscal
   # o
   git checkout -b fix/ajuste-tarifa-uma
   ```
3. **Prepara el entorno local**:
   ```bash
   make setup
   # equivalente: python scripts/tributacos.py setup
   ```
4. **Inicia los servidores de desarrollo**:
   ```bash
   make dev
   # equivalente: python scripts/tributacos.py dev
   ```
   * Backend: [http://localhost:8010](http://localhost:8010) (Documentación interactiva Swagger en `/docs`)
   * Frontend: [http://localhost:3000](http://localhost:3000)
5. **Ejecuta y amplía las pruebas**:
   Asegúrate de que todas las pruebas unitarias y de integración pasen al 100%:
   ```bash
   make test
   ```
6. **Valida el linteo del Frontend**:
   ```bash
   make lint
   ```
7. **Haz commit con mensajes convencionales (Conventional Commits)**:
   ```bash
   git commit -m "feat(calculators): add support for RESICO provisional payments"
   ```
8. **Envía un Pull Request** explicando claramente los cambios realizados y los fundamentos fiscales o técnicos correspondientes. Usa la plantilla en [`.github/pull_request_template.md`](.github/pull_request_template.md).

9. **Espera CI verde** y merge desde GitHub (squash o merge commit según prefieras; no push directo a `main`).

---

## 📐 Estándares de Código

* **Determinismo Matemático**: Todo cálculo en `backend/app/cfdis/calculators/` debe ser una función pura, sin efectos secundarios en base de datos y con precisión de redondeo a 2 decimales estándar.
* **Backend**: Estilo PEP 8 con anotaciones de tipo completas (`typing`) y modelos Pydantic validados.
* **Frontend**: Componentes modulares en React 19 / Next.js 15 App Router utilizando Tailwind CSS y tipado estricto en TypeScript.
* **Privacidad de Datos**: Bajo ningún concepto se deben transmitir UUIDs fiscales, RFCs o montos a APIs externas de terceros. El procesamiento debe ser estrictamente local.
