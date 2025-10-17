# Testing Quick Reference Card

## 🚀 Run Tests

```bash
# Everything
npm run test:all

# Individual suites
npm run test:e2e          # E2E (Playwright)
npm run test:integration  # Integration (Vitest)
npm run test:a11y         # Accessibility (axe)
npm test                  # Unit tests (watch mode)

# With UI
npm run test:e2e:ui       # Playwright UI
npm run test:ui           # Vitest UI

# Debug
npm run test:e2e:debug    # Step through E2E tests
npm run test:coverage     # Coverage report
```

## 📁 Test Files

```
tests/
├── e2e/device-discovery.spec.ts    # 7 E2E tests
├── e2e/scene-management.spec.ts    # 4 E2E tests
├── integration/device-control.test.ts      # 12 tests
├── integration/state-persistence.test.ts   # 18 tests
└── a11y/accessibility.test.tsx     # 11 tests
```

## 📊 Coverage

**Total**: 97+ tests

- Unit: 45+ (existing)
- Integration: 30+ (new)
- E2E: 11 (new)
- Accessibility: 11 (new)

## 🎯 Success Criteria

- ✅ All tests pass
- ✅ Coverage >70%
- ✅ 0 a11y violations
- ✅ <10min total runtime

## 🐛 Quick Fixes

**E2E fails "locator not found"**
→ Add `data-testid` attributes to components

**"Cannot find module '@/...'"**
→ Already fixed in `tests/tsconfig.json`

**Playwright "Browser not installed"**
→ Run: `npx playwright install chromium`

## 📚 Docs

- Full guide: `docs/guides/TESTING_GUIDE.md`
- Implementation: `docs/development/TESTING_IMPLEMENTATION_COMPLETE.md`
- Summary: `TESTING_COMPLETE_SUMMARY.md`

---

**Ready to test?** → `npm run test:all`
