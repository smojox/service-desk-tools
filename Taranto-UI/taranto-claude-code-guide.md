# Claude Code Integration Guide

Complete guide for using Taranto UI with Claude Code in local development.

## 🚀 Quick Setup

### 1. Install Taranto UI in Your Project

```bash
# Navigate to your project
cd your-project-name

# Install Taranto UI (assumes taranto-ui is in parent directory)
npm install ../taranto-ui

# Or if published to npm registry
npm install taranto-ui
```

### 2. Configure Tailwind

Your `tailwind.config.js` should include:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/taranto-ui/src/**/*.{js,jsx}"  // Add this line
  ],
  // ... rest of config is handled by taranto-ui
}
```

### 3. Import Styles

In your main `index.js` or `App.js`:

```javascript
import 'taranto-ui/src/styles/globals.css';
```

## 🤖 Using Claude Code

### Starting a New Project

When creating a new project with Claude Code, use this prompt template:

```
Create a [type of application] using React and Taranto UI design system.

Requirements:
- Use Taranto UI components only (Button, Card, Input, etc.)
- Follow Taranto brand guidelines (Turquoise primary, Poppins/Roboto fonts)
- [Layout preference]: Use [horizontal navigation / sidebar navigation]
- Include: [list your specific features]

Example screens needed:
- [Screen 1 description]
- [Screen 2 description]
```

### Example Prompts

#### Dashboard Application
```
Create a parking enforcement dashboard using Taranto UI.

Use:
- SidebarNav for navigation
- StatCard components for metrics (Total PCNs, Active Permits, Officers On Duty)
- Table component for recent violations
- Card components for sections

Include:
- Dashboard overview page
- Violations list page
- Quick action buttons (Issue PCN, Search Vehicle)
```

#### Form Application
```
Create a PCN issuance form using Taranto UI.

Use:
- Horizontal navigation
- Input components with icons for vehicle registration, location
- Dropdown for violation type
- Textarea for notes
- Button group (Cancel, Save Draft, Issue PCN)

Validation:
- Required fields should show error states
- Submit button should be disabled until form is valid
```

#### Data Table Application
```
Create a violations management system using Taranto UI.

Use:
- Table component with sortable columns
- Badge components for status (Issued, Paid, Appeal, Cancelled)
- Dropdown filters for status and date range
- Pagination component
- Search input with icon

Features:
- Click row to view details
- Bulk actions (Export, Archive)
```

## 📋 Component Usage Patterns

### Common Patterns Claude Should Follow

#### 1. Page Layouts

```javascript
// Standard page with sidebar
import { SidebarNav, Card, Button } from 'taranto-ui';

function DashboardPage() {
  return (
    <div className="flex h-screen">
      <SidebarNav />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="taranto-heading text-2xl mb-6">Dashboard</h1>
          {/* Content */}
        </div>
      </main>
    </div>
  );
}
```

#### 2. Forms

```javascript
// Standard form pattern
import { Card, Input, Dropdown, Button } from 'taranto-ui';
import { Search, Mail, Phone } from 'lucide-react';

function IssueP CNForm() {
  return (
    <Card>
      <h2 className="taranto-heading text-xl mb-6">Issue New PCN</h2>
      
      <div className="space-y-4">
        <Input 
          label="Vehicle Registration"
          placeholder="AB21 XYZ"
          icon={<Search size={18} />}
          required
        />
        
        <Dropdown
          label="Violation Type"
          options={[...]}
          required
        />
        
        <div className="flex gap-3 mt-6">
          <Button color="grey" variant="outline">Cancel</Button>
          <Button color="turquoise">Issue PCN</Button>
        </div>
      </div>
    </Card>
  );
}
```

#### 3. Data Tables

```javascript
// Standard table pattern
import { Table, Badge, Button } from 'taranto-ui';
import { Download } from 'lucide-react';

