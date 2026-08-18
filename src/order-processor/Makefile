IMAGE ?= order-processor:latest

.DEFAULT_GOAL := help

.PHONY: help build push deploy

help: ## Show this help message
	@echo "Usage: make <target> [IMAGE=<image>]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make build IMAGE=myuser/order-processor:v1.0.0"
	@echo "  make push IMAGE=myuser/order-processor:v1.0.0"
	@echo "  make deploy IMAGE=myuser/order-processor:v1.0.0"

build: ## Build multi-arch image
	docker buildx build --platform linux/amd64,linux/arm64 -t $(IMAGE) .


push: ## Build and Push multi-arch image
	docker buildx build --platform linux/amd64,linux/arm64 -t $(IMAGE) --push .

deploy: ## Apply the k8s manifest and patch the deployment image
	kubectl apply -f k8s/deployment.yaml
	kubectl set image deployment/order-processor order-processor=$(IMAGE)
