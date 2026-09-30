# GitHub Pages deployment

Repository: https://github.com/Remco28/USAfencing-rules (public).
Custom domain: https://penalties.teamremco.org.
Scoring companion: https://penalties.teamremco.org/scoring/ (same artifact and domain).
Pages settings: https://github.com/Remco28/USAfencing-rules/settings/pages.
Deployment workflow: `.github/workflows/pages.yml`.

## What publishes

Every push to `main`, or a manual workflow run, rebuilds and verifies generated
reference data, runs search examples and JavaScript syntax checks, then uploads
only `site/` and deploys it. A failed validation prevents publication. Source
PDFs, SQLite, project docs and human feedback ZIPs are not in the website artifact.
The GitHub repository itself is public. No package install or paid plan is needed.

## DNS

In the teamremco.org zone:

| Type | Name | Target |
|---|---|---|
| CNAME | penalties | remco28.github.io |

The target is the account domain; do not append `/USAfencing-rules` or a scheme.
The repository Pages setting declares `penalties.teamremco.org`. An Actions
deployment does not require a `site/CNAME` file and does not use it to set a domain.

GitHub validates DNS and provisions a certificate. When the certificate is ready,
enable Enforce HTTPS in Pages settings. HTTPS is needed for the service worker
and offline support. DNS/certificate provisioning may take time; a successful
deployment alone does not establish DNS or guarantee certificate readiness.

## Inspect and recover

```sh
gh run list --repo Remco28/USAfencing-rules --workflow pages.yml
gh api repos/Remco28/USAfencing-rules/pages
gh api repos/Remco28/USAfencing-rules/pages/health
dig +short penalties.teamremco.org CNAME
```

To republish the latest main:

```sh
gh workflow run pages.yml --repo Remco28/USAfencing-rules
```

Domain and HTTPS administration uses a signed-in administrator or Pages settings;
the restricted deployment token is not used to administer HTTPS. Existing project
memory records that distinction from a previous deployment.

After release, open the site at phone width and search “grabbed my cord,”
“missing spare cord,” and “touching body crod.” Verify tabs, filters, diagrams
and offline reload. All relative asset paths support the custom-domain root.

The workflow uses official Pages actions and uploads a static artifact. See
[custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
and [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

The workflow also validates scoring data and retrieval checks. `/scoring/` has
its own narrowly scoped worker/cache; relative links connect the two guides. No
additional DNS entry is needed. After release, test both guides and visit each
online before testing offline. See [scoring audit](SCORING.md).

Verified September 30, 2026: the custom-domain certificate is approved and HTTPS
is enforced. DNS/HTTPS setup is complete for the shared domain.
