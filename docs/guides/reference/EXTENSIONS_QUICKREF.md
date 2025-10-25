# 🔌 VS Code Extensions - Quick Reference

## 🚀 One-Click Install

When you open this project, click **"Install All"** when prompted!

---

## ✨ Must-Have (Install First!)

| Extension                 | ID                          | What It Does                                       |
| ------------------------- | --------------------------- | -------------------------------------------------- |
| **ESLint**                | `dbaeumer.vscode-eslint`    | Catches errors as you type, auto-fixes on save     |
| **Prettier**              | `esbenp.prettier-vscode`    | Auto-formats code with consistent style            |
| **Tailwind IntelliSense** | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind classes + color previews |

---

## 🎯 Highly Recommended

| Extension              | ID                                     | Why You Need It                       |
| ---------------------- | -------------------------------------- | ------------------------------------- |
| **React Snippets**     | `dsznajder.es7-react-js-snippets`      | `rafce`, `usf`, `uef` - faster coding |
| **Error Lens**         | `usernamehw.errorlens`                 | See errors inline (not just in panel) |
| **Pretty TS Errors**   | `yoavbls.pretty-ts-errors`             | Makes TypeScript errors readable      |
| **DotENV**             | `mikestead.dotenv`                     | Syntax highlighting for `.env` files  |
| **GitLens**            | `eamodio.gitlens`                      | Git blame, history, compare           |
| **Cloudflare Workers** | `cloudflare.vscode-cloudflare-workers` | Deploy & debug Workers from editor    |

---

## 🛠️ Nice to Have

| Extension              | ID                                      | Benefit                       |
| ---------------------- | --------------------------------------- | ----------------------------- |
| **Auto Rename Tag**    | `formulahendry.auto-rename-tag`         | Rename JSX tags automatically |
| **Import Cost**        | `wix.vscode-import-cost`                | See bundle size of imports    |
| **Path Intellisense**  | `christian-kohler.path-intellisense`    | Autocomplete file paths       |
| **Git Graph**          | `mhutchie.git-graph`                    | Visual Git history            |
| **Markdown Mermaid**   | `bierner.markdown-mermaid`              | Preview diagrams in docs      |
| **Code Spell Checker** | `streetsidesoftware.code-spell-checker` | Catch typos                   |
| **Material Icons**     | `PKief.material-icon-theme`             | Beautiful file icons          |
| **GitHub Copilot**     | `GitHub.copilot`                        | AI code completion (paid)     |

---

## ⚠️ Don't Install These

| Extension          | Reason                  |
| ------------------ | ----------------------- |
| `hookyqr.beautify` | Conflicts with Prettier |
| `dbaeumer.jshint`  | Use ESLint instead      |

---

## 🎨 What You Get

### With ESLint + Prettier

```tsx
// Save file → Auto-formats + fixes issues
const example = { name: 'test' } // Becomes:
const example = { name: 'test' }
```

### With Tailwind IntelliSense

```tsx
<div className="bg-|">  // Shows all bg- classes with color preview
```

### With Error Lens

```tsx
const x: number = 'hello' // ERROR shown right here in red!
```

### With React Snippets

```
Type: rafce + Tab
↓
export const MyComponent = () => {
  return <div></div>
}
```

---

## ✅ Post-Install Checklist

After installing:

- [ ] Reload VS Code (`Ctrl+Shift+P` → "Reload Window")
- [ ] Open any `.tsx` file
- [ ] Save file - should auto-format
- [ ] Type invalid code - should show inline error
- [ ] Type `className="bg-` - should show Tailwind autocomplete

---

## 🆘 Quick Troubleshooting

**ESLint not working?**

```bash
Ctrl+Shift+P → "ESLint: Show Output Channel"
```

**Prettier not formatting?**

```bash
Ctrl+Shift+P → "Format Document With..." → Select Prettier
```

**Tailwind not autocompleting?**

```bash
Reload window: Ctrl+Shift+P → "Reload Window"
```

---

## 📚 Full Guide

See [docs/EXTENSIONS_GUIDE.md](./EXTENSIONS_GUIDE.md) for detailed info on each extension.

---

**Total Recommended: 23 extensions**
**Must-Have: 3** | **Highly Recommended: 7** | **Nice to Have: 13**
