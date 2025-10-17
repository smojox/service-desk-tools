# Taranto UI Component Documentation

Complete reference for all 50+ components in the Taranto UI design system.

## 🎨 Component Overview

### Buttons & Actions
- Button
- Icon Button
- Button Group

### Form Inputs
- Input
- Textarea
- File Upload

### Selection Controls
- Checkbox
- Radio
- Switch
- Slider

### Dropdowns
- Dropdown (Basic Select)
- Dropdown with Search
- Dropdown with Icons

### Feedback Components
- Alert
- Badge
- Progress
- Spinner
- Toast
- Skeleton

### Navigation
- Tabs
- Breadcrumb
- Pagination
- Stepper
- Horizontal Nav
- Sidebar Nav

### Data Display
- Table
- Stat Card
- Avatar
- Chip
- Timeline
- List Group
- Empty State

### Layout
- Card
- Accordion
- Divider
- Grid

### Overlays
- Modal
- Drawer

---

## 📦 Button

Primary action button component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Button content |
| color | 'turquoise' \| 'green' \| 'orange' \| 'red' \| 'grey' | 'turquoise' | Button color |
| size | 'small' \| 'medium' | 'medium' | Button size |
| icon | ReactNode | - | Icon element (from lucide-react) |
| disabled | boolean | false | Disabled state |
| onClick | Function | - | Click handler |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Button } from 'taranto-ui';
import { Plus } from 'lucide-react';

// Basic button
<Button color="turquoise">
  Create
</Button>

// Button with icon
<Button color="green" icon={<Plus size={18} />}>
  Add New
</Button>

// Small button
<Button color="orange" size="small">
  Delete
</Button>

// Disabled button
<Button color="turquoise" disabled>
  Loading...
</Button>
```

### Design Rules

- ✅ Always rounded (`rounded-lg`)
- ✅ Always filled (no outline variant)
- ✅ Only small and medium sizes
- ✅ Use appropriate colors for context

---

## 📝 Input

Text input component with icon support.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placeholder | string | '' | Placeholder text |
| type | 'text' \| 'email' \| 'password' \| 'tel' \| 'date' | 'text' | Input type |
| variant | 'outlined' \| 'filled' \| 'underline' | 'outlined' | Input style |
| icon | ReactNode | - | Icon element |
| disabled | boolean | false | Disabled state |
| error | boolean | false | Error state |
| value | string | - | Input value |
| onChange | Function | - | Change handler |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Input } from 'taranto-ui';
import { Search, Mail } from 'lucide-react';

// Basic input
<Input placeholder="Enter text..." />

// Input with icon
<Input 
  placeholder="Search..." 
  icon={<Search size={18} />}
/>

// Email input
<Input 
  type="email"
  placeholder="email@example.com"
  icon={<Mail size={18} />}
/>

// Error state
<Input 
  placeholder="Required field"
  error={true}
/>
```

---

## 🎴 Card

Container component for content sections.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Card content |
| variant | 'elevated' \| 'outlined' \| 'flat' | 'elevated' | Card style |
| hover | boolean | false | Enable hover effect |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Card } from 'taranto-ui';

// Basic card
<Card>
  <h2>Title</h2>
  <p>Content goes here</p>
</Card>

// Card with hover effect
<Card hover>
  <h2>Clickable Card</h2>
</Card>

// Outlined card
<Card variant="outlined">
  <h2>Outlined Style</h2>
</Card>
```

---

## 🏷️ Badge

Status indicator component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Badge content |
| color | 'turquoise' \| 'green' \| 'orange' \| 'red' \| 'grey' | 'turquoise' | Badge color |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Badge size |
| shape | 'rounded' \| 'pill' | 'rounded' | Badge shape |
| variant | 'filled' \| 'outlined' | 'filled' | Badge variant |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Badge } from 'taranto-ui';

// Status badges
<Badge color="turquoise">Issued</Badge>
<Badge color="green">Paid</Badge>
<Badge color="orange">Pending</Badge>
<Badge color="red">Cancelled</Badge>

// Different sizes
<Badge size="small">Small</Badge>
<Badge size="medium">Medium</Badge>

// Pill shape
<Badge shape="pill">Pill Badge</Badge>

// Outlined variant
<Badge variant="outlined" color="turquoise">
  Outlined
</Badge>
```

