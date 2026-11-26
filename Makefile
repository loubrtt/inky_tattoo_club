PORT ?= 3000

.PHONY: help install dev kill build start lint typecheck format check

help: ## Affiche les commandes
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

install: ## Installe les dépendances
	pnpm install

kill: ## Tue les process qui écoutent sur le port $(PORT)
	@pids=$$(lsof -ti tcp:$(PORT)); \
	if [ -n "$$pids" ]; then echo "kill $$pids (port $(PORT))"; kill $$pids; sleep 1; \
	  pids=$$(lsof -ti tcp:$(PORT)); [ -z "$$pids" ] || kill -9 $$pids; \
	else echo "port $(PORT) libre"; fi

dev: kill ## Libère le port puis lance le serveur de dev
	@[ -f .env.local ] || { echo ".env.local manquant : cp .env.example .env.local puis remplir"; exit 1; }
	pnpm dev --port $(PORT)

build: ## Build de production
	pnpm build

start: kill ## Lance le build de production
	pnpm start --port $(PORT)

lint: ## ESLint
	pnpm lint

typecheck: ## Vérifie les types
	pnpm typecheck

format: ## Formate le code
	pnpm format

check: lint typecheck ## Lint + types + format
	pnpm format:check
