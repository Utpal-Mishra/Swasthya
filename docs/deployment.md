# Deployment and operations guide

## 1. Deployment overview

Swasthya currently has two execution paths:

1. **Static GitHub Pages application** — the public website built from `index.html`, `styles.css` and `app.js`.
2. **Local Streamlit foundation** — the Python application used for experimentation and future server-side capabilities.

The public GitHub Pages application does not execute Python and cannot securely hold private API credentials.

## 2. Public website

Expected URL:

`https://utpal-mishra.github.io/Swasthya/`

Deployment is controlled by:

`.github/workflows/pages.yml`

The workflow runs when changes are pushed or merged into `main`, and it can also be triggered manually from GitHub Actions.

## 3. One-time GitHub Pages configuration

In the repository:

1. Open **Settings**.
2. Select **Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab.
5. Confirm that **Deploy Swasthya to GitHub Pages** is enabled.

Repository or organisation policies may require an owner to approve the first deployment.

## 4. Static deployment flow

```text
Merge or push to main
        |
        v
Checkout repository
        |
        v
Configure GitHub Pages
        |
        v
Upload repository as Pages artifact
        |
        v
Deploy github-pages environment
        |
        v
Public website URL
```

## 5. Preview the static site locally

From the repository root:

```bash
python -m http.server 8000
```

Open:

`http://localhost:8000`

A local server is preferred over opening the file directly because it more closely reflects hosted browser behaviour.

## 6. Run the Streamlit application locally

### macOS or Linux

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app/app.py
```

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run app/app.py
```

## 7. Deployment verification checklist

After a Pages deployment:

- Confirm the public URL returns the application rather than a 404.
- Check desktop and mobile layouts.
- Verify navigation links.
- Confirm location permission remains optional.
- Confirm radius filtering works.
- Confirm all current alerts remain labelled demonstration data.
- Open every official source link.
- Check browser developer tools for JavaScript errors.
- Confirm no secrets, tokens or exact user coordinates appear in the network log.

## 8. Common issues

### Public URL returns 404

Check:

- GitHub Pages source is set to **GitHub Actions**.
- The deployment workflow completed successfully.
- The repository is accessible under the expected owner and name.
- The URL uses the correct case: `/Swasthya/`.
- The Pages environment was approved if repository rules require approval.

### Workflow cannot deploy Pages

Check workflow permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

Also confirm the workflow has a `github-pages` environment and uses supported Pages actions.

### Styling or JavaScript is missing

The current application uses relative asset references:

- `styles.css`
- `app.js`

Keep these references relative so the application works under the repository path `/Swasthya/`.

### Location does not work

Browser geolocation may fail because:

- the user declined permission
- the browser or embedded viewer blocks location
- the device cannot determine a location
- the page is not served through a secure context

The interface must continue to support manual location entry.

## 9. Secrets and API integrations

Never add provider API keys to:

- `app.js`
- `index.html`
- committed configuration files
- public GitHub Pages assets

When authenticated provider integrations are introduced, use a server-side API or scheduled ingestion process with encrypted GitHub or cloud secrets.

Public browser calls are acceptable only when:

- the endpoint is intended for direct public use
- no secret is required
- CORS permits access
- licensing allows redistribution and presentation
- response validation and failure handling are implemented

## 10. Future backend deployment

A future backend may be deployed separately from GitHub Pages. The likely pattern is:

```text
GitHub Pages client
        |
        v
HTTPS API
        |
        +-- Provider adapters
        +-- Validation and risk engine
        +-- Provenance store
        +-- Optional notification service
```

Before backend deployment, define:

- environment configuration
- secret management
- database migration process
- health and readiness endpoints
- structured logging
- monitoring and alerting
- rollback procedure
- data-retention controls
- security and privacy review

## 11. Release process

For documentation or static-interface updates:

1. Create a scoped branch.
2. Make and review changes.
3. Verify locally.
4. Open a pull request against `main`.
5. Merge after review.
6. Confirm the Pages workflow succeeds.
7. Verify the public site.

For live-data changes, additionally require:

- provider and licence review
- schema and contract tests
- freshness and geographic-quality tests
- risk-rule review
- rollback and provider-disable plan
- documentation updates

## 12. Rollback

For a faulty static release:

1. Identify the last known-good commit.
2. Revert the faulty pull request or commit on `main`.
3. Allow the Pages workflow to redeploy.
4. Verify the public URL.
5. Document the cause and corrective action.

A live-data backend should also support disabling individual providers or rules without taking down unrelated categories.