---

## ☑️ Checkbox

Checkbox input component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | false | Checked state |
| onChange | Function | - | Change handler |
| label | string | - | Label text |
| disabled | boolean | false | Disabled state |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Checkbox } from 'taranto-ui';
import { useState } from 'react';

function MyForm() {
  const [agreed, setAgreed] = useState(false);
  
  return (
    <Checkbox 
      checked={agreed}
      onChange={setAgreed}
      label="I agree to the terms"
    />
  );
}
```

---

## 🔘 Radio

Radio button component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | false | Checked state |
| onChange | Function | - | Change handler |
| label | string | - | Label text |
| disabled | boolean | false | Disabled state |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Radio } from 'taranto-ui';
import { useState } from 'react';

function MyForm() {
  const [selected, setSelected] = useState('option1');
  
  return (
    <div>
      <Radio 
        checked={selected === 'option1'}
        onChange={() => setSelected('option1')}
        label="Option 1"
      />
      <Radio 
        checked={selected === 'option2'}
        onChange={() => setSelected('option2')}
        label="Option 2"
      />
    </div>
  );
}
```

---

## 🔄 Switch

Toggle switch component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | false | Checked state |
| onChange | Function | - | Change handler |
| label | string | - | Label text |
| disabled | boolean | false | Disabled state |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Switch } from 'taranto-ui';
import { useState } from 'react';

function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <Switch 
      checked={darkMode}
      onChange={setDarkMode}
      label="Enable dark mode"
    />
  );
}
```

---

## 📊 Progress

Progress bar component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | 0 | Current value (0-100) |
| max | number | 100 | Maximum value |
| color | 'turquoise' \| 'green' \| 'orange' | 'turquoise' | Progress color |
| showLabel | boolean | true | Show percentage label |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Bar size |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Progress } from 'taranto-ui';

// Basic progress bar
<Progress value={65} />

// Without label
<Progress value={80} showLabel={false} />

// Different colors
<Progress value={45} color="green" />
<Progress value={90} color="orange" />

// Different sizes
<Progress value={50} size="small" />
<Progress value={50} size="large" />
```

---

## 🔽 Dropdown

Dropdown select component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Field label |
| placeholder | string | 'Select...' | Placeholder text |
| options | Array | [] | Array of options |
| value | string | - | Selected value |
| onChange | Function | - | Change handler |
| disabled | boolean | false | Disabled state |
| error | boolean | false | Error state |
| searchable | boolean | false | Enable search |
| withIcons | boolean | false | Show option icons |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Dropdown } from 'taranto-ui';
import { useState } from 'react';

function ViolationForm() {
  const [violation, setViolation] = useState('');
  
  const options = [
    { value: 'disabled_bay', label: 'Parked in disabled bay' },
    { value: 'no_payment', label: 'Parking without payment' },
    { value: 'double_yellow', label: 'Parked on double yellow' }
  ];
  
  return (
    <Dropdown 
      label="Violation Type"
      options={options}
      value={violation}
      onChange={setViolation}
    />
  );
}

// With search
<Dropdown 
  label="Officer"
  options={officers}
  searchable
  placeholder="Search officers..."
/>

// With icons
<Dropdown 
  label="Status"
  options={statusOptions}
  withIcons
