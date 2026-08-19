.DEFAULT_GOAL := help

# npm writes/updates this file after every successful install; using it (not
# a hand-rolled marker) lets make skip installing when node_modules is already
# current for the checked-in lockfile. Prefer `npm ci` (strict, reproducible);
# fall back to `npm install` when a workspace package.json has drifted ahead
# of the lockfile, so adding/editing a workspace never requires a manual
# one-off `npm install` before `make` works again.
NODE_MODULES := node_modules/.package-lock.json

$(NODE_MODULES): package.json package-lock.json $(wildcard apps/*/package.json) $(wildcard packages/*/package.json)
	npm ci || npm install

.PHONY: install
install: $(NODE_MODULES) ## Install dependencies (only if package.json/lockfile changed)

.PHONY: lint
lint: $(NODE_MODULES) ## Lint the whole workspace with ESLint
	npm run lint

.PHONY: lint-fix
lint-fix: $(NODE_MODULES) ## Lint and auto-fix what ESLint can fix
	npm run lint:fix

.PHONY: format
format: $(NODE_MODULES) ## Format the whole workspace with Prettier
	npm run format

.PHONY: format-check
format-check: $(NODE_MODULES) ## Check formatting without writing changes
	npm run format:check

.PHONY: typecheck
typecheck: $(NODE_MODULES) ## Type-check every workspace
	npm run typecheck

.PHONY: test
test: $(NODE_MODULES) ## Run the vitest suite
	npm run test

.PHONY: build
build: typecheck ## Build the fixture sites (requires a clean typecheck)
	npm run build:fixture
	# web-olive is the only site that reads site copy from the CMS, so it is
	# the only build that exercises the site_copy reader.
	npm run build:fixture -- apps/web-olive

.PHONY: check
check: lint format-check typecheck test ## Run everything CI runs, short of the build

.PHONY: ci
ci: lint format-check typecheck test build ## Reproduce the CI pipeline locally, in order

.PHONY: dev-web
dev-web: $(NODE_MODULES) ## Run the web dev server
	npm run dev:web

.PHONY: dev-cms
dev-cms: $(NODE_MODULES) ## Run the CMS dev server
	npm run dev:cms

.PHONY: clean
clean: ## Remove every ephemeral/generated file: build output, caches, installed deps
	rm -rf dist apps/*/dist
	rm -rf .astro apps/*/.astro
	rm -rf .wrangler apps/*/.wrangler
	rm -rf .mf apps/*/.mf
	rm -rf coverage apps/*/coverage packages/*/coverage
	rm -f wrangler.toml
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

.PHONY: help
help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "\033[36m%-14s\033[0m %s\n", $$1, $$2}'
