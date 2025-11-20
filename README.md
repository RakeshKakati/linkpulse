# PixelPulse

Lightweight, insights-first user analytics. Drop one snippet → instant dashboard.

## Features

- **Semantic Click Tracking** - Only tracks meaningful interactions
- **Rage Click Detection** - Identifies frustrated users
- **Scroll Depth** - Tracks engagement (50%, 75%, 100%)
- **Form Drop-off Analysis** - See where users abandon forms
- **Broken UI Flow Detection** - Automatic detection of unresponsive elements
- **JavaScript Error Tracking** - Catch errors affecting users
- **Performance Monitoring** - Track slow tasks and network requests

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema from `supabase/schema.sql` in your Supabase SQL editor
3. Get your project URL and service key

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Usage

### Add PixelPulse to Your Site

Add this snippet before the closing `</body>` tag:

```html
<script>
  window.PIXELPULSE_ENDPOINT = "https://yourapp.com/api/pp";
</script>
<script src="https://yourapp.com/pixelpulse.js"></script>
```

Or use the local version during development:

```html
<script>
  window.PIXELPULSE_ENDPOINT = "http://localhost:3000/api/pp";
</script>
<script src="http://localhost:3000/pixelpulse.js"></script>
```

### Optional: Mark Semantic Elements

Add `data-pp` attribute to elements you want to track:

```html
<button data-pp>Click Me</button>
```

## Architecture

- **Snippet** (`public/pixelpulse.js`) - Lightweight browser tracker (~5-10 KB)
- **API** (`app/api/pp/route.ts`) - Event ingestion endpoint
- **Database** (Supabase/PostgreSQL) - Event storage
- **Insight Engine** (`lib/insights.ts`) - Computes actionable insights
- **Dashboard** (`app/page.tsx`) - React dashboard UI

## Event Types

- `click` - Semantic clicks on buttons, links, etc.
- `rage` - Rage clicks (≥4 clicks within 700ms)
- `depth` - Scroll depth milestones (50%, 75%, 100%)
- `drop` - Form field drop-offs
- `jserr` - JavaScript errors
- `broken_flow` - Unresponsive UI elements
- `slow` - Performance issues (long tasks, slow requests)

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Custom Domain

Update `PIXELPULSE_ENDPOINT` in the snippet to point to your domain.

## License

MIT

