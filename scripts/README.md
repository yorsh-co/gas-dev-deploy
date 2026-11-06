# setup-gas-project

Interactive setup wizard for configuring the Google Apps Script project, deployment, and OAuth configuration used by [`gas-auth-calendly`](https://github.com/yorsh-co/gas-auth-calendly).

This script simplifies the initial setup flow for deploying the Apps Script library and reduces the amount of required manual Apps Script + OAuth configuration.

---

### Responsibilities

The setup wizard:

- Authenticates with [`clasp`](https://github.com/google/clasp)
- Creates or reuses an Apps Script project
- Configures `.clasp.json`
- Configures `appsscript.json`
- Pushes the local source to the Apps Script project
- Guides the user through manual Web App deployment
- Collects Calendly OAuth credentials
- Guides the user through Script Properties configuration
- Stores deployment configuration in `.env`

---

### Run

```bash
npm install
npm run gas:setup
```
---

### Requirements

* [Node.js](https://nodejs.org/en/download) v20.0.0 or later
* The Apps Script API must be enabled:
  [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)
* A [Calendly developer account](https://developer.calendly.com/creating-an-oauth-app)

---

### Reasons for manual deployment

Web App deployment is intentionally performed manually through the Apps Script IDE instead of using `clasp deploy`.

This allows Apps Script to trigger the OAuth consent flow for the required scopes directly from the IDE.

An alternative approach would be using `clasp run` with `ScriptApp` to generate the authorization URL programmatically. However, this requires additional GCP OAuth client configuration, which this setup tool intentionally avoids.

---

### Files Managed By This Script

The setup wizard may overwrite existing instances of these files:

* `.clasp.json`
* `appsscript.json`
* `.env`

---

### Environment Variables

The setup flow stores deployment and OAuth configuration in `.env`.

Variables include:

```env
GAS_SCRIPT_ID=
GAS_WEBAPP_URL=
GAS_DEPLOYMENT_ID=
GAS_VERSION=

CALENDLY_CLIENT_ID=
CALENDLY_CLIENT_SECRET=
```

---

### Architecture

```txt
config/     Path constants
lib/        Shared utilities
services/   Setup orchestration and clasp integration
ui/         Terminal rendering and instructions
```

---

### Notes

* This is internal tooling for the repository, not a standalone package
* OAuth credentials are sensitive and should not be shared publicly
* For project documentation, licensing, and contribution information,
see the repository [root README](https://github.com/yorsh-co/gas-auth-calendly).

---