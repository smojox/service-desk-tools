# Taranto UI - Complete Setup Instructions

## 📋 Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Basic understanding of React
- Claude Code installed (for AI-assisted development)

## 🎯 Step 1: Create the Taranto UI Package

### 1.1 Create Package Directory

```bash
# Create the taranto-ui directory
mkdir taranto-ui
cd taranto-ui

# Initialize package
npm init -y
```

### 1.2 Create Directory Structure

```bash
mkdir -p src/components
mkdir -p src/styles
mkdir -p src/utils
mkdir -p docs
mkdir -p examples
```

### 1.3 Copy Files

Copy these files into your `taranto-ui` directory:

1. **package.json** - From the package.json artifact
2. **tailwind.config.js** - From the Tailwind config artifact
3. **src/components/** - All component files
4. **src/styles/globals.css** - From the styles artifact
5. **docs/** - All documentation files

### 1.4 Install Dependencies

```bash
npm install tailwindcss lucide-react
```

## 🚀 Step 2: Create Your First App with Taranto UI

### 2.1 Create New React App

```bash
# Navigate to your projects directory
cd ..

# Create new React app
npx create-react-app my-taranto-app
cd my-taranto-app
```

### 2.2 Install Taranto UI

```bash
# Install from local directory
npm install ../taranto-ui

# Install peer dependencies
npm install lucide-react
```

### 2.3 Configure Tailwind

```bash
# Install Tailwind
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init
```

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/taranto-ui/src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'taranto-turquoise': '#00ABC8',
        'taranto-green': '#80BC00',
        'taranto-orange': '#f05423',
        'taranto-red': '#dc2626',
        'taranto-grey': '#4d4d4f',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 2.4 Import Styles

Update `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  h1, h2, h3, h4, h5, h6 {
    @apply font-poppins;
  }

  body {
    @apply font-roboto;
  }
}
```

### 2.5 Create Example App

Update `src/App.js`:

```javascript
import { Button, Card, Input, Badge } from 'taranto-ui';
import { Search, Plus } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-taranto-turquoise mb-2">
            Parking Enforcement Dashboard
          </h1>
          <p className="text-gray-600">Welcome to Taranto Systems</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-gray-600 mb-1">Total PCNs</p>
            <p className="text-3xl font-bold text-taranto-grey">2,847</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Active Permits</p>
            <p className="text-3xl font-bold text-taranto-grey">1,243</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 mb-1">Officers</p>
            <p className="text-3xl font-bold text-taranto-grey">24</p>
          </Card>
        </div>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-taranto-grey">
              Recent Violations
            </h2>
            <Button color="turquoise" size="small" icon={<Plus size={16} />}>
              Issue PCN
            </Button>
          </div>

          <div className="mb-4">
            <Input 
              placeholder="Search violations..." 
              icon={<Search size={18} />}
            />
          </div>

          <div className="space-y-3">
            {[
              { pcn: 'PCN-001247', reg: 'AB21 XYZ', status: 'Issued', color: 'turquoise' },
              { pcn: 'PCN-001246', reg: 'CD43 ABC', status: 'Paid', color: 'green' },
              { pcn: 'PCN-001245', reg: 'EF65 DEF', status: 'Appeal', color: 'orange' }
            ].map((item) => (
              <div key={item.pcn} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-taranto-turquoise">{item.pcn}</p>
                  <p className="text-sm text-gray-600">{item.reg}</p>
                </div>
                <Badge color={item.color}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
```

### 2.6 Run Your App

```bash
npm start
```

Your app should now be running at `http://localhost:3000` with Taranto UI styling! 🎉

## 🤖 Step 3: Using with Claude Code

### 3.1 Open Your Project in Claude Code

```bash
# In your project directory
claude-code .
```

### 3.2 Tell Claude About Taranto UI

In Claude Code, start your first prompt with:

```
I'm building a [describe your app] using React and the Taranto UI design system.

Taranto UI components available:
- Button (rounded, filled only, small/medium sizes)
- Input (with icon support)
- Card, Badge, Switch, Checkbox, Radio
- Dropdown, Modal, Alert, Progress
- Table, Tabs, Pagination

Design rules:
- Primary color: Taranto Turquoise (#00ABC8)
- Fonts: Poppins (headings), Roboto (body)
- All buttons must be rounded and filled
- Use lucide-react for icons

Please create [your specific request]
```

### 3.3 Example Prompts

**Create a violations table:**
```
Using Taranto UI, create a violations management table with:
- Table component showing PCN number, vehicle, location, date, status
- Badge component for status colors
- Search Input with icon
- Button for "Export" action
- Pagination at bottom
```

**Create a form:**
```
Using Taranto UI, create a PCN issuance form with:
- Input fields for vehicle registration (with Search icon)
- Dropdown for violation type
- Textarea for notes
- Button group: Cancel (grey) and Issue PCN (turquoise)
- Validate required fields with error states
```

## 📚 Step 4: Reference Documentation

All documentation is in the `taranto-ui/docs/` folder:

- **GETTING_STARTED.md** - Quick start guide
- **COMPONENTS.md** - Full component API
- **CLAUDE_CODE_GUIDE.md** - Claude Code integration
- **DESIGN_TOKENS.md** - Colors, fonts, spacing
- **ACCESSIBILITY.md** - A11y guidelines
- **BEST_PRACTICES.md** - Development patterns

## 🔧 Step 5: Advanced Configuration

### Publishing Internally (Optional)

If you want to share Taranto UI across multiple projects:

#### Option A: npm Link (Development)

```bash
cd taranto-ui
npm link

cd ../your-project
npm link taranto-ui
```

#### Option B: Private npm Registry

```bash
# In taranto-ui directory
npm publish --registry=http://your-registry.com
```

#### Option C: Git Repository

```bash
# In your package.json
"dependencies": {
  "taranto-ui": "git+https://github.com/your-org/taranto-ui.git"
}
```

### TypeScript Support (Optional)

Create `src/index.d.ts`:

```typescript
import { ReactNode, MouseEventHandler } from 'react';

export interface ButtonProps {
  children: ReactNode;
  color?: 'turquoise' | 'green' | 'orange' | 'red' | 'grey';
  size?: 'small' | 'medium';
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export function Button(props: ButtonProps): JSX.Element;
// ... other component types
```

## 🎨 Step 6: Customization

### Extending Colors

In your app's `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'taranto-turquoise': '#00ABC8',
      'taranto-green': '#80BC00',
      'taranto-orange': '#f05423',
      'taranto-red': '#dc2626',
      'taranto-grey': '#4d4d4f',
      // Add your custom colors
      'custom-blue': '#1e40af',
    },
  },
}
```

### Adding Custom Components

Create app-specific components in `src/components/`:

```javascript
// src/components/ViolationCard.jsx
import { Card, Badge, Button } from 'taranto-ui';

export function ViolationCard({ violation }) {
  return (
    <Card>
      {/* Your custom component using Taranto UI */}
    </Card>
  );
}
```

## 🐛 Troubleshooting

### Styles Not Showing

1. Check Tailwind content paths include taranto-ui
2. Verify fonts are loading (check browser dev tools)
3. Clear build cache: `rm -rf node_modules/.cache`
4. Restart dev server

### Import Errors

1. Verify taranto-ui is installed: `npm list taranto-ui`
2. Check import paths: `import { Button } from 'taranto-ui'`
3. Ensure peer dependencies installed: `npm install lucide-react`

### Claude Code Not Finding Components

1. Make sure you've told Claude about available components
2. Reference the CLAUDE_CODE_GUIDE.md in your prompts
3. Be specific about which components to use

## ✅ Verification Checklist

- [ ] taranto-ui package created with all files
- [ ] New React app created and running
- [ ] taranto-ui installed in your app
- [ ] Tailwind configured with Taranto colors
- [ ] Fonts loading (Poppins & Roboto)
- [ ] Example app displays correctly
- [ ] Claude Code can access your project
- [ ] Documentation accessible

## 🎉 You're Ready!

You now have:
- ✅ Complete Taranto UI component library
- ✅ Working React app with Taranto styling
- ✅ Claude Code integration
- ✅ Full documentation
- ✅ Example implementations

## 📞 Next Steps

1. **Explore Components**: Try different components from the library
2. **Read Docs**: Check out the full documentation
3. **Build Features**: Use Claude Code to build your app features
4. **Share Feedback**: Note any components or features you need
5. **Iterate**: Update the design system as needed

---

**Need Help?**
- Check `/docs/CLAUDE_CODE_GUIDE.md` for detailed Claude Code usage
- Review `/examples/` for implementation patterns
- Refer to `/docs/COMPONENTS.md` for component APIs

**Happy Building! 🚀**