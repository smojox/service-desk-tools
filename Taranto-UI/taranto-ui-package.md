# Taranto UI Design System

Complete component library for Taranto Systems applications.

## 📦 Package Structure

```
taranto-ui/
├── package.json
├── README.md
├── tailwind.config.js
├── src/
│   ├── index.js
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   ├── Switch.jsx
│   │   ├── Checkbox.jsx
│   │   ├── Radio.jsx
│   │   ├── Progress.jsx
│   │   ├── Tabs.jsx
│   │   ├── Accordion.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Modal.jsx
│   │   ├── Drawer.jsx
│   │   ├── Alert.jsx
│   │   ├── Toast.jsx
│   │   ├── Table.jsx
│   │   ├── StatCard.jsx
│   │   ├── Avatar.jsx
│   │   ├── Chip.jsx
│   │   ├── Breadcrumb.jsx
│   │   ├── Pagination.jsx
│   │   ├── Stepper.jsx
│   │   ├── Timeline.jsx
│   │   ├── Divider.jsx
│   │   ├── Skeleton.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Spinner.jsx
│   │   └── index.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.css
│   └── utils/
│       ├── colors.js
│       └── helpers.js
├── docs/
│   ├── GETTING_STARTED.md
│   ├── COMPONENTS.md
│   ├── DESIGN_TOKENS.md
│   ├── ACCESSIBILITY.md
│   ├── BEST_PRACTICES.md
│   └── CLAUDE_CODE_GUIDE.md
├── examples/
│   ├── dashboard-example/
│   ├── form-example/
│   └── table-example/
└── starter-template/
    └── (Complete React app with Taranto UI)
```

## 🎨 Design Tokens

### Colors
```javascript
// Defined in tailwind.config.js
colors: {
  'taranto-turquoise': '#00ABC8',
  'taranto-green': '#80BC00',
  'taranto-orange': '#f05423',
  'taranto-red': '#dc2626',
  'taranto-grey': '#4d4d4f',
}
```

### Typography
- **Primary Font**: Poppins (headings, titles)
- **Secondary Font**: Roboto (body text, UI)

### Spacing
- Comfortable (default): Standard padding/margins
- Compact: Reduced spacing for dense layouts
- Spacious: Increased spacing for breathing room

### Border Radius
- All buttons: `rounded-lg` (8px)
- All cards: Configurable (medium default)

## 🚀 Quick Start

### Installation

```bash
# In your project directory
npm install ./taranto-ui
```

### Basic Usage

```jsx
import { Button, Card, Input } from 'taranto-ui';
import 'taranto-ui/dist/styles.css';

function App() {
  return (
    <Card>
      <h1>Welcome to Taranto</h1>
      <Input placeholder="Enter registration..." />
      <Button color="turquoise">Issue PCN</Button>
    </Card>
  );
}
```

## 📚 Component Categories

### 1. Buttons & Actions
- `<Button />` - Primary action buttons with icons
- Variants: filled (only option)
- Sizes: small, medium
- Colors: turquoise, green, orange, red, grey

### 2. Form Inputs
- `<Input />` - Text inputs with icons
- `<Textarea />` - Multi-line text input
- Styles: outlined, filled, underline

### 3. Selection Controls
- `<Checkbox />` - Single/multiple selection
- `<Radio />` - Single selection from group
- `<Switch />` - Toggle on/off states

### 4. Dropdowns
- `<Dropdown />` - Basic select dropdown
- `<DropdownSearch />` - With search functionality
- `<DropdownIcons />` - With icons/avatars

### 5. Feedback
- `<Alert />` - Success, info, warning, error messages
- `<Badge />` - Status indicators
- `<Progress />` - Progress bars
- `<Spinner />` - Loading indicators
- `<Toast />` - Temporary notifications
- `<Skeleton />` - Loading placeholders

### 6. Navigation
- `<Tabs />` - Tab navigation
- `<Breadcrumb />` - Page hierarchy
- `<Pagination />` - Page navigation
- `<HorizontalNav />` - Top navigation bar
- `<SidebarNav />` - Side navigation

### 7. Data Display
- `<Table />` - Data tables with sorting
- `<StatCard />` - Statistics with trends
- `<Avatar />` - User avatars with status
- `<Chip />` - Tags/labels
- `<Timeline />` - Event timeline
- `<EmptyState />` - No data state

### 8. Layout
- `<Card />` - Content containers
- `<Accordion />` - Collapsible sections
- `<Divider />` - Section separators

### 9. Overlays
- `<Modal />` - Dialog boxes
- `<Drawer />` - Side panels
- `<Toast />` - Notifications

## 🎯 Key Features

✅ **50+ Production-Ready Components**
✅ **Tailwind CSS for Styling**
✅ **Fully Typed (TypeScript definitions)**
✅ **Accessible (WCAG 2.1 AA)**
✅ **Responsive by Default**
✅ **Dark Mode Ready** (future)
✅ **Tree-shakeable**
✅ **Claude Code Optimized**

## 📖 Documentation

See the `/docs` folder for:
- Component API documentation
- Usage examples
- Best practices
- Accessibility guidelines
- Claude Code integration guide

## 🤖 Using with Claude Code

When starting a new project with Claude Code:

```
Create a new parking enforcement dashboard using Taranto UI. 
Include a stats overview, recent violations table, and quick actions.
Use the SidebarNav layout with Card components for sections.
```

Claude Code will automatically use your Taranto UI components!

## 🏗️ Project Standards

### Button Rules
- ✅ Always rounded (`rounded-lg`)
- ✅ Always filled variant
- ✅ Only small and medium sizes
- ✅ With or without icons

### Navigation Rules
- ✅ Horizontal OR Sidebar (choose based on app needs)
- ✅ Consistent across all pages

### Modal Rules
- ✅ Icon without background
- ✅ Red for destructive actions
- ✅ Grey border on Cancel button

## 📄 License

Internal use only - Taranto Systems Ltd.

## 🆘 Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintained By**: Taranto Systems Development Team