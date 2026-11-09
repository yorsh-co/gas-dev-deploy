# gas-dev-deploy

## Setup and deployment wizard for Google Apps Script web apps: clasp login, project, manifest, push and guided deployment.

> [!CAUTION]
> Deprecated: folded into [gasdev](https://github.com/yorsh-co/gasdev) as `gasdev setup`. See [Migrating to 3.0](https://github.com/yorsh-co/gasdev#migrating-to-30). This repository is archived.

> [!NOTE]
> `gas-dev-deploy` is development tooling. It is installed as a dev dependency and is never pushed to Apps Script.

> [!TIP]
> One of the gas-dev-\* tools. See [how they fit together](https://github.com/yorsh-co/gas-dev-config#gas-dev-tools) in gas-dev-config's README.

> **Disclaimer:**
> This project and [Yorsh](https://github.com/yorsh-co) are independent and are not affiliated with, endorsed by, or associated with Google LLC.

### Features

- Guided clasp login (or account switch), project creation or reuse, manifest, push and deployment for any Apps Script web app
- Machine-readable clasp output (`--json`), so a clasp formatting change cannot break the parsing
- Writes the script ID, web app URL, deployment ID and version to `.env`, keeping comments and other keys
- Refuses to run when `.env` is not git-ignored
- Plain ESM JavaScript, no build step and a single runtime dependency (`prompts`)

## Requirements

- Linux or macOS (Windows is not supported: clasp is spawned without a shell, so `clasp.cmd` cannot be resolved)
- Node.js `^22.13.0`, `^24.0.0` or `>=26.0.0`
- [clasp](https://github.com/google/clasp) 3.4+ on `PATH` (the wizard runs `clasp login` when needed)
- The Apps Script API enabled at https://script.google.com/home/usersettings

## Install

```sh
npm install -D github:yorsh-co/gas-dev-deploy#semver:^0.1.0
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "deploy:setup": "gas-dev-deploy"
  }
}
```

## Usage

Run it from the project root:

```sh
npm run deploy:setup
```

The wizard runs these steps in order:

1. **Authentication:** continue as the logged-in clasp user, or log in with another account.
2. **Apps Script project:** reuse the project in `.clasp.json`, or create a new one.
3. **Configuration:** write `.clasp.json` and the manifest, asking for the time zone.
4. **Push:** `clasp push --force`.
5. **Deployment:** open the script editor, wait while you deploy the web app, then read the deployment and confirm its URL.
6. **Summary:** script ID, web app URL, deployment ID and version.

Exit codes: `0` success, `1` failed deployment, `2` invalid usage, `130` cancelled.

## Configuration

Two templates are required at the project root:

- `.clasp.example.json`: the base of `.clasp.json`. Its optional `rootDir` (default `.`) is where the manifest is written.
- `appsscript.example.json`: the base of the manifest.

Options live in `package.json` under `gasDevDeploy`:

| Key     | Type   | Default                 | Description                        |
| ------- | ------ | ----------------------- | ---------------------------------- |
| `title` | string | `package.json` `"name"` | Title of a new Apps Script project |
| `steps` | string | none                    | Module with project-defined steps  |

Unknown keys are rejected.

## Custom steps

Set `gasDevDeploy.steps` to a project-relative path to an ES module (`.js` or `.mjs`, no `..` segments). Its default export is an array of steps, run in order after the deployment and before the summary:

```json
{ "gasDevDeploy": { "steps": "scripts/deploy-steps.js" } }
```

The module is loaded before login, so a broken module fails before anything touches Apps Script. Each step is `{ title, run(ctx) }`, where `title` is a non-empty string and `run` is a function that may be async. Throw `DeployError` (exported by `gas-dev-deploy`) to fail cleanly; any other error is reported as `Step "<title>" failed: <message>`. An error thrown from a prompt question's `validate`, `format` or `onSubmit` callback is reported by `prompts` as a cancel (`Cancelled.`, exit 130), so validate inputs in `run` when the message matters.

`ctx` has:

| Property             | Description                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `cwd`                | Project root                                                                       |
| `pkg`                | Parsed `package.json`                                                              |
| `deployment`         | `{ scriptId, webappUrl, deploymentId, version }`                                   |
| `env.read()`         | Parsed `.env`, empty when the file does not exist                                  |
| `env.update(values)` | Sets keys in `.env` in place, keeping comments; values must not contain newlines   |
| `prompt(questions)`  | [`prompts`](https://github.com/terkelg/prompts) questions; resolves to the answers |
| `log`                | `info`, `success`, `warn`, `error`, `raw` and `section`                            |
| `openScript()`       | Opens the script in the Apps Script editor                                         |

Types ship with the package. Steps run with your user privileges, so only point `steps` at code you trust. See [ADR 0002](docs/adr/0002-project-defined-steps.md).

### Example: Calendly OAuth credentials

A step that asks for a Calendly OAuth client ID and secret, stores them in `.env`, prints the Script Property to save and opens the editor:

```js
// scripts/deploy-steps.js
import { DeployError } from 'gas-dev-deploy';

/** @type {import('gas-dev-deploy').DeployStep[]} */
export default [
  {
    title: 'Calendly OAuth setup',
    async run(ctx) {
      const stored = ctx.env.read();
      let clientId = stored.CALENDLY_CLIENT_ID;
      let clientSecret = stored.CALENDLY_CLIENT_SECRET;

      let provide = true;
      if (clientId && clientSecret) {
        ctx.log.warn('Existing Calendly OAuth credentials detected');
        ({ provide } = await ctx.prompt({
          type: 'confirm',
          name: 'provide',
          message: 'Provide new credentials?',
          initial: true,
        }));
      }

      if (provide) {
        ({ clientId, clientSecret } = await ctx.prompt([
          { type: 'text', name: 'clientId', message: 'OAuth Client ID' },
          {
            type: 'password',
            name: 'clientSecret',
            message: 'OAuth Client Secret',
          },
        ]));
        if (!clientId || !clientSecret) {
          throw new DeployError('Client ID and secret are required');
        }
        ctx.env.update({
          CALENDLY_CLIENT_ID: clientId,
          CALENDLY_CLIENT_SECRET: clientSecret,
        });
      }

      const credentials = {
        clientId,
        clientSecret,
        redirectUri: ctx.deployment.webappUrl,
      };
      ctx.log.info('Save this JSON as a Script Property:');
      ctx.log.raw(JSON.stringify(credentials, null, 2));

      ctx.openScript();
      await ctx.prompt({
        type: 'text',
        name: 'done',
        message: 'After saving the Script Property, press ENTER to continue',
      });
    },
  },
];
```

## Files written

- `.clasp.json`: the template plus `scriptId`. It is always regenerated, never merged with an older file.
- `<rootDir>/appsscript.json`: the existing manifest, then the template, with the chosen `timeZone`. The default time zone is the template's, then the existing manifest's, then the system's, then `Etc/UTC`.
- `.env`: updated in place with the variables below, and created with mode `0600`.

## Environment variables

| Variable            | Value                                          |
| ------------------- | ---------------------------------------------- |
| `GAS_SCRIPT_ID`     | Apps Script project ID                         |
| `GAS_WEBAPP_URL`    | `https://script.google.com/macros/s/<id>/exec` |
| `GAS_DEPLOYMENT_ID` | Deployment ID of the web app                   |
| `GAS_VERSION`       | Deployed version number                        |

## Why deployment is manual

Deploying from the Apps Script editor triggers the OAuth consent prompt for the manifest's scopes without a Google Cloud OAuth client, which `clasp deploy` followed by `clasp run` would need. See [ADR 0001](docs/adr/0001-manual-web-app-deployment.md).

## Migrating from `scripts/setup-gas-project`

1. Remove the copied `scripts/setup-gas-project` directory and its dependencies (`chalk`, `execa`, `ora`, `dotenv`).
2. Install `gas-dev-deploy` and add the `deploy:setup` script.
3. Keep `.clasp.example.json` and `appsscript.example.json`; make sure `.env` is in `.gitignore`.
4. The `.env` variable names are unchanged.

## License

See [LICENSE.md](LICENSE.md).

## Support

Report issues at https://github.com/yorsh-co/gas-dev-deploy/issues.
