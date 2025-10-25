import fs from 'fs'

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8')

// Fix duplicate className attributes by merging them
content = content.replace(/className="([^"]+)" className="([^"]+)"/g, 'className="$1 $2"')

// Fix HomeIcon reference
content = content.replace(/\|\| HomeIcon/g, '|| HouseIcon')

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf-8')

console.log('✅ Fixed duplicate className props')
