# Description: This file contains targets for running GitHub operations locally.
# =============================================================================
# GITHUB ACTIONS SECTION
#
# This section contains targets for running GitHub Actions workflows locally.
#
# Usage:
#   make workflow-<workflow-name> [DEBUG=true]
#
# Options:
#   DEBUG: set to true to see debug output (make DEBUG=true <target>)
#
# =============================================================================

GH_PAT ?= $(shell aws secretsmanager get-secret-value --secret-id GitHub-PAT-for-CICD --query SecretString --output text --region eu-central-1)

workflow-semantic-release:
	@cd .. && \
		gh act \
		-W .github/workflows/semantic-release.yml \
		--secret GH_PAT=${GH_PAT} \
		$(if $(DEBUG),-v,)
