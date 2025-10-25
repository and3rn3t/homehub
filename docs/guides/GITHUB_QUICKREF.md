# GitHub Configuration Quick Reference

**Quick lookup for all GitHub automation and policies**

## 🤖 Automated Workflows

| Workflow              | When                   | What                   | Duration |
| --------------------- | ---------------------- | ---------------------- | -------- |
| **CI/CD**             | Push/PR                | Tests, lint, build     | ~5-8 min |
| **Lighthouse**        | Push/PR/Weekly Mon 3am | Performance audit      | ~10 min  |
| **CodeQL**            | Push/PR/Weekly Mon 2am | Security analysis      | ~15 min  |
| **Dependency Review** | PR only                | Vulnerability scan     | ~2 min   |
| **Stale Bot**         | Daily 1am              | Cleanup old issues/PRs | ~1 min   |

## 📋 Issue Templates

| Template            | Use For                    | Auto Labels                     |
| ------------------- | -------------------------- | ------------------------------- |
| **Bug Report**      | Bugs, crashes, errors      | `bug`, `needs-triage`           |
| **Feature Request** | New features, enhancements | `enhancement`, `needs-triage`   |
| **Documentation**   | Doc issues                 | `documentation`, `needs-triage` |

## 🏷️ Label System

### Priority

- `critical` - App crashes/security issues
- `high` - Major feature broken
- `medium` - Feature partially broken
- `low` - Minor issues

### Status

- `needs-triage` - Awaiting review
- `work-in-progress` - Active development
- `stale` - No activity (auto-applied)
- `pinned` - Never close (exempt from stale bot)

### Type

- `bug` - Something broken
- `enhancement` - New feature/improvement
- `documentation` - Docs related
- `dependencies` - Dependency updates

### Component

- `npm` - Main app dependencies
- `workers` - Worker dependencies
- `ci` - GitHub Actions/workflow

## 🔒 Security Reporting

**Public issues**: Use bug template
**Security vulnerabilities**:

1. GitHub Security Advisories (preferred)
2. Email: security@andernet.dev

**Response time**: 48 hours acknowledgment

## 🤝 Contributing

1. **Fork & Clone**
2. **Create branch**: `feature/issue-123-description`
3. **Commit**: Use conventional commits (`feat:`, `fix:`, etc.)
4. **Test**: `npm run validate && npm test`
5. **Push & PR**: Use PR template

## 📊 Quality Gates

| Check          | Threshold     | Scope        |
| -------------- | ------------- | ------------ |
| **Statements** | 90%+          | Tier 1 files |
| **Branches**   | 85%+          | Tier 1 files |
| **Functions**  | 95%+          | Tier 1 files |
| **Lighthouse** | No regression | PRs          |
| **CodeQL**     | No critical   | Always       |

## 🚨 When Things Break

### CI Failing

1. Check workflow logs
2. Run locally: `npm run validate && npm test && npm run build`
3. Fix issues
4. Push again

### Coverage Too Low

1. Check coverage report artifact
2. Add tests for uncovered lines
3. Focus on Tier 1 files first

### CodeQL Alerts

1. Check Security tab
2. Review alert details
3. Fix or dismiss with justification
4. Push fix

## 🎯 Quick Commands

```bash
# Pre-PR checks
npm run validate        # Type + lint + format
npm test               # Run tests
npm run build          # Verify build

# Detailed checks
npm run test:coverage  # With coverage report
npm run lighthouse:ci  # Local Lighthouse

# Maintenance
npm run lint:fix       # Auto-fix lint issues
npm run lint:md:fix    # Fix markdown lint
```

## 📅 Automation Schedule

```
Daily   1:00am - Stale bot cleanup
Weekly  2:00am Mon - CodeQL security scan
Weekly  3:00am Mon - Lighthouse performance audit
Daily   3:00am - Dependabot checks
```

## 🔗 Important Links

- **Issues**: https://github.com/and3rn3t/homehub/issues
- **PRs**: https://github.com/and3rn3t/homehub/pulls
- **Actions**: https://github.com/and3rn3t/homehub/actions
- **Security**: https://github.com/and3rn3t/homehub/security
- **Discussions**: https://github.com/and3rn3t/homehub/discussions

## 📖 Full Documentation

- **SECURITY.md** - Security policy
- **CONTRIBUTING.md** - Contribution guide
- **docs/guides/GITHUB_CONFIGURATION_COMPLETE.md** - Complete setup details

---

**Last Updated**: October 15, 2025
