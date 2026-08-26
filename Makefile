# ==============================================================================
# tribuTACOS — Plataforma de Inteligencia Fiscal y Pre-Declarador SAT
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help setup dev dev-backend dev-frontend stop \
        db-seed db-reset db-import-xml db-import-sat db-export \
        test lint build \
        screenshots docs-sync pdf-all pdf-manual pdf-tecnica docs-all \
        clean clean-deep

# --- Variables de Entorno y Rutas ---
PYTHON         := python3
NPM            := npm
BACKEND_DIR    := backend
FRONTEND_DIR   := frontend
VENV_DIR       := $(BACKEND_DIR)/venv
VENV_PYTHON    := $(VENV_DIR)/bin/python
VENV_PIP       := $(VENV_DIR)/bin/pip
UVICORN        := $(VENV_DIR)/bin/uvicorn
PYTEST         := $(VENV_DIR)/bin/pytest
DB_FILE        := $(BACKEND_DIR)/tributacos.db

PORT           ?= 8010
HOST           ?= 0.0.0.0

# --- Rutas de Documentación y PDFs (Pandocquiles by shellaquiles.org) ---
BUILD_DOCS     := cd utils/pandocquiles && ./bin/build.sh
DIST_DOCS      := utils/pandocquiles/documentacion
PDF_DOCS_SRC   := $(DIST_DOCS)/pandocquiles.pdf
PDF_USER_SRC   := $(DIST_DOCS)/manual_usuario.pdf
PDF_DOCS_OUT   := docs/tribuTACOS_documentacion_tecnica.pdf
PDF_USER_OUT   := manual_usuario/tribuTACOS_manual_usuario.pdf

