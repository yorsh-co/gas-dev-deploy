# Changelog

---

## [Unreleased]

### Added

- `gas-dev-deploy` CLI with `--help` and `--version`
- Wizard steps: clasp login, project creation or reuse, configuration, push and guided web app deployment
- `gasDevDeploy.title` option in `package.json`
- `gasDevDeploy.steps` option to run project-defined steps after the deployment
- `.env` output with `GAS_SCRIPT_ID`, `GAS_WEBAPP_URL`, `GAS_DEPLOYMENT_ID` and `GAS_VERSION`
- Preflight that refuses to run when `.env` is not git-ignored

---
