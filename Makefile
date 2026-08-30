# ==============================================================================
# tribuTACOS — Plataforma de Inteligencia Fiscal y Pre-Declarador SAT
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help doctor setup install dev dev-backend dev-frontend stop gui standalone \
        version-sync docker-up docker-down \
        db-seed db-reset db-import-xml db-import-sat db-export db-import-backup \
        clear-cache open-xml-recibidos open-xml-emitidos open-pdf-sat open-backups \
        test lint build \
        screenshots docs-sync pdf-all pdf-manual pdf-tecnica pdf-instalacion docs-all \
        pdf-check-submodule clean clean-deep \
        db-fresh db-empty db-import-pdf seed-demo init-db sync sync-docs \
        pdf pdf-docs pdf-user pdf-install clean-all

# Fuente unica de comandos operativos (Windows / macOS / Linux / Panel GUI).
# GNU Make es una fachada: make X == python scripts/tributacos.py X
# Excepcion: PDFs y docs-sync viven aqui porque el runner los invoca de vuelta.
ifeq ($(OS),Windows_NT)
    PYTHON := python
else
    PYTHON := python3
endif

RUNNER         := $(PYTHON) scripts/tributacos.py
PORT           ?= 8010
HOST           ?= 0.0.0.0

# --- Rutas de Documentación y PDFs (Pandocquiles by shellaquiles.org) ---
BUILD_DOCS     := cd utils/pandocquiles && ./bin/build.sh
DIST_DOCS      := utils/pandocquiles/documentacion
PDF_DOCS_SRC     := $(DIST_DOCS)/pandocquiles.pdf
PDF_USER_SRC     := $(DIST_DOCS)/manual_usuario.pdf
PDF_INSTALL_SRC  := $(DIST_DOCS)/instalacion_usuario.pdf
PDF_DOCS_OUT     := docs/tribuTACOS_documentacion_tecnica.pdf
PDF_USER_OUT     := manual_usuario/tribuTACOS_manual_usuario.pdf
PDF_INSTALL_OUT  := docs/tribuTACOS_instalacion_usuario.pdf
PDF_INSTALL_STAGING := .tmp/instalacion_usuario

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
	@printf "     $(GREEN)make doctor$(RESET)         Verifica Python, Node.js y Docker\n"
	@printf "     $(GREEN)make setup$(RESET)          Instala dependencias y prepara la BD con datos demo\n"
	@printf "     $(GREEN)make dev$(RESET)            Inicia Backend (:$(PORT)) y Frontend (:3000) en paralelo\n"
	@printf "     $(GREEN)make stop$(RESET)           Detiene servidores en los puertos 8010, 3000 y 8080\n"
	@printf "     $(GREEN)make gui$(RESET)            Abre el Panel de Operaciones (usuario final)\n"
	@printf "     $(GREEN)make standalone$(RESET)     Servidor unico (:8080) con frontend estatico\n"
	@printf "     $(GREEN)make docker-up$(RESET)      Inicia tribuTACOS con Docker Compose\n"
	@printf "     $(GREEN)make docker-down$(RESET)    Detiene contenedores Docker\n"
	@printf "     $(GREEN)make version-sync$(RESET)   Propaga VERSION a package.json, badges e instalador\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)2. DATOS & CFDIS (INGESTA LOCAL)$(RESET)"
	@printf "     $(GREEN)make db-seed$(RESET)        Restaura la BD con el dataset demo completo (139 CFDIs)\n"
	@printf "     $(GREEN)make db-reset$(RESET)       Limpia la base de datos dejando solo catálogos del SAT\n"
	@printf "     $(GREEN)make db-import-xml$(RESET)  Procesa y clasifica XMLs locales en la base de datos\n"
	@printf "     $(GREEN)make db-import-sat$(RESET)  Procesa declaraciones y acuses oficiales en PDF del SAT\n"
	@printf "     $(GREEN)make db-export$(RESET)      Copia fechada en respaldos/ (mismo archivo que la GUI)\n"
	@printf "     $(GREEN)make db-import-backup$(RESET) Restaura un respaldo .json.gz (INPUT=ruta/archivo.json.gz)\n"
	@printf "     $(GREEN)make clear-cache$(RESET)    Limpia la cache de calculos fiscales\n"
	@printf "     $(GREEN)make open-xml-recibidos$(RESET) Abre la carpeta de XML recibidos\n"
	@printf "     $(GREEN)make open-xml-emitidos$(RESET)  Abre la carpeta de XML emitidos\n"
	@printf "     $(GREEN)make open-pdf-sat$(RESET)   Abre la carpeta de PDFs del SAT\n"
	@printf "     $(GREEN)make open-backups$(RESET)   Abre la carpeta de respaldos\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)3. CONTROL DE CALIDAD$(RESET)"
	@printf "     $(GREEN)make test$(RESET)           Ejecuta las pruebas del backend (Pytest)\n"
	@printf "     $(GREEN)make lint$(RESET)           Verifica estándares de código y sintaxis en Frontend\n"
	@printf "     $(GREEN)make build$(RESET)          Compila el bundle de producción en Next.js\n"
	@echo ""
	@echo "  $(BOLD)$(YELLOW)4. DOCUMENTACIÓN & RELEASES (PANDOCQUILES BY SHELLAQUILES.ORG)$(RESET)"
	@printf "     $(GREEN)make screenshots$(RESET)    Captura pantallas completas con scroll (Playwright)\n"
	@printf "     $(GREEN)make docs-sync$(RESET)      Pipeline de pre-release: capturas + manual + PDFs\n"
	@printf "     $(GREEN)make pdf-all$(RESET)        Compila los PDFs oficiales (técnico, manual e instalación)\n"
	@printf "     $(GREEN)make pdf-manual$(RESET)     Compila únicamente el Manual de Usuario en PDF\n"
	@printf "     $(GREEN)make pdf-tecnica$(RESET)    Compila únicamente la Documentación Técnica en PDF\n"
	@printf "     $(GREEN)make pdf-instalacion$(RESET) Compila la Guía de instalación para usuario final\n"
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

