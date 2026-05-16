# ResumeForge — Deploy Instructions

A Next.js app: AI resume optimizer + cover letter generator + LinkedIn rewriter.
Auth via Supabase. Payments via Stripe.

## 🚀 Deploy to Vercel (Recommended)

### 1. Push to GitHub

1. Go to github.com → New repository → name it `resumeforge` → Private → Create
2. Click "uploading an existing file"
3. Drag ALL files from this folder into the upload area → Commit changes

### 2. Connect to Vercel

1. Go to vercel.com → Sign up with GitHub
2. Add New → Project → find `resumeforge` → Import
3. **Before clicking Deploy**, scroll to Environment Variables and add ALL of these:

| Name | Value | Where to find |
|------|-------|---------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | console.anthropic.com → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API → "service_role" ⚠️ secret |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe → Developers → API keys |
| `STRIPE_PRICE_ID` | `price_...` | Stripe → Products → ResumeForge Pro → click price |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Webhooks → click your endpoint → reveal signing secret |

4. Click **Deploy**. Wait ~2 minutes.
5. You'll get a URL like `resumeforge-abc.vercel.app` — it's live!

### 3. Wire up Stripe webhook (after first deploy)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://YOUR-DOMAIN.vercel.app/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the signing secret → paste into Vercel env var `STRIPE_WEBHOOK_SECRET`
5. Redeploy (Vercel → Deployments → ⋯ → Redeploy)

### 4. Database setup (Supabase)

Run this in Supabase SQL Editor (Day 2 Step 2 — already done if you followed earlier instructions):

```sql
create table profiles (
  id uuid references auth.users primary key,
  email text,
  is_pro boolean default false,
  stripe_customer_id text,
  created_at timestamp default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

## 🧪 Test it

1. Visit your live URL
2. Click "Sign in" → create account → confirm email if required
3. Try the resume optimizer once (free)
4. Try again → see upgrade prompt → click Upgrade Now
5. Use Stripe **test card**: `4242 4242 4242 4242`, any future date, any CVC
6. After payment, you'll redirect back → become Pro automatically

## 💰 Going live

1. In Stripe: switch from Test mode to Live mode (top right toggle)
2. Get your **live** API keys and Price ID
3. Set up the webhook again in Live mode
4. Update Vercel env vars with live keys
5. Redeploy

## 🌐 Custom domain

1. Buy at namecheap.com or porkbun.com
2. Vercel → Settings → Domains → Add → follow DNS instructions

## 💻 Run locally (optional)

```bash
npm install
cp .env.example .env.local   # then fill in your real values
npm run dev
```

Visit http://localhost:3000

## 📝 What's included

- Resume optimizer with ATS score
- Cover letter generator (4 tones)
- LinkedIn headline + About rewriter
- Email/password auth (Supabase)
- Stripe subscription checkout
- Webhook handler for auto-Pro unlocking
- Server-side AI calls (API key never exposed)
- Free tier: 1 use per tool, then paywall

## 🔥 Next steps after launch

- Add Google login (Supabase → Auth → Providers → Google)
- Add PDF export for resumes
- Add "Save my resumes" history page
- Launch on Product Hunt, Reddit (r/jobs, r/resumes), LinkedIn
- Run TikTok ads showing the before/after
