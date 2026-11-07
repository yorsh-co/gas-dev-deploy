# Changelog

---

## [Unreleased]

### Deprecated

- `gas-dev-deploy` is folded into [gas-dev-ci](https://github.com/yorsh-co/gas-dev-ci) as `gas-dev-ci setup`; the repository is to be archived and receives no further releases

---

## [0.1.0] - 2026-11-06

### Added

- `gas-dev-deploy` CLI with `--help` and `--version`; exits `0` on success, `1` on a failed deployment, `2` on invalid usage and `130` when cancelled
- Wizard steps: clasp login, project creation or reuse, configuration, push and guided web app deployment
- `gasDevDeploy.title` option in `package.json`
- `gasDevDeploy.steps` option to run project-defined steps after the deployment
- Public API: `DeployError` export and `DeployStep`, `DeployContext`, `Deployment`, `EnvAccess` and `DeployLog` types
- `.env` output with `GAS_SCRIPT_ID`, `GAS_WEBAPP_URL`, `GAS_DEPLOYMENT_ID` and `GAS_VERSION`, written with mode `0600`
- Preflight that refuses to run when `.env` is not git-ignored
- Supports Linux and macOS; Windows is not supported

---
