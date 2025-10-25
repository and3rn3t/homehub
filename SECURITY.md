# Security Policy

## Supported Versions

We currently support the following versions of HomeHub with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them through one of the following methods:

### GitHub Security Advisories (Preferred)

1. Go to the [Security tab](https://github.com/and3rn3t/homehub/security)
2. Click "Report a vulnerability"
3. Fill out the advisory form with details

### Email

Send an email to: security@andernet.dev

Include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Regular Updates**: Every 7-14 days until resolved
- **Resolution Target**: 90 days for critical issues

## Security Best Practices for Contributors

### Code Security

1. **Never commit secrets**
   - No API keys, tokens, or passwords in code
   - Use `.env` files (never committed)
   - Use environment variables in CI/CD

2. **Input Validation**
   - Validate all user inputs
   - Sanitize data before storage
   - Use TypeScript for type safety

3. **Dependencies**
   - Keep dependencies updated (Renovate/Dependabot)
   - Review dependency changes in PRs
   - Avoid packages with known vulnerabilities

### Authentication & Authorization

1. **User Data**
   - Hash passwords (bcrypt/argon2)
   - Use secure session management
   - Implement CSRF protection

2. **API Security**
   - Rate limiting on endpoints
   - Authentication tokens with expiration
   - CORS configuration properly set

### Cloudflare Worker Security

1. **Environment Variables**
   - Use `wrangler secret` for sensitive data
   - Never log sensitive information
   - Validate all incoming requests

2. **KV Store**
   - Encrypt sensitive data before storage
   - Use proper access controls
   - Regular security audits

### Frontend Security

1. **XSS Prevention**
   - Sanitize HTML content
   - Use React's built-in XSS protection
   - Avoid `dangerouslySetInnerHTML`

2. **CSP Headers**
   - Proper Content Security Policy
   - Restrict inline scripts
   - Whitelist trusted sources

## Security Features in HomeHub

### Current Implementation

- ✅ HTTPS-only in production
- ✅ Content Security Policy headers
- ✅ X-Frame-Options for clickjacking prevention
- ✅ XSS protection headers
- ✅ Input validation on all forms
- ✅ Rate limiting on API endpoints
- ✅ Secure session management

### Planned Features

- 🔄 Two-factor authentication (Phase 6)
- 🔄 Audit logging (Phase 6)
- 🔄 Role-based access control (Phase 6)
- 🔄 End-to-end encryption for sensitive data (Phase 8)

## Disclosure Policy

Once a security vulnerability is fixed:

1. **Coordinated Disclosure**:
   - Reporter notified first
   - Public disclosure after 90 days or when patched

2. **Security Advisory**:
   - Published in GitHub Security Advisories
   - Details on affected versions
   - Upgrade instructions

3. **Credit**:
   - Security researchers credited (if desired)
   - Added to SECURITY_HALL_OF_FAME.md

## Security Hall of Fame

We thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- Will be updated as researchers report issues -->

_No reports yet - be the first!_

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)

## Questions?

If you have questions about this security policy, please open a [Discussion](https://github.com/and3rn3t/homehub/discussions) in the Security category.

---

**Last Updated**: October 15, 2025
