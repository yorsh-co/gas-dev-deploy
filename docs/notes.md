# gas-dev-deploy: notes

Written 2026-10-31. Starting notes for a gas-dev-\* tool that sets up and deploys Apps Script projects, extracted from `gas-auth-calendly/scripts/setup-gas-project`. Nothing is built yet.

## What it is

`setup-gas-project` is a setup and deployment wizard for an Apps Script _project_:

1. Logs in with clasp, or switches account.
2. Creates or reuses a script project.
3. Writes `.clasp.json` and `appsscript.json` from the `.example.json` templates.
4. Pushes the source.
5. Walks the user through deploying the web app by hand.
6. Records the web app URL, deployment ID and version in `.env`.

It is not a release script. gas-dev-release publishes a _library_ to its `dist` branches; this tool configures and deploys the _apps_ that consume the libraries.

## Why a separate package

- **Not gas-webapp.** gas-webapp is a library consumed through gas-dev-bundle and its `dist` branch. Node tooling in it never reaches the projects that need to deploy, which would end up copying the scripts, as happened with `sync-gas-webapp.sh`. The wizard also doesn't depend on gas-webapp: any Apps Script web app needs it.
- **Not gas-dev-config.** That package holds presets, the drift check and test tooling for library authors. An interactive wizard would add weight to every library that installs it.
- **Not gas-dev-release.** That package is release-only.
- **Fits the suite's pattern:** one tool per concern, installed as a dev dependency from GitHub with a `#semver:` range.

## Proposed split

- **Generic core in gas-dev-deploy:**
  - clasp login and account switching
  - create or reuse the project
  - apply the `.clasp.json` and `appsscript.json` templates
  - push
  - the guided manual deployment
  - record the deployment details in `.env`
- **App-specific steps stay in the app.** gas-auth-calendly keeps its Calendly OAuth prompts and its Script Properties setup. The tool needs a way for a project to add steps.
- **Manual deployment stays.** Deploying through the editor triggers the OAuth consent prompt for the manifest's scopes without needing a GCP OAuth client, which `clasp run` or a programmatic flow would require. Document the reason in the README.

## Open design question

How do app-specific steps plug in?

- **A JS module the project provides**, such as a `gas-dev-deploy.config.js` that exports extra steps. Flexible, and suits interactive prompts such as Calendly's.
- **A declarative `gasDevDeploy` key in `package.json`**, mirroring `gasDevConfig`. Simpler, and can be validated by `gas-dev-config check`, but limited to what the schema anticipates.

The rest of the plan follows from this choice.

## Likely consumers

- gas-auth-calendly, the source of the scripts.
- magb.kpis.
- gas-webapp's `manual/` fixture. Today it needs `clasp push` and a manual deploy after `npm run manual:build`. With this tool, that becomes `npm run manual:build && npx gas-dev-deploy`.

## Issues to fix while extracting

| Issue                                                                                                                                                         | Where                            | Fix                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `getDeploymentDetails` parses clasp's human-readable `deployments` output with a regex, so a clasp formatting change breaks it silently.                      | `services/clasp/deployment.js`   | Use JSON output if clasp 3.4 offers it for deployments; otherwise test the parsing against captured output. |
| `configureClasp` merges into `.clasp.json`, but `removeConfigFiles` deletes it outright.                                                                      | `services/clasp/config.js`       | Pick one behaviour and document it.                                                                         |
| The fallback timezone is hard-coded to `America/Sao_Paulo`, a client default.                                                                                 | `services/clasp/config.js`       | Use `Etc/UTC`, or require an answer.                                                                        |
| OAuth secrets are written to `.env`, loaded with `dotenv`.                                                                                                    | `lib/env.js`, `index.js`         | Have `gas-dev-config check` require `.env` in `.gitignore` for projects that use the tool.                  |
| The `gas:setup` script points at `scripts/setup-gas-auth-webapp/index.js`, but the directory is `setup-gas-project`, so the script doesn't run as configured. | gas-auth-calendly `package.json` | Fix as part of the extraction, or when gas-auth-calendly is updated.                                        |
| No tests.                                                                                                                                                     | —                                | Node tests like the other gas-dev-\* tools, with captured clasp output for the clasp wrapper.               |

## Source

`/home/jsp/Git/portfolio/gas/gas-auth-calendly/scripts/setup-gas-project`, about 1,160 lines:

```text
config/     path constants
lib/        shell, fs, env, prompt, step helpers
services/   clasp (auth, project, config, operations, deployment), calendly (oauth)
ui/         startup, instructions, completion, logger
```

Only `services/calendly/` and the Calendly steps in `index.js` are app-specific.