function ViolationsTable() {
  const columns = [
    { key: 'pcn', label: 'PCN Number' },
    { key: 'registration', label: 'Vehicle' },
    { key: 'location', label: 'Location' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => (
      <Badge color={row.statusColor}>{row.status}</Badge>
    )}
  ];

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="taranto-heading text-xl">Recent Violations</h2>
        <Button size="small" icon={<Download size={16} />}>
          Export
        </Button>
      </div>
      <Table columns={columns} data={data} />
    </Card>
  );
}
```

## 🎨 Design System Rules for Claude

### Mandatory Rules

1. **Buttons**
   - Always use `rounded-lg` (never square or pill)
   - Always filled variant (never outline or ghost)
   - Only `small` or `medium` sizes (never large)
   - Colors: turquoise (primary), green (success), orange (warning), red (danger), grey (secondary)

2. **Navigation**
   - Choose either horizontal OR sidebar (be consistent)
   - Use Taranto colors for active states
   - Always include logo/branding

3. **Modals**
   - Destructive actions use red color
   - Icons without background circles
   - Cancel button has grey outline
   - Action button uses appropriate color

4. **Typography**
   - Headings: Poppins, bold
   - Body text: Roboto, regular
   - Use `taranto-heading` and `taranto-body` utility classes

5. **Spacing**
   - Use consistent spacing (p-4, p-6, gap-3, gap-4)
   - Cards should have comfortable padding

### Recommended Patterns

```javascript
// Color usage
Primary actions: color="turquoise"
Success states: color="green"
Warnings: color="orange"
Destructive actions: color="red"
Secondary actions: color="grey"

// Layout spacing
Page padding: p-6
Card padding: p-4
Gap between elements: gap-3 or gap-4
Section margins: mb-6

// Typography
Page title: text-2xl or text-3xl
Section heading: text-xl
Subsection: text-lg
Body: text-base (default)
Small text: text-sm
```

## 🔍 Asking Claude Code for Help

### Component Discovery

```
"What Taranto UI components should I use for a [description]?"
```

### Implementation Guidance

```
"Show me how to build a [feature] using Taranto UI components with proper styling"
```

### Fixing Issues

```
"This component isn't styled correctly. Apply Taranto UI design system properly."
```

### Refactoring

```
"Refactor this code to use Taranto UI components instead of plain HTML/CSS"
```

## 📦 Project Structure

Recommended structure when using Taranto UI:

```
your-app/
├── src/
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── FormLayout.jsx
│   │   ├── features/
│   │   │   ├── violations/
│   │   │   ├── permits/
│   │   │   └── reports/
│   │   └── shared/
│   │       └── (app-specific components)
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Violations.jsx
│   │   └── ...
│   ├── App.jsx
│   └── index.js
├── tailwind.config.js
└── package.json
```

## ⚡ Performance Tips

1. **Tree Shaking**: Only import components you use
   ```javascript
   // Good
   import { Button, Card } from 'taranto-ui';
   
   // Avoid
   import * as TarantoUI from 'taranto-ui';
   ```

2. **Code Splitting**: Use lazy loading for routes
   ```javascript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

3. **Memoization**: Use React.memo for expensive components
   ```javascript
   export const ViolationsTable = React.memo(({ data }) => {
     // component code
   });
   ```

## 🐛 Troubleshooting

### Common Issues

**Styles not applying:**
- Check Tailwind content paths include taranto-ui
- Verify globals.css is imported
- Ensure fonts are loading

**Components not found:**
- Verify taranto-ui is installed
- Check import paths
- Restart development server

**Colors not working:**
- Tailwind config must include Taranto colors
- Use exact color names: 'taranto-turquoise' not 'turquoise'

## 📞 Getting Help

When asking Claude Code for help, include:
1. What you're trying to build
2. Which Taranto UI components you're using
3. Any error messages
4. Your current code

Example:
```
I'm building a violations table using Taranto UI Table component.
I need to add:
- Sortable columns
- Status badges
- Row click to view details

Current code:
[paste code]

Error: [if any]
```

## 🎯 Best Practices

1. **Consistency**: Use the same navigation style throughout app
2. **Accessibility**: Always include labels and aria attributes
3. **Responsiveness**: Test on mobile, tablet, desktop
4. **Error Handling**: Show appropriate error states
5. **Loading States**: Use Spinner or Skeleton components
6. **Empty States**: Use EmptyState component when no data

## 📚 Additional Resources

- Component Documentation: `/docs/COMPONENTS.md`
- Design Tokens: `/docs/DESIGN_TOKENS.md`
- Accessibility Guide: `/docs/ACCESSIBILITY.md`
- Example Applications: `/examples/`

---

**Remember**: The goal is to create consistent, professional applications that look and feel like they're part of the Taranto Systems family. Claude Code should always respect these design system guidelines.