/>
```

---

## 🚨 Alert

Alert message component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | 'success' \| 'info' \| 'warning' \| 'error' | 'info' | Alert type |
| title | string | - | Alert title |
| message | string | - | Alert message |
| dismissible | boolean | false | Show close button |
| onDismiss | Function | - | Dismiss handler |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Alert } from 'taranto-ui';

// Success alert
<Alert 
  type="success"
  title="Success"
  message="PCN has been issued successfully"
/>

// Warning alert
<Alert 
  type="warning"
  title="Warning"
  message="This vehicle has multiple violations"
/>

// Dismissible alert
<Alert 
  type="info"
  message="Important information"
  dismissible
  onDismiss={() => console.log('Dismissed')}
/>
```

---

## 🔔 Toast

Toast notification component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | 'success' \| 'info' \| 'warning' \| 'error' | 'info' | Toast type |
| title | string | - | Toast title |
| message | string | - | Toast message |
| duration | number | 5000 | Auto-dismiss duration (ms) |
| onDismiss | Function | - | Dismiss handler |
| position | 'top-right' \| 'top-center' \| 'bottom-right' | 'top-right' | Toast position |

### Usage

```jsx
import { Toast, useToast } from 'taranto-ui';

function MyComponent() {
  const { showToast } = useToast();
  
  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Changes saved successfully'
    });
  };
  
  return (
    <Button onClick={handleSuccess}>
      Save Changes
    </Button>
  );
}
```

---

## 📋 Table

Data table component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | Array | [] | Column definitions |
| data | Array | [] | Table data |
| sortable | boolean | false | Enable sorting |
| onRowClick | Function | - | Row click handler |
| striped | boolean | true | Striped rows |
| hoverable | boolean | true | Row hover effect |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Table, Badge } from 'taranto-ui';

function ViolationsTable() {
  const columns = [
    { key: 'pcn', label: 'PCN Number', sortable: true },
    { key: 'registration', label: 'Vehicle' },
    { key: 'location', label: 'Location' },
    { key: 'date', label: 'Date', sortable: true },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => (
        <Badge color={row.statusColor}>
          {row.status}
        </Badge>
      )
    }
  ];

  const data = [
    { 
      pcn: 'PCN-001247', 
      registration: 'AB21 XYZ',
      location: 'High Street',
      date: '17 Oct 2024',
      status: 'Issued',
      statusColor: 'turquoise'
    },
    // ... more rows
  ];

  return (
    <Table 
      columns={columns}
      data={data}
      sortable
      onRowClick={(row) => console.log('Clicked:', row)}
    />
  );
}
```

---

## 📊 StatCard

Statistics card with trend indicator.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Stat label |
| value | string \| number | - | Stat value |
| icon | ReactNode | - | Icon element |
| trend | 'up' \| 'down' | - | Trend direction |
| trendValue | string | - | Trend percentage |
| color | string | 'turquoise' | Icon color |
| className | string | '' | Additional classes |

### Usage

```jsx
import { StatCard } from 'taranto-ui';
import { FileText } from 'lucide-react';

<div className="grid grid-cols-3 gap-4">
  <StatCard
    icon={<FileText size={24} />}
    label="Total PCNs"
    value="2,847"
    trend="up"
    trendValue="+12.5%"
  />
  <StatCard
    icon={<CreditCard size={24} />}
    label="Active Permits"
    value="1,243"
    trend="up"
    trendValue="+8.2%"
  />
  <StatCard
    icon={<Users size={24} />}
    label="Officers"
    value="24"
    trend="down"
    trendValue="-2"
  />
</div>
```

---

## 🗂️ Tabs

Tab navigation component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | Array | [] | Tab labels |
| activeTab | number | 0 | Active tab index |
| onChange | Function | - | Tab change handler |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Tabs, Card } from 'taranto-ui';
import { useState } from 'react';

function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = ['Overview', 'Violations', 'Permits', 'Reports'];
  
  return (
    <Card>
      <Tabs 
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      <div className="mt-4">
        {activeTab === 0 && <OverviewContent />}
        {activeTab === 1 && <ViolationsContent />}
        {activeTab === 2 && <PermitsContent />}
        {activeTab === 3 && <ReportsContent />}
      </div>
    </Card>
  );
}
```

