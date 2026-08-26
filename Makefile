# ==============================================================================
# tribuTACOS — Plataforma de Inteligencia Fiscal y Pre-Declarador SAT
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help setup install dev backend frontend stop \
        db-fresh db-empty db-import-xml db-import-pdf db-export \
        test lint build pdf pdf-docs pdf-user docs-all clean clean-all

# --- Rutas y Comandos ---
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

# --- Rutas de Documentación y PDFs ---
BUILD_DOCS     := cd utils/pandocquiles && ./bin/build.sh
DIST_DOCS      := utils/dist_docs
PDF_DOCS_SRC   := $(DIST_DOCS)/pandocquiles.pdf
PDF_USER_SRC   := $(DIST_DOCS)/manual_usuario.pdf
PDF_DOCS_OUT   := docs/tribuTACOS_documentacion_tecnica.pdf
PDF_USER_OUT   := manual_usuario/tribuTACOS_manual_usuario.pdf

# --- Estilos ANSI ---
BOLD           := \033[1m
RESET          := \033[0m
CYAN           := \033[36m
GREEN          := \033[32m
YELLOW         := \033[33m
BLUE           := \033[34m
DIM            := \033[2m

# ==============================================================================
# MENÚ PRINCIPAL
# ==============================================================================

help:
	@echo ""
	@echo "$(BOLD)$(CYAN)  tribuTACOS — Comandos del Sistema$(RESET)"
	@echo "$(DIM)  --------------------------------------------------------------$(RESET)"
	@echo "$(BOLD)Puesta en Marcha:$(RESET)"
	@printf "  $(GREEN)make setup$(RESET)             Instala dependencias y prepara la BD demo\n"
	@printf "  $(GREEN)make dev$(RESET)               Inicia Backend (:$(PORT)) y Frontend (:3000)\n"
	@echo ""
	@echo "$(BOLD)Base de Datos y Procesamiento:$(RESET)"
	@printf "  $(GREEN)make db-fresh$(RESET)          Reinicia la base de datos con dataset demo completo\n"
	@printf "  $(GREEN)make db-empty$(RESET)          Crea base de datos limpia con catálogos SAT\n"
	@printf "  $(GREEN)make db-import-xml$(RESET)     Procesa e ingesta comprobantes XML locales\n"
	@printf "  $(GREEN)make db-import-pdf$(RESET)     Procesa declaraciones y acuses oficiales del SAT\n"
	@printf "  $(GREEN)make db-export$(RESET)         Exporta un fixture de respaldo de la BD\n"
	@echo ""
	@echo "$(BOLD)Pruebas y Compilación:$(RESET)"
	@printf "  $(GREEN)make test$(RESET)              Ejecuta la suite de pruebas automatizadas (pytest)\n"
	@printf "  $(GREEN)make lint$(RESET)              Valida tipado y linteo del Frontend\n"
	@printf "  $(GREEN)make build$(RESET)             Compila el bundle de producción de Next.js\n"
	@echo ""
	@echo "$(BOLD)Generación de Documentación (Pandocquiles):$(RESET)"
	@printf "  $(GREEN)make pdf$(RESET)               Compila ambos documentos oficiales en PDF\n"
	@printf "  $(GREEN)make pdf-user$(RESET)          Compila $(PDF_USER_OUT)\n"
	@printf "  $(GREEN)make pdf-docs$(RESET)          Compila $(PDF_DOCS_OUT)\n"
	@printf "  $(GREEN)make docs-all$(RESET)          Compila en todos los formatos (PDF, Word, HTML)\n"
	@echo ""
	@echo "$(BOLD)Limpieza:$(RESET)"
	@printf "  $(GREEN)make clean$(RESET)             Elimina cachés, temporales y PDFs compilados\n"
	@printf "  $(GREEN)make clean-all$(RESET)         Limpieza profunda (elimina venv y node_modules)\n"
	@echo ""

# ==============================================================================
# PUESTA EN MARCHA Y SERVIDORES
# ==============================================================================

setup: install db-fresh
	@echo "\n$(BOLD)$(GREEN)✅ Entorno listo. Ejecuta 'make dev' para iniciar el sistema.$(RESET)\n"

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
	@make -j 2 backend frontend

backend: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(UVICORN) app.main:app --reload --host $(HOST) --port $(PORT)

frontend:
	@cd $(FRONTEND_DIR) && $(NPM) run dev

# ==============================================================================
# BASE DE DATOS FISCAL
# ==============================================================================

db-empty: $(VENV_DIR)
	@rm -f $(DB_FILE)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli init-db
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat

db-fresh: db-empty
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-demo --fixture
	@echo "$(BOLD)$(GREEN)✅ Base de datos poblada con dataset demo.$(RESET)"

db-import-xml: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync

db-import-pdf: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync-sat-docs

db-export: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli export-demo

# Alias retrocompatibles
reset-db recreate-db init-db: db-empty
seed-demo: db-fresh
export-demo: db-export
sync: db-import-xml
sync-docs: db-import-pdf
seed-sat: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat

# ==============================================================================
# PRUEBAS Y CALIDAD
# ==============================================================================

test: $(VENV_DIR)
	@PYTHONPATH=$(BACKEND_DIR) $(PYTEST) -v

lint:
	@cd $(FRONTEND_DIR) && $(NPM) run lint

build:
	@cd $(FRONTEND_DIR) && $(NPM) run build

# ==============================================================================
# DOCUMENTACIÓN OFICIAL (PANDOCQUILES)
# ==============================================================================

pdf: pdf-docs pdf-user
	@echo "\n$(BOLD)$(GREEN)🎉 Documentación oficial generada exitosamente:$(RESET)"
	@echo "  📄 $(BOLD)$(PDF_DOCS_OUT)$(RESET)"
	@echo "  📘 $(BOLD)$(PDF_USER_OUT)$(RESET)\n"

pdf-docs:
	@echo "$(BOLD)$(CYAN)Compilando documentación técnica en PDF...$(RESET)"
	@$(BUILD_DOCS) --pdf-only ../../docs
	@cp $(PDF_DOCS_SRC) $(PDF_DOCS_OUT)
	@echo "$(BOLD)$(GREEN)✅ Generado: $(PDF_DOCS_OUT)$(RESET)"

pdf-user:
	@echo "$(BOLD)$(CYAN)Compilando manual de usuario en PDF...$(RESET)"
	@$(BUILD_DOCS) --pdf-only ../../manual_usuario
	@cp $(PDF_USER_SRC) $(PDF_USER_OUT)
	@echo "$(BOLD)$(GREEN)✅ Generado: $(PDF_USER_OUT)$(RESET)"

docs-all:
	@echo "$(BOLD)$(CYAN)Compilando documentación en todos los formatos (PDF, Word, HTML)...$(RESET)"
	@$(BUILD_DOCS) ../../docs ../../manual_usuario
	@cp $(PDF_DOCS_SRC) $(PDF_DOCS_OUT) 2>/dev/null || true
	@cp $(PDF_USER_SRC) $(PDF_USER_OUT) 2>/dev/null || true

# ==============================================================================
# LIMPIEZA
# ==============================================================================

clean:
	@echo "$(BOLD)$(YELLOW)Limpiando cachés, temporales y PDFs compilados...$(RESET)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/.next $(DIST_DOCS)
	@rm -f $(PDF_DOCS_OUT) $(PDF_USER_OUT)
	@echo "$(BOLD)$(GREEN)Limpieza completada.$(RESET)"

clean-all: clean
	@echo "$(BOLD)$(YELLOW)Eliminando $(VENV_DIR) y node_modules...$(RESET)"
	@rm -rf $(VENV_DIR) $(FRONTEND_DIR)/node_modules
	@echo "$(BOLD)$(GREEN)Limpieza profunda completada.$(RESET)"
