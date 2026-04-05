# Branch Protection Requirements

This document describes the branch-protection rules that should be configured
manually in GitHub (Settings -> Branches -> Add rule) for the `main` branch.
These rules cannot be committed as code; they must be applied via the GitHub
UI (or via the REST API with an admin PAT).

## Protected branch: `main`

### Required status checks

Under **"Require status checks to pass before merging"**, enable the following
checks (they become selectable in the UI once they have run at least once):

- `Build, typecheck, test` (from `.github/workflows/ci.yml`)
- `ESLint` (from `.github/workflows/lint.yml`)

Also tick:

- [x] Require branches to be up to date before merging

### Required pull-request reviews

- [x] Require a pull request before merging
- [x] Require approvals: **1**
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require review from Code Owners (once a `.github/CODEOWNERS` file exists)

### Additional protections

- [x] Require conversation resolution before merging
- [x] Require signed commits (recommended)
- [x] Require linear history (recommended if you prefer squash/rebase)
- [x] Do not allow bypassing the above settings
- [ ] Include administrators (enable once the team is comfortable)

### Disallowed actions

- [ ] Allow force pushes -> **disabled**
- [ ] Allow deletions -> **disabled**

## How to apply

1. Open https://github.com/<org>/dpm-calendar/settings/branches
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Toggle the checkboxes listed above
5. Click **Create** / **Save changes**

After the CI and Lint workflows have run at least once on a PR or push, the
status-check names will appear in the autocomplete under "Require status
checks to pass before merging" and can be selected as required.