---

## 🍞 Breadcrumb

Breadcrumb navigation component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | Array | [] | Breadcrumb items |
| separator | ReactNode | '/' | Separator element |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Breadcrumb } from 'taranto-ui';

<Breadcrumb 
  items={[
    { label: 'Home', href: '/' },
    { label: 'Violations', href: '/violations' },
    { label: 'PCN-001247' }
  ]}
/>
```

---

## 📄 Pagination

Pagination component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentPage | number | 1 | Current page |
| totalPages | number | - | Total pages |
| onPageChange | Function | - | Page change handler |
| siblingCount | number | 1 | Pages shown on each side |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Pagination } from 'taranto-ui';
import { useState } from 'react';

function ViolationsList() {
  const [page, setPage] = useState(1);
  
  return (
    <>
      {/* Your content */}
      
      <Pagination 
        currentPage={page}
        totalPages={10}
        onPageChange={setPage}
      />
    </>
  );
}
```

---

## 🎭 Modal

Modal dialog component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | boolean | false | Open state |
| onClose | Function | - | Close handler |
| title | string | - | Modal title |
| children | ReactNode | - | Modal content |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Modal size |
| showClose | boolean | true | Show close button |
| className | string | '' | Additional classes |

### Usage

```jsx
import { Modal, Button } from 'taranto-ui';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button color="red" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      
      <Modal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="medium"
      >
        <div className="flex items-start gap-4 mb-6">
          <AlertCircle size={24} className="text-taranto-red" />
          <div>
            <h3 className="text-lg font-bold mb-2">Remove Chart</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to remove this chart?
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button color="grey" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Remove Chart
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

---

## 🎯 Best Practices

### Component Composition

```jsx
// ✅ Good: Compose components logically
<Card>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">Recent Violations</h2>
    <Button size="small" icon={<Plus size={16} />}>
      Add New
    </Button>
  </div>
  
  <Input placeholder="Search..." icon={<Search size={18} />} />
  
  <Table columns={columns} data={data} />
  
  <Pagination currentPage={page} totalPages={10} />
</Card>

// ❌ Bad: Don't mix styling approaches
<div style={{ padding: '20px' }}>
  <Card className="custom-card">
    {/* Mixed styling */}
  </Card>
</div>
```

### Color Usage

```jsx
// ✅ Good: Use semantic colors
<Button color="turquoise">Save</Button>      // Primary action
<Button color="green">Approve</Button>       // Success action
<Button color="red">Delete</Button>          // Destructive action
<Button color="grey">Cancel</Button>         // Secondary action

// ❌ Bad: Inconsistent color usage
<Button color="orange">Save</Button>         // Wrong color for save
```

### Accessibility

```jsx
// ✅ Good: Include labels and ARIA attributes
<Input 
  label="Email Address"
  placeholder="email@example.com"
  aria-label="Email input"
  required
/>

// ❌ Bad: Missing labels
<Input placeholder="email@example.com" />
```

---

## 🚀 Performance Tips

1. **Memoize expensive components**
```jsx
const ViolationsTable = React.memo(({ data }) => {
  return <Table columns={columns} data={data} />;
});
```

2. **Use callback refs for dynamic content**
```jsx
const handleRowClick = useCallback((row) => {
  console.log(row);
}, []);
```

3. **Lazy load large datasets**
```jsx
const [page, setPage] = useState(1);
const paginatedData = useMemo(() => 
  data.slice((page - 1) * 25, page * 25),
  [data, page]
);
```

---

## 📚 Additional Resources

- **Getting Started**: See `GETTING_STARTED.md`
- **Claude Code Guide**: See `CLAUDE_CODE_GUIDE.md`
- **Design Tokens**: See `DESIGN_TOKENS.md`
- **Examples**: Check `/examples` directory

---

**Version**: 1.0.0  
**Last Updated**: October 2025