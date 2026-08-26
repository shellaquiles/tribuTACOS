# ==============================================================================
# tribuTACOS — Plataforma de Inteligencia Fiscal y Pre-Declarador SAT
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help setup dev backend frontend build test test-cov lint \
        db-fresh db-empty db-import-xml db-import-pdf db-export \
        clean clean-all \
        reset-db recreate-db init-db seed-demo export-demo sync sync-docs seed-sat

# --- Configuración y Rutas ---
PYTHON        := python3
NPM           := npm
BACKEND_DIR   := backend
FRONTEND_DIR  := frontend
VENV_DIR      := $(BACKEND_DIR)/venv
VENV_PYTHON   := $(VENV_DIR)/bin/python
VENV_PIP      := $(VENV_DIR)/bin/pip
UVICORN       := $(VENV_DIR)/bin/uvicorn
PYTEST        := $(VENV_DIR)/bin/pytest
DB_FILE       := $(BACKEND_DIR)/tributacos.db

PORT          ?= 8010
HOST          ?= 0.0.0.0

# --- Paleta de Colores ANSI ---
BOLD          := \033[1m
RESET         := \033[0m
CYAN          := \033[36m
GREEN         := \033[32m
YELLOW        := \033[33m
BLUE          := \033[34m
DIM           := \033[2m

# ==============================================================================
# AYUDA / MENÚ PRINCIPAL
# ==============================================================================

help:
	@echo ""
	@echo "$(BOLD)$(CYAN)  tribuTACOS — Comandos del Sistema$(RESET)"
	@echo "$(DIM)  --------------------------------------------------------------$(RESET)"
	@echo ""
	@echo "$(BOLD)Puesta en Marcha (Setup Inicial):$(RESET)"
	@printf "  $(GREEN)make setup$(RESET)             Configura venv, dependencias npm y crea la BD con datos de prueba\n"
	@printf "  $(GREEN)make install$(RESET)           Instala dependencias de Backend (Python) y Frontend (npm)\n"
	@echo ""
	@echo "$(BOLD)Servidores de Desarrollo:$(RESET)"
	@printf "  $(GREEN)make dev$(RESET)               Inicia Backend (FastAPI :$(PORT)) y Frontend (Next.js :3000) en paralelo\n"
	@printf "  $(GREEN)make backend$(RESET)           Inicia únicamente el servidor Backend (FastAPI con hot-reload)\n"
	@printf "  $(GREEN)make frontend$(RESET)          Inicia únicamente el servidor Frontend (Next.js en modo dev)\n"
	@echo ""
	@echo "$(BOLD)Base de Datos y Procesamiento Fiscal:$(RESET)"
	@printf "  $(GREEN)make db-fresh$(RESET)          Reinicia la BD y carga el dataset de prueba completo (recomendado)\n"
	@printf "  $(GREEN)make db-empty$(RESET)          Crea una base de datos limpia con catálogos SAT pero sin comprobantes\n"
	@printf "  $(GREEN)make db-import-xml$(RESET)     Procesa e ingesta archivos XML de facturas locales\n"
	@printf "  $(GREEN)make db-import-pdf$(RESET)     Procesa e ingesta declaraciones oficiales SAT en formato PDF\n"
	@printf "  $(GREEN)make db-export$(RESET)         Genera un respaldo fixture de la base de datos actual\n"
	@echo ""
	@echo "$(BOLD)Calidad, Pruebas y Compilación:$(RESET)"
	@printf "  $(GREEN)make test$(RESET)              Ejecuta la suite de pruebas unitarias y de integración (pytest)\n"
	@printf "  $(GREEN)make build$(RESET)             Compila el bundle optimizado de producción para Next.js\n"
	@printf "  $(GREEN)make lint$(RESET)              Ejecuta la validación de tipado y estilo de código\n"
	@printf "  $(GREEN)make pdf$(RESET)               Compila toda la documentación a PDF/DOCX con Pandocquiles\n"
	@printf "  $(GREEN)make pdf-docs$(RESET)          Compila la documentación técnica (/docs) a PDF\n"
	@printf "  $(GREEN)make pdf-user$(RESET)          Compila el manual de usuario (/documentacion) a PDF\n"
	@echo ""
	@echo "$(BOLD)Limpieza y Mantenimiento:$(RESET)"
	@printf "  $(GREEN)make clean$(RESET)             Elimina cachés de compilación, temporales y artefactos .next\n"
	@printf "  $(GREEN)make clean-all$(RESET)         Limpieza profunda: borra venv y node_modules para reinstalación\n"
	@echo ""

# ==============================================================================
# PUESTA EN MARCHA
# ==============================================================================

setup: install db-fresh
	@echo ""
	@echo "$(BOLD)$(GREEN)Entorno de tribuTACOS listo. Ejecuta 'make dev' para iniciar el sistema.$(RESET)"
	@echo ""

$(VENV_DIR):
	@echo "$(BOLD)$(YELLOW)Creando entorno virtual de Python en $(VENV_DIR)...$(RESET)"
	@$(PYTHON) -m venv $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)Instalando dependencias de Python...$(RESET)"
	@$(VENV_PIP) install --upgrade pip
	@$(VENV_PIP) install -r $(BACKEND_DIR)/requirements.txt

install: $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)Instalando paquetes de Frontend (npm)...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@echo "$(BOLD)$(GREEN)Instalación completada exitosamente.$(RESET)"

# ==============================================================================
# SERVIDORES
# ==============================================================================

stop:
	@echo "$(BOLD)$(YELLOW)Liberando puertos $(PORT) y 3000 si están en uso...$(RESET)"
	@fuser -k $(PORT)/tcp 3000/tcp 2>/dev/null || true

dev: $(VENV_DIR) stop
	@echo "$(BOLD)$(CYAN)Iniciando tribuTACOS en modo desarrollo (Backend :$(PORT) + Frontend :3000)...$(RESET)"
	@make -j 2 backend frontend

backend: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)Iniciando Backend FastAPI en http://$(HOST):$(PORT)...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(UVICORN) app.main:app --reload --host $(HOST) --port $(PORT)

frontend:
	@echo "$(BOLD)$(BLUE)Iniciando Frontend Next.js en http://localhost:3000...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run dev

# ==============================================================================
# BASE DE DATOS Y GESTIÓN FISCAL
# ==============================================================================

db-empty: $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)Eliminando base de datos actual ($(DB_FILE))...$(RESET)"
	@rm -f $(DB_FILE)
	@echo "$(BOLD)$(GREEN)Inicializando esquema relacional y catálogos fiscales del SAT...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli init-db
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat
	@echo "$(BOLD)$(GREEN)Base de datos limpia creada exitosamente.$(RESET)"

db-fresh: db-empty
	@echo "$(BOLD)$(CYAN)Cargando dataset demo completo (CFDIs, nómina, honorarios y declaraciones)...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-demo --fixture
	@echo "$(BOLD)$(GREEN)Base de datos poblada al 100% con datos de prueba.$(RESET)"

db-import-xml: $(VENV_DIR)
	@echo "$(BOLD)$(BLUE)Procesando comprobantes XML locales...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync

db-import-pdf: $(VENV_DIR)
	@echo "$(BOLD)$(BLUE)Procesando declaraciones y acuses PDF oficiales del SAT...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync-sat-docs

db-export: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)Exportando dataset actual a fixture comprimido...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli export-demo

# Alias retrocompatibles
reset-db: db-empty
recreate-db: db-fresh
init-db: db-empty
seed-demo: db-fresh
export-demo: db-export
sync: db-import-xml
sync-docs: db-import-pdf
seed-sat: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat

# ==============================================================================
# CALIDAD, PRUEBAS Y COMPILACIÓN
# ==============================================================================

test: $(VENV_DIR)
	@echo "$(BOLD)$(CYAN)Ejecutando suite de pruebas unitarias y de integración...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(PYTEST) -v

lint:
	@echo "$(BOLD)$(CYAN)Validando tipado y linteo del Frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run lint

build:
	@echo "$(BOLD)$(CYAN)Compilando bundle de producción del Frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run build

# ==============================================================================
# COMPILACIÓN DE DOCUMENTACIÓN (PANDOCQUILES)
# ==============================================================================

pdf: pdf-docs pdf-user
	@echo "$(BOLD)$(GREEN)Toda la documentación ha sido compilada en utils/dist_docs/.$(RESET)"

pdf-docs:
	@echo "$(BOLD)$(CYAN)Compilando documentación técnica (/docs) con Pandocquiles...$(RESET)"
	@cd utils/pandocquiles && ./bin/build.sh ../../docs

pdf-user:
	@echo "$(BOLD)$(CYAN)Compilando manual de usuario (/documentacion) con Pandocquiles...$(RESET)"
	@cd utils/pandocquiles && ./bin/build.sh ../../documentacion

# ==============================================================================
# LIMPIEZA
# ==============================================================================

clean:
	@echo "$(BOLD)$(YELLOW)Limpiando cachés de compilación, temporales y documentación compilada...$(RESET)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/.next utils/dist_docs
	@echo "$(BOLD)$(GREEN)Limpieza completada.$(RESET)"

clean-all: clean
	@echo "$(BOLD)$(YELLOW)Eliminando $(VENV_DIR) y $(FRONTEND_DIR)/node_modules...$(RESET)"
	@rm -rf $(VENV_DIR)
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(BOLD)$(GREEN)Limpieza profunda completada.$(RESET)"
