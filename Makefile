.PHONY: start stop restart build logs ps clean help

# Default target
.DEFAULT_GOAL := help

start: ## Start the app (detached)
	docker compose up -d

start-watch: ## Start the app and follow logs
	docker compose up

stop: ## Stop the app
	docker compose down

restart: ## Restart all services
	docker compose restart

build: ## Rebuild images (use after dependency changes)
	docker compose build --no-cache

logs: ## Follow logs from all services
	docker compose logs -f

logs-backend: ## Follow backend logs only
	docker compose logs -f backend

logs-frontend: ## Follow frontend logs only
	docker compose logs -f frontend

ps: ## Show running containers
	docker compose ps

clean: ## Stop containers and remove volumes (wipes SQLite data)
	@echo "⚠️  This will delete all your watchlist and alert data."
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v

help: ## Show this help
	@echo ""
	@echo "  Stock Tracker — available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36mmake %-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  App:     http://localhost:5173"
	@echo "  API:     http://localhost:8000/docs"
	@echo ""