doctor:
	@$(RUNNER) doctor

setup:
	@$(RUNNER) setup

install:
	@$(RUNNER) install

stop:
	@$(RUNNER) stop

dev:
	@$(RUNNER) --port $(PORT) --host $(HOST) dev

dev-backend:
	@$(RUNNER) --port $(PORT) --host $(HOST) dev-backend

dev-frontend:
	@$(RUNNER) dev-frontend

gui:
	@$(RUNNER) gui

standalone:
	@$(RUNNER) standalone

docker-up:
	@$(RUNNER) docker-up

docker-down:
	@$(RUNNER) docker-down

version-sync:
	@$(RUNNER) version-sync

# ==============================================================================
# 💾 2. DATOS & INGESTA FISCAL
# ==============================================================================

db-reset:
	@$(RUNNER) db-reset

db-seed:
	@$(RUNNER) db-seed

db-import-xml:
	@$(RUNNER) db-import-xml

db-import-sat:
	@$(RUNNER) db-import-sat

db-export:
	@$(RUNNER) db-export

db-import-backup:
	@$(RUNNER) db-import-backup --input "$(INPUT)"

clear-cache:
	@$(RUNNER) clear-cache

open-xml-recibidos:
	@$(RUNNER) open-xml-recibidos

open-xml-emitidos:
	@$(RUNNER) open-xml-emitidos

open-pdf-sat:
	@$(RUNNER) open-pdf-sat

open-backups:
	@$(RUNNER) open-backups

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

test:
	@$(RUNNER) test

lint:
	@$(RUNNER) lint

build:
	@$(RUNNER) build

# ==============================================================================
# 📚 4. DOCUMENTACIÓN & RELEASES (PANDOCQUILES BY SHELLAQUILES.ORG)
# ==============================================================================

screenshots:
	@$(RUNNER) screenshots

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
		const ver = fs.readFileSync("VERSION", "utf8").trim();\
		const channel = ver.includes("-") ? ver.split("-")[1].split(".")[0].toUpperCase() : "STABLE";\
		const badgeVer = ver.replace(/-/g, "--");\
		let fullDoc = `# tribuTACOS — Manual de Usuario Completo\n\n[![Versión](https://img.shields.io/badge/Versión-v$${badgeVer}%20$${channel}-blue.svg?style=flat-square)](#)\n\n> **Plataforma de Inteligencia Fiscal, Conciliación de Comprobantes Digitales (CFDI 3.3/4.0) y Simulación Analítica de Pre-Declaración Mensual y Anual para Personas Físicas en México.**\n\n> **Versión de Referencia:** Este documento y sus guías visuales corresponden a **tribuTACOS v$${ver} $${channel}**.\n\n> *Documento y manuales generados con **[Pandocquiles](https://github.com/shellaquiles/pandocquiles) by shellaquiles.org**.*\n\n---\n\n## Tabla de Contenidos\n\n`;\
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

pdf-all: pdf-check-submodule pdf-tecnica pdf-manual pdf-instalacion
	@echo "\n$(BOLD)$(GREEN)🎉 Documentación oficial generada exitosamente con Pandocquiles by shellaquiles.org:$(RESET)"
	@echo "  📄 $(BOLD)$(PDF_DOCS_OUT)$(RESET)"
	@echo "  📘 $(BOLD)$(PDF_USER_OUT)$(RESET)"
	@echo "  📗 $(BOLD)$(PDF_INSTALL_OUT)$(RESET)\n"

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

pdf-instalacion: pdf-check-submodule
	@echo "$(BOLD)$(CYAN)Compilando guía de instalación en PDF con Pandocquiles by shellaquiles.org...$(RESET)"
	@mkdir -p $(PDF_INSTALL_STAGING)
	@cp docs/INSTALACION_USUARIO.md $(PDF_INSTALL_STAGING)/README.md
	@$(BUILD_DOCS) --pdf-only ../../$(PDF_INSTALL_STAGING)
	@cp $(PDF_INSTALL_SRC) $(PDF_INSTALL_OUT)
	@rm -rf $(PDF_INSTALL_STAGING)
	@echo "$(BOLD)$(GREEN)✅ Generado con Pandocquiles by shellaquiles.org: $(PDF_INSTALL_OUT)$(RESET)"

docs-all: pdf-check-submodule
	@echo "$(BOLD)$(CYAN)Compilando documentación en todos los formatos (PDF, Word, HTML) con Pandocquiles by shellaquiles.org...$(RESET)"
	@$(BUILD_DOCS) ../../docs ../../manual_usuario
	@cp $(PDF_DOCS_SRC) $(PDF_DOCS_OUT) 2>/dev/null || true
	@cp $(PDF_USER_SRC) $(PDF_USER_OUT) 2>/dev/null || true
	@$(MAKE) pdf-instalacion

# Alias retrocompatibles de PDF
pdf: pdf-all
pdf-docs: pdf-tecnica
pdf-user: pdf-manual
pdf-install: pdf-instalacion

# ==============================================================================
# 🧹 5. MANTENIMIENTO Y LIMPIEZA
# ==============================================================================

clean:
	@$(RUNNER) clean

clean-deep:
	@$(RUNNER) clean-deep

# Alias retrocompatible
clean-all: clean-deep