# --- Estilos ANSI para Menú ---
BOLD           := \033[1m
RESET          := \033[0m
CYAN           := \033[36m
GREEN          := \033[32m
YELLOW         := \033[33m
BLUE           := \033[34m
DIM            := \033[2m

# ==============================================================================
# 📋 MENÚ PRINCIPAL (FLUJO DE DESARROLLO Y OPERACIÓN)
# ==============================================================================

help:
	@echo ""
	@echo "$(BOLD)$(CYAN)  🌮 tribuTACOS — Flujo de Trabajo y Comandos$(RESET)"
	@echo "$(DIM)  ======================================================================$(RESET)"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)1. INICIO RÁPIDO & DESARROLLO$(RESET)"
	@printf "     $(GREEN)make setup$(RESET)          Instala dependencias y prepara la BD con datos demo\n"
	@printf "     $(GREEN)make dev$(RESET)            Inicia Backend (:$(PORT)) y Frontend (:3000) en paralelo\n"
	@printf "     $(GREEN)make stop$(RESET)           Detiene servidores activos en los puertos 8010 y 3000\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)2. DATOS & CFDIS (INGESTA LOCAL)$(RESET)"
	@printf "     $(GREEN)make db-seed$(RESET)        Restaura la BD con el dataset demo completo (139 CFDIs)\n"
	@printf "     $(GREEN)make db-reset$(RESET)       Limpia la base de datos dejando solo catálogos del SAT\n"
	@printf "     $(GREEN)make db-import-xml$(RESET)  Procesa y clasifica XMLs locales en la base de datos\n"
	@printf "     $(GREEN)make db-import-sat$(RESET)  Procesa declaraciones y acuses oficiales en PDF del SAT\n"
	@printf "     $(GREEN)make db-export$(RESET)      Exporta un respaldo fixture de la base de datos actual\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)3. CONTROL DE CALIDAD$(RESET)"
	@printf "     $(GREEN)make test$(RESET)           Ejecuta las 11 pruebas unitarias del motor fiscal\n"
	@printf "     $(GREEN)make lint$(RESET)           Verifica estándares de código y sintaxis en Frontend\n"
	@printf "     $(GREEN)make build$(RESET)          Compila el bundle de producción en Next.js\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)4. DOCUMENTACIÓN & RELEASES (PANDOCQUILES BY SHELLAQUILES.ORG)$(RESET)"
	@printf "     $(GREEN)make screenshots$(RESET)    Captura pantallas completas con scroll (Playwright)\n"
	@printf "     $(GREEN)make docs-sync$(RESET)      Pipeline de pre-release: capturas + manual + PDFs\n"
	@printf "     $(GREEN)make pdf-all$(RESET)        Compila ambos PDFs oficiales (técnico y manual)\n"
	@printf "     $(GREEN)make pdf-manual$(RESET)     Compila únicamente el Manual de Usuario en PDF\n"
	@printf "     $(GREEN)make pdf-tecnica$(RESET)    Compila únicamente la Documentación Técnica en PDF\n"
	@printf "     $(GREEN)make docs-all$(RESET)       Compila documentación completa en PDF, Word y HTML\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)5. MANTENIMIENTO$(RESET)"
	@printf "     $(GREEN)make clean$(RESET)          Elimina temporales, cachés y PDFs generados\n"
	@printf "     $(GREEN)make clean-deep$(RESET)     Elimina librerías node_modules y entorno virtual venv\n"
	@echo "$(DIM)  ======================================================================$(RESET)"
	@echo ""

# ==============================================================================
# 🚀 1. INICIO RÁPIDO & DESARROLLO
# ==============================================================================

setup: install db-seed
	@echo "\n$(BOLD)$(GREEN)✅ Entorno listo para usar. Ejecuta 'make dev' para iniciar los servidores.$(RESET)\n"

$(VENV_DIR):
	@echo "$(BOLD)$(YELLOW)Creando entorno virtual Python en $(VENV_DIR)...$(RESET)"
	@$(PYTHON) -m venv $(VENV_DIR)
	@$(VENV_PIP) install --upgrade pip
	@$(VENV_PIP) install -r $(BACKEND_DIR)/requirements.txt

install: $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)Instalando dependencias de Frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) install

stop:
	@fuser -k $(PORT)/tcp 3000/tcp 2>/dev/null || true

dev: $(VENV_DIR) stop
	@echo "$(BOLD)$(CYAN)Iniciando tribuTACOS (Backend :$(PORT) + Frontend :3000)...$(RESET)"
	@make -j 2 dev-backend dev-frontend

dev-backend: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(UVICORN) app.main:app --reload --host $(HOST) --port $(PORT)

dev-frontend:
	@cd $(FRONTEND_DIR) && $(NPM) run dev

# ==============================================================================
# 💾 2. DATOS & INGESTA FISCAL
# ==============================================================================

db-reset: $(VENV_DIR)
	@rm -f $(DB_FILE)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli init-db
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat
	@echo "$(BOLD)$(GREEN)✅ Base de datos limpia con catálogos SAT lista.$(RESET)"

db-seed: db-reset
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-demo --fixture
	@echo "$(BOLD)$(GREEN)✅ Base de datos poblada con dataset demo completo (139 CFDIs).$(RESET)"

db-import-xml: $(VENV_DIR)
	@echo "$(BOLD)$(CYAN)Sincronizando comprobantes XML locales...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync

db-import-sat: $(VENV_DIR)
	@echo "$(BOLD)$(CYAN)Sincronizando declaraciones oficiales SAT en PDF...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync-sat-docs

db-export: $(VENV_DIR)
	@echo "$(BOLD)$(CYAN)Exportando fixture de base de datos actual...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli export-demo

# Alias amigables de base de datos
db-fresh: db-seed
db-empty: db-reset
db-import-pdf: db-import-sat
seed-demo: db-seed
init-db: db-reset
sync: db-import-xml
sync-docs: db-import-sat

# ==============================================================================
# 🧪 3. PRUEBAS Y CALIDAD
# ==============================================================================

test: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(PYTEST) -v

lint:
	@cd $(FRONTEND_DIR) && $(NPM) run lint

build:
	@cd $(FRONTEND_DIR) && $(NPM) run build

# ==============================================================================
# 📚 4. DOCUMENTACIÓN & RELEASES (PANDOCQUILES BY SHELLAQUILES.ORG)
# ==============================================================================

screenshots:
	@echo "$(BOLD)$(CYAN)📸 Generando capturas automatizadas de pantalla con Playwright...$(RESET)"
	@node frontend/scripts/capture_screenshots.js

docs-sync: screenshots
	@echo "$(BOLD)$(CYAN)🔄 Sincronizando manual completo y recompilando PDFs con Pandocquiles...$(RESET)"
	@node -e '\
		const fs = require("fs");\
		const path = require("path");\
		const dir = "manual_usuario";\
		const files = [\
		  "01_introduccion_y_propuesta_de_valor.md",\
		  "02_primeros_pasos_e_ingesta.md",\
		  "03_modulo_dashboard_global.md",\
		  "04_modulo_predeclaracion_mensual.md",\
		  "05_modulo_predeclaracion_anual.md",\
		  "06_modulo_egresos_y_deducciones.md",\
		  "07_modulo_ingresos_y_nomina.md",\
		  "08_modulo_auditoria_sat_conciliacion.md",\
		  "09_roadmap_y_evolucion_modulos.md"\
		];\
		let fullDoc = `# tribuTACOS — Manual de Usuario Completo\n\n[![Versión](https://img.shields.io/badge/Versión-v1.0.1%20STABLE-blue.svg?style=flat-square)](#)\n\n> **Plataforma de Inteligencia Fiscal, Conciliación de Comprobantes Digitales (CFDI 3.3/4.0) y Simulación Analítica de Pre-Declaración Mensual y Anual para Personas Físicas en México.**\n\n> **Versión de Referencia:** Este documento y sus guías visuales corresponden a **tribuTACOS v1.0.1 STABLE**.\n\n> *Documento y manuales generados con **[Pandocquiles](https://github.com/shellaquiles/pandocquiles) by shellaquiles.org**.*\n\n---\n\n## Tabla de Contenidos\n\n`;\
		files.forEach((f, idx) => {\
		  const content = fs.readFileSync(path.join(dir, f), "utf8");\
		  const titleMatch = content.match(/# Capítulo \\d+: ([^\\n\\r]+)/);\
		  const title = titleMatch ? titleMatch[1] : f;\
		  fullDoc += `${idx + 1}. [Capítulo 0${idx + 1}: ${title}](#capítulo-0${idx + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")})\n`;\
		});\
		fullDoc += "\n---\n\n";\
		files.forEach(f => {\
		  let content = fs.readFileSync(path.join(dir, f), "utf8");\
		  content = content.replace(/^# tribuTACOS — Manual de Usuario\\s*\\n+/g, "");\
		  fullDoc += content + "\n\n---\n\n";\
		});\
		fs.writeFileSync(path.join(dir, "MANUAL_DE_USUARIO_COMPLETO.md"), fullDoc.trim() + "\n");\
	'
	@$(MAKE) pdf-all

pdf-check-submodule:
	@if [ ! -f "utils/pandocquiles/bin/build.sh" ]; then \
		echo "$(BOLD)$(YELLOW)⚠️  El generador Pandocquiles by shellaquiles.org no está inicializado en utils/pandocquiles.$(RESET)"; \
		echo "$(CYAN)Inicializando submódulo git...$(RESET)"; \
		git submodule update --init --recursive; \
	fi
	@if [ ! -f "utils/pandocquiles/.env" ] && [ -f "utils/pandocquiles.env" ]; then \
		echo "$(CYAN)Aplicando configuración de Pandocquiles (utils/pandocquiles.env -> utils/pandocquiles/.env)...$(RESET)"; \
		cp utils/pandocquiles.env utils/pandocquiles/.env; \
	fi

pdf-all: pdf-check-submodule pdf-tecnica pdf-manual
	@echo "\n$(BOLD)$(GREEN)🎉 Documentación oficial generada exitosamente con Pandocquiles by shellaquiles.org:$(RESET)"
	@echo "  📄 $(BOLD)$(PDF_DOCS_OUT)$(RESET)"
	@echo "  📘 $(BOLD)$(PDF_USER_OUT)$(RESET)\n"

pdf-tecnica: pdf-check-submodule
	@echo "$(BOLD)$(CYAN)Compilando documentación técnica en PDF con Pandocquiles by shellaquiles.org...$(RESET)"
	@$(BUILD_DOCS) --pdf-only ../../docs
	@cp $(PDF_DOCS_SRC) $(PDF_DOCS_OUT)
	@echo "$(BOLD)$(GREEN)✅ Generado con Pandocquiles by shellaquiles.org: $(PDF_DOCS_OUT)$(RESET)"

pdf-manual: pdf-check-submodule
	@echo "$(BOLD)$(CYAN)Compilando manual de usuario en PDF con Pandocquiles by shellaquiles.org...$(RESET)"
	@$(BUILD_DOCS) --pdf-only ../../manual_usuario
	@cp $(PDF_USER_SRC) $(PDF_USER_OUT)
	@echo "$(BOLD)$(GREEN)✅ Generado con Pandocquiles by shellaquiles.org: $(PDF_USER_OUT)$(RESET)"

docs-all: pdf-check-submodule
	@echo "$(BOLD)$(CYAN)Compilando documentación en todos los formatos (PDF, Word, HTML) con Pandocquiles by shellaquiles.org...$(RESET)"
	@$(BUILD_DOCS) ../../docs ../../manual_usuario
	@cp $(PDF_DOCS_SRC) $(PDF_DOCS_OUT) 2>/dev/null || true
	@cp $(PDF_USER_SRC) $(PDF_USER_OUT) 2>/dev/null || true

# Alias retrocompatibles de PDF
pdf: pdf-all
pdf-docs: pdf-tecnica
pdf-user: pdf-manual

# ==============================================================================
# 🧹 5. MANTENIMIENTO Y LIMPIEZA
# ==============================================================================

clean:
	@echo "$(BOLD)$(YELLOW)Limpiando cachés, temporales y PDFs compilados...$(RESET)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/.next $(DIST_DOCS)
	@rm -f $(PDF_DOCS_OUT) $(PDF_USER_OUT)
	@echo "$(BOLD)$(GREEN)Limpieza completada.$(RESET)"

clean-deep: clean
	@echo "$(BOLD)$(YELLOW)Eliminando entorno $(VENV_DIR) y dependencias frontend...$(RESET)"
	@rm -rf $(VENV_DIR) $(FRONTEND_DIR)/node_modules
	@echo "$(BOLD)$(GREEN)Limpieza profunda completada.$(RESET)"

# Alias retrocompatible
clean-all: clean-deep
