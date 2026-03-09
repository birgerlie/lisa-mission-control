# Mission Control - Custom Tool Builder

A Linear-style mission control system for building and managing custom tools. Built with Next.js, TypeScript, and Tailwind CSS.

![Mission Control Screenshot](screenshot.png)

## Features

- 🎨 **Linear-inspired UI** - Dark mode, minimal design, smooth animations
- ⌨️ **Keyboard-first** - Command palette (Cmd+K), keyboard shortcuts
- 🛠️ **Tool Builder** - Create custom tools with API configurations
- 📊 **Dashboard** - View and manage all your tools
- 💾 **Local Storage** - Data persists in browser
- ⚡ **Fast & Responsive** - Built with Next.js App Router

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd mission-control
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Esc` | Close modals / go back |
| `G D` | Go to dashboard |
| `G T` | Go to tools |
| `N` | Create new tool |

## Usage

### Creating a Tool

1. Click "New Tool" or press `N`
2. Fill in the tool details:
   - Name and description
   - Category (Automation, Data, Integration, Utility, Custom)
   - Icon
3. Configure the API settings (endpoint, method, headers, body)
4. Save the tool

### Managing Tools

- **Activate/Pause**: Click the play/pause button on any tool card
- **Edit**: Click on a tool card to edit its configuration
- **Search**: Use the command palette or dashboard search
- **Filter**: Filter by category using the pills

### Command Palette

Press `Cmd/Ctrl + K` to open the command palette. You can:
- Search tools by name
- Navigate to different sections
- Create new tools
- Access settings

## Customization

### Adding New Categories

Edit `src/types/index.ts`:

```typescript
export type ToolCategory = 
  | 'automation' 
  | 'data' 
  | 'integration' 
  | 'utility' 
  | 'custom'
  | 'your-new-category'; // Add here
```

Update `src/lib/utils.ts`:

```typescript
export const categoryColors: Record<string, string> = {
  // ... existing categories
  'your-new-category': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};
```

### Changing the Theme

Edit `tailwind.config.js`:

```javascript
colors: {
  linear: {
    bg: '#0f0f10',        // Background
    'bg-secondary': '#141415',
    accent: '#5e6ad2',    // Primary accent
    // ... more colors
  }
}
```

### Adding Icons

1. Import from Lucide in `src/components/Sidebar.tsx`:
```typescript
import { YourIcon } from 'lucide-react';
```

2. Add to the icon map:
```typescript
const iconMap = {
  // ... existing icons
  YourIcon,
};
```

## Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Main app page
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── CommandPalette.tsx  # Cmd+K palette
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── ToolCard.tsx    # Tool card component
│   │   └── ToolBuilder.tsx # Tool creation/editing
│   ├── hooks/
│   │   └── index.ts        # Custom React hooks
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   └── types/
│       └── index.ts        # TypeScript types
├── package.json
├── tailwind.config.js
└── README.md
```

## Roadmap

- [ ] Tool execution (actually run the tools)
- [ ] Scheduling/cron jobs
- [ ] Webhook triggers
- [ ] Tool templates
- [ ] Import/export tools
- [ ] Cloud sync
- [ ] Team collaboration
- [ ] Mobile app

## License

MIT License - feel free to use this for your own projects!

## Credits

Inspired by [Linear](https://linear.app) - the issue tracking tool we all love.
