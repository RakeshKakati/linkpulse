# PixelPulse Quick Start

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create the tables and indexes
5. Go to Settings → API to get your:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Service Role Key (SUPABASE_SERVICE_KEY) - **Keep this secret!**

## 3. Configure Environment

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## 4. Run Development Server

```bash
npm run dev
```

Visit:
- **Dashboard**: http://localhost:3000
- **Install Page**: http://localhost:3000/install
- **Test Page**: http://localhost:3000/test

## 5. Add PixelPulse to Your Site

### Option A: Copy from Install Page

1. Visit http://localhost:3000/install
2. Copy the snippet
3. Paste it before `</body>` in your HTML

### Option B: Manual Installation

```html
<script>
  window.PIXELPULSE_ENDPOINT = "http://localhost:3000/api/pp";
</script>
<script src="http://localhost:3000/pixelpulse.js"></script>
```

## 6. Test It

1. Visit http://localhost:3000/test
2. Click buttons, scroll, fill forms
3. Check http://localhost:3000 to see events appear

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Update Snippet for Production

Change the endpoint in your snippet:

```html
<script>
  window.PIXELPULSE_ENDPOINT = "https://your-domain.com/api/pp";
</script>
<script src="https://your-domain.com/pixelpulse.js"></script>
```

## What Gets Tracked

- ✅ Semantic clicks (buttons, links, CTAs)
- ✅ Rage clicks (frustrated users)
- ✅ Scroll depth (50%, 75%, 100%)
- ✅ Form drop-offs
- ✅ Broken UI flows
- ✅ JavaScript errors
- ✅ Performance issues

All in ~5-10 KB. No bloat.

