# ==============================================================================
# 🌮 tribuTACOS — Plataforma de Inteligencia Fiscal y Pre-Declarador SAT
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help dev backend frontend install test test-cov build init-db reset-db recreate-db seed-demo export-demo sync sync-docs seed-sat clean clean-all

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
MAGENTA       := \033[35m

# ==============================================================================
# 📖 AYUDA / MENÚ PRINCIPAL
# ==============================================================================

help:
	@echo ""
	@echo "$(BOLD)$(CYAN)  🌮 tribuTACOS — Suite de Comandos de Desarrollo$(RESET)"
	@echo "$(CYAN)  ==============================================================$(RESET)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🚀 Servidores y Desarrollo:$(RESET)"
	@printf "  $(GREEN)make dev$(RESET)            Inicia Backend (FastAPI :$(PORT)) y Frontend (Vite) en paralelo\n"
	@printf "  $(GREEN)make backend$(RESET)        Inicia únicamente el servidor Backend con Hot-Reload\n"
	@printf "  $(GREEN)make frontend$(RESET)       Inicia únicamente el servidor de desarrollo Frontend (Vite)\n"
	@printf "  $(GREEN)make build$(RESET)          Compila el bundle estático de producción del Frontend\n"
	@echo ""
	@echo "$(BOLD)$(YELLOW)📦 Instalación y Dependencias:$(RESET)"
	@printf "  $(GREEN)make install$(RESET)        Configura el entorno virtual de Python e instala npm packages\n"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🧪 Pruebas y Calidad:$(RESET)"
	@printf "  $(GREEN)make test$(RESET)           Ejecuta la suite completa de pruebas con Pytest\n"
	@echo ""
	@echo "$(BOLD)$(YELLOW)💾 Datos, Base de Datos y Gestión Fiscal:$(RESET)"
	@printf "  $(GREEN)make reset-db$(RESET)       Elimina la BD actual y la recrea vacía con catálogos base\n"
	@printf "  $(GREEN)make recreate-db$(RESET)    Recrea la BD limpia y carga automáticamente el dataset de prueba\n"
	@printf "  $(GREEN)make init-db$(RESET)        Inicializa tablas relacionales y siembra parámetros SAT\n"
	@printf "  $(GREEN)make seed-demo$(RESET)      Carga el dataset completo de prueba (CFDIs, PDFs y cachés)\n"
	@printf "  $(GREEN)make export-demo$(RESET)    Exporta el estado actual de la BD a un fixture .json.gz\n"
	@printf "  $(GREEN)make sync$(RESET)           Sincroniza e ingesta XMLs desde carpetas locales\n"
	@printf "  $(GREEN)make sync-docs$(RESET)      Sincroniza y parsea PDFs oficiales del SAT (descargados/)\n"
	@printf "  $(GREEN)make seed-sat$(RESET)       Siembra catálogo de claves y tarifas Art. 152 LISR\n"
	@echo ""
	@echo "$(BOLD)$(YELLOW)🧹 Mantenimiento y Limpieza:$(RESET)"
	@printf "  $(GREEN)make clean$(RESET)          Limpia cachés de Python (__pycache__), dist y temporales\n"
	@printf "  $(GREEN)make clean-all$(RESET)      Limpieza profunda (elimina venv y node_modules)\n"
	@echo ""

# ==============================================================================
# 🚀 SERVIDORES Y DESARROLLO
# ==============================================================================

dev: $(VENV_DIR)
	@echo "$(BOLD)$(MAGENTA)🚀 Iniciando tribuTACOS en modo desarrollo (Backend :$(PORT) + Frontend)...$(RESET)"
	@make -j 2 backend frontend

backend: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)⚙️  Iniciando Backend FastAPI en http://$(HOST):$(PORT)...$(RESET)"
	@cd $(BACKEND_DIR) && PYTHONPATH=.. $(UVICORN) app.main:app --reload --host $(HOST) --port $(PORT)

frontend:
	@echo "$(BOLD)$(BLUE)💻 Iniciando Frontend Vite...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run dev

build:
	@echo "$(BOLD)$(CYAN)🔨 Compilando bundle de producción del Frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) run build

# ==============================================================================
# 📦 INSTALACIÓN Y ENTORNO
# ==============================================================================

$(VENV_DIR):
	@echo "$(BOLD)$(YELLOW)📦 Creando entorno virtual de Python en $(VENV_DIR)...$(RESET)"
	@$(PYTHON) -m venv $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)⬇️  Instalando dependencias de Backend en venv...$(RESET)"
	@$(VENV_PIP) install --upgrade pip
	@$(VENV_PIP) install -r $(BACKEND_DIR)/requirements.txt

install: $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)⬇️  Instalando dependencias de Frontend (npm)...$(RESET)"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@echo "$(BOLD)$(GREEN)✅ Instalación completada exitosamente.$(RESET)"

# ==============================================================================
# 🧪 PRUEBAS
# ==============================================================================

test: $(VENV_DIR)
	@echo "$(BOLD)$(CYAN)🧪 Ejecutando suite de pruebas unitarias y de integración...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(PYTEST) -v

# ==============================================================================
# 💾 GESTIÓN FISCAL, BASE DE DATOS Y SEEDING
# ==============================================================================

reset-db: $(VENV_DIR)
	@echo "$(BOLD)$(YELLOW)🗑️  Eliminando base de datos actual ($(DB_FILE))...$(RESET)"
	@rm -f $(DB_FILE)
	@echo "$(BOLD)$(GREEN)🌮 Recreando estructura relacional limpia y sembrando parámetros...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli init-db
	@echo "$(BOLD)$(GREEN)✅ Base de datos recreada limpia exitosamente.$(RESET)"

recreate-db: reset-db
	@echo "$(BOLD)$(CYAN)🌮 Sembrando catálogo del SAT y cargando dataset de prueba completo...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-demo --fixture
	@echo "$(BOLD)$(GREEN)✨ Base de datos recreada y poblada al 100% con datos de prueba.$(RESET)"

init-db: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)🌮 Inicializando base de datos SQLite y sembrando catálogos...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli init-db

seed-demo: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)🌮 Cargando dataset completo de prueba (CFDIs, PDFs y cachés)...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-demo

export-demo: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)📦 Exportando fixture de prueba a demo_dataset.json.gz...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli export-demo

sync: $(VENV_DIR)
	@echo "$(BOLD)$(BLUE)🔄 Sincronizando CFDIs desde almacenamiento local...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync

sync-docs: $(VENV_DIR)
	@echo "$(BOLD)$(BLUE)🏛️ Sincronizando documentos oficiales SAT en PDF...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli sync-sat-docs

seed-sat: $(VENV_DIR)
	@echo "$(BOLD)$(GREEN)🌱 Sembrando catálogos del SAT y tablas de impuestos...$(RESET)"
	@PYTHONPATH=$(BACKEND_DIR) $(VENV_PYTHON) -m app.cli seed-sat

# ==============================================================================
# 🧹 LIMPIEZA
# ==============================================================================

clean:
	@echo "$(BOLD)$(YELLOW)🧹 Limpiando cachés de Python y artefactos de compilación...$(RESET)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/node_modules/.vite
	@echo "$(BOLD)$(GREEN)✨ Limpieza completada.$(RESET)"

clean-all: clean
	@echo "$(BOLD)$(YELLOW)⚠️  Eliminando $(VENV_DIR) y $(FRONTEND_DIR)/node_modules...$(RESET)"
	@rm -rf $(VENV_DIR)
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(BOLD)$(GREEN)✨ Limpieza profunda completada.$(RESET)"
