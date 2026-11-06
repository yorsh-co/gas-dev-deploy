# gas-dev-deploy

## Setup and deployment wizard for Google Apps Script web apps: clasp login, project, manifest, push and guided deployment.

> [!NOTE]
> `gas-dev-deploy` is development tooling. It is installed as a dev dependency and is never pushed to Apps Script.

> [!TIP]
> One of the gas-dev-\* tools. See [how they fit together](https://github.com/yorsh-co/gas-dev-config#gas-dev-tools) in gas-dev-config's README.

> **Disclaimer:**
> This project and [Yorsh](https://github.com/yorsh-co) are independent and are not affiliated with, endorsed by, or associated with Google LLC.

### Features

- Guided clasp login, project creation, manifest and push for any Apps Script web app
- Writes the script ID, web app URL, deployment ID and version to `.env`
- Project-defined steps for app-specific setup
- Plain ESM JavaScript, no build step and a single runtime dependency (`prompts`)

## Requirements

- Node.js `^22.13.0`, `^24.0.0` or `>=26.0.0`
- [clasp](https://github.com/google/clasp) 3.4+ on `PATH`

## Install

```sh
npm install -D "gas-dev-deploy@github:yorsh-co/gas-dev-deploy#semver:^0.1.0"
```

## Usage

Work in progress: the wizard is not implemented yet.

```sh
npx gas-dev-deploy --help
```

## License

See [LICENSE.md](LICENSE.md).

## Support

Report issues at https://github.com/yorsh-co/gas-dev-deploy/issues.
