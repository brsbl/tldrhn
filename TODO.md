# TODO - Deployment & Open Source Checklist

## Deployment Prerequisites

### Package Configuration
- [ ] Update `package.json` name from `"temp-proj"` to `"tldrhn"` or `"tldr-hackernews"`
- [ ] Update `package.json` version from `"0.0.0"` to `"1.0.0"`
- [ ] Add `description`, `author`, `repository`, and `keywords` fields to `package.json`

### Environment Setup
- [ ] Set up production Vercel project
- [ ] Configure production environment variables in Vercel dashboard
- [ ] Set up staging environment for pre-release testing
- [ ] Verify `CRON_SECRET` is properly configured for GitHub Actions

### CI/CD Pipeline
- [ ] Add GitHub Actions workflow for running tests on PR/push
- [ ] Add build verification step before deployment
- [ ] Configure Vercel preview deployments for PRs

### Monitoring & Observability
- [ ] Set up error tracking (Sentry, LogRocket, or similar)
- [ ] Configure uptime monitoring
- [ ] Add structured logging for production debugging
- [ ] Set up alerts for cache refresh failures

---

## Open Source Requirements

### License
- [ ] Create `LICENSE` file with MIT license text (referenced in README but missing)

### Community Guidelines
- [ ] Create `CONTRIBUTING.md` with:
  - Development setup instructions
  - Code style guidelines
  - PR process
  - Testing requirements
- [ ] Create `CODE_OF_CONDUCT.md` (Contributor Covenant recommended)
- [ ] Create `SECURITY.md` with:
  - Security reporting process
  - Supported versions
  - Response timeline expectations

### GitHub Repository Setup
- [ ] Create `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] Create `.github/ISSUE_TEMPLATE/feature_request.md`
- [ ] Create `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] Add repository topics/tags on GitHub

### Documentation
- [ ] Create `CHANGELOG.md` to track releases
- [ ] Verify all environment variables are documented in `.env.example`
- [ ] Add API documentation for the `/api/summary` endpoint

---

## Nice to Have

### Testing
- [ ] Add integration tests for API endpoints
- [ ] Add E2E tests for the frontend
- [ ] Increase unit test coverage
- [ ] Add visual regression tests for generated images

### Developer Experience
- [ ] Add pre-commit hooks (lint, format, test)
- [ ] Create Docker setup for local development
- [ ] Add VS Code workspace settings and recommended extensions

### Features
- [ ] Add RSS feed output option
- [ ] Support for other HN endpoints (Show HN, Ask HN)
- [ ] Configurable summary length/style
- [ ] Dark mode for web interface

---

## Priority Order

1. **Immediate** (before first deploy): Package.json fixes, LICENSE file
2. **Before public release**: CI/CD, CONTRIBUTING.md, SECURITY.md
3. **Post-launch**: Monitoring, additional tests, feature enhancements
