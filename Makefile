.PHONY: dev backend frontend install clean

# Variables
PYTHON = python3
NPM = npm
BACKEND_DIR = backend
FRONTEND_DIR = frontend
VENV_DIR = $(BACKEND_DIR)/venv
VENV_PYTHON = $(VENV_DIR)/bin/python
VENV_PIP = $(VENV_DIR)/bin/pip
UVICORN = $(VENV_DIR)/bin/uvicorn

# Default target
dev:
	@echo "Starting full project (Backend + Frontend)..."
	@make -j 2 backend frontend

backend: $(VENV_DIR)
	@echo "Starting backend server in venv..."
	cd $(BACKEND_DIR) && PYTHONPATH=.. venv/bin/uvicorn sat_bridge:app --reload --port 8010

frontend:
	@echo "Starting frontend server..."
	cd $(FRONTEND_DIR) && $(NPM) run dev

$(VENV_DIR):
	@echo "Creating Python virtual environment..."
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "Installing backend dependencies..."
	$(VENV_PIP) install -r $(BACKEND_DIR)/requirements.txt

install: $(VENV_DIR)
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && $(NPM) install

clean:
	@echo "Cleaning Python cache and venv..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf $(VENV_DIR)
	@echo "Cleaning frontend build artifacts..."
	rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/node_modules/.vite
