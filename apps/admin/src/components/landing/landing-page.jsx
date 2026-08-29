import Link from "next/link";
import {
  ArrowRightIcon,
  BookUserIcon,
  ClockIcon,
  CloudOffIcon,
  LayoutGridIcon,
  LockKeyholeIcon,
  MonitorSmartphoneIcon,
  PackageIcon,
  ReceiptTextIcon,
  SmartphoneIcon,
  TrendingUpIcon,
} from "lucide-react";

import { POS_URL } from "@/lib/pos-app";
import { Button } from "@/components/ui/button";

// Everything on this page is something the product actually does today.
// No "coming soon" features dressed up as shipped ones — a landing page
// that oversells is a support ticket with extra steps.

const FEATURES = [
  {
    icon: CloudOffIcon,
    title: "Sells with no internet",
    body: "Orders are written to the till itself first, then pushed up when the connection comes back. A dead router costs you nothing — nobody stands around waiting for a spinner.",
  },
  {
    icon: ClockIcon,
    title: "Shifts and a counted drawer",
    body: "Staff open a shift with their PIN and count the cash at the end. The till works out what should be there, shows what's over or short, and locks the record so nobody can quietly edit it after the fact.",
  },
  {
    icon: BookUserIcon,
    title: "Open tabs for regulars",
    body: "The customers you trust can eat now and pay later. Their orders sit on a tab, and a tab only counts as a sale on the day it's actually settled — so your daily takings mean what they say.",
  },
  {
    icon: PackageIcon,
    title: "Stock you can trust",
    body: "Count what's worth counting. Items running low are flagged on the till before the cashier promises something you don't have.",
  },
  {
    icon: TrendingUpIcon,
    title: "Sales you can read",
    body: "Takings by day, by item, by category, by person. Real gross profit from what things cost you — not just what came through the door.",
  },
  {
    icon: ReceiptTextIcon,
    title: "Receipts and end-of-day",
    body: "Print a bill before payment, a receipt after, and a full end-of-day report when you close up. Every sale traces back to the shift and the person who rang it.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set up your menu",
    body: "Add items, categories, prices, photos and options like sizes. Say what's worth tracking stock on and what isn't.",
  },
  {
    n: "02",
    title: "Open the till",
    body: "Install the POS on any laptop, tablet or terminal with a browser. Sign in once — after that your staff only ever use a PIN.",
  },
  {
    n: "03",
    title: "Sell and close out",
    body: "Take orders all day, log the odd expense, then count the drawer and end the day. The back office already has the numbers.",
  },
];

const FAQS = [
  {
    q: "What happens when the internet goes down?",
    a: "The till keeps selling. Orders save on the device and upload themselves once you're back online — you don't have to remember to do anything, and nothing is lost if the browser closes in between.",
  },
  {
    q: "Do I need to buy special hardware?",
    a: "No. It runs in a browser on whatever you already have — a laptop, a tablet, a cheap Windows terminal. Printing goes through the normal print dialog, so any printer that machine can already use works.",
  },
  {
    q: "Can my staff see my sales figures?",
    a: "No. The till is for selling: staff see their own shift's tickets and the tabs they need to serve people. Reports, costs, profit and settings all live in the back office, behind your own login.",
  },
  {
    q: "How do staff sign in?",
    a: "With a PIN you set for them. The device is signed in once with your email and password when you first set it up, and never again — so nobody needs your password to open the shop.",
  },
  {
    q: "What if the cash doesn't add up?",
    a: "You'll know at close, not next month. The till compares what should be in the drawer against what was counted and records the difference against that shift and that person.",
  },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="size-9 rounded-xl" />
      <span className="text-lg font-semibold tracking-tight">Lenzro</span>
    </span>
  );
}

export function LandingPage({ signedIn }) {
  const primaryHref = signedIn ? "/admin" : "/auth";
  const primaryLabel = signedIn ? "Go to your back office" : "Get started free";

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* ---------------------------------------------------------- nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#download" className="transition-colors hover:text-foreground">
              Get the till
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              Questions
            </a>
          </div>
          <div className="flex items-center gap-2">
            {!signedIn && (
              <Button variant="ghost" className="hidden sm:inline-flex" render={<Link href="/auth" />}>
                Sign in
              </Button>
            )}
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-600/90"
              render={<Link href={primaryHref} />}
            >
              {signedIn ? "Back office" : "Get started"}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* -------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        {/* Soft emerald wash behind the headline, kept subtle so the
            screenshot below stays the thing you look at. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.16),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 sm:text-sm">
              <CloudOffIcon className="size-3.5" />
              Built to keep working when the internet doesn&apos;t
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              The till that doesn&apos;t stop
              <span className="text-emerald-500"> when the internet does</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
              Lenzro is a point of sale for Kenyan restaurants, cafés and shops. Take orders,
              run shifts, keep tabs for your regulars and see exactly what you made today — from
              the counter or from your phone.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full gap-2 bg-emerald-600 px-6 text-base hover:bg-emerald-600/90 sm:w-auto"
                render={<Link href={primaryHref} />}
              >
                {primaryLabel}
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full px-6 text-base sm:w-auto"
                render={<a href="#download" />}
              >
                Get the till
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              No card needed. No hardware to buy.
            </p>
          </div>

          {/* A real screenshot of the real back office, in a window frame
              so it reads as the product rather than as decoration. */}
          <div className="mt-14 sm:mt-20">
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl shadow-emerald-950/30 sm:rounded-2xl">
              <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/40 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-emerald-400/70" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard.png"
                alt="The Lenzro back office showing today's gross sales, refunds, discounts, net sales and gross profit"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- two surfaces */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-500">
              <MonitorSmartphoneIcon className="size-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">The till</h3>
            <p className="mt-2 text-muted-foreground">
              Big buttons, made for a touchscreen and a queue. Staff sign in with a PIN, ring up
              orders, take payment however your customer wants to pay, and print. Works offline,
              installs like an app.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-500">
              <LayoutGridIcon className="size-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">The back office</h3>
            <p className="mt-2 text-muted-foreground">
              Your menu, your stock, your staff and their PINs, your discounts and payment types
              — and the reports that tell you whether today was actually a good day. Open it from
              anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- features */}
      <section id="features" className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything a small shop actually needs
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Not a stripped-down demo, and not a hundred features you&apos;ll never touch.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-emerald-600/40"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-500">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ tabs */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-400">
              <BookUserIcon className="size-3.5" />
              Open tabs
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              For the regulars you let pay later
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Every shop has them — the neighbours, the office next door, the friend who settles
              up on payday. Lenzro tracks what they took, what they&apos;ve paid and what&apos;s
              still owed, with every order on the tab readable as a full receipt.
            </p>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              {[
                "A tab order only counts as a sale on the day it's paid off — so your daily takings aren't inflated by money you haven't seen.",
                "They can clear one specific receipt, or hand over a lump sum that pays off the oldest orders first.",
                "Whoever took the payment is recorded against it, cashier or owner.",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Deliberately not a screenshot: the only real one is the back
              office shot in the hero, and a stock illustration here would
              be decoration pretending to be product. */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <p className="text-sm text-muted-foreground">A tab at a glance</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { label: "Taken", value: "KSh 4,850" },
                { label: "Paid", value: "KSh 3,000" },
                { label: "Owed", value: "KSh 1,850", accent: true },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p
                    className={`mt-1 text-lg font-semibold sm:text-xl ${stat.accent ? "text-emerald-500" : ""}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              {[
                { when: "Tue, 3:40 pm", what: "2 chai, 1 mandazi", amount: "KSh 350" },
                { when: "Wed, 1:12 pm", what: "Lunch × 2", amount: "KSh 900" },
                { when: "Fri, 6:05 pm", what: "Soda × 4", amount: "KSh 600" },
              ].map((row) => (
                <div key={row.when} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0">
                    <span className="text-muted-foreground">{row.when} · </span>
                    {row.what}
                  </span>
                  <span className="shrink-0 font-medium">{row.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ get the till */}
      {/* The POS is a separate deployment, so its URL comes from the
          environment rather than being hardcoded. With it unset the
          section still explains the install, it just doesn't offer a
          dead link. */}
      <section id="download" className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-400">
                <MonitorSmartphoneIcon className="size-3.5" />
                Get the till
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Nothing to download from a store
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                The till is a web app that installs itself. Open it once on the machine at your
                counter, install it, and it opens like any other app — full screen, its own icon,
                no browser bar, and it keeps working when the internet drops.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {POS_URL ? (
                  <Button
                    size="lg"
                    className="h-12 w-full gap-2 bg-emerald-600 px-6 text-base hover:bg-emerald-600/90 sm:w-auto"
                    render={<a href={POS_URL} target="_blank" rel="noreferrer" />}
                  >
                    Open the till
                    <ArrowRightIcon className="size-4" />
                  </Button>
                ) : null}
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full px-6 text-base sm:w-auto"
                  render={<Link href={primaryHref} />}
                >
                  {signedIn ? "Back office" : "Create your account first"}
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                You&apos;ll sign in once with your owner account to link the device. After that
                it&apos;s PINs only.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <p className="text-sm font-medium text-foreground">Installing it</p>
              <ol className="mt-5 space-y-5">
                {[
                  {
                    n: "1",
                    title: "Open the till link in Chrome or Edge",
                    body: "On the laptop, tablet or terminal you'll actually sell from.",
                  },
                  {
                    n: "2",
                    title: "Install it",
                    body: "Use the install icon in the address bar, or the browser menu — “Install app” on desktop, “Add to Home Screen” on a tablet.",
                  },
                  {
                    n: "3",
                    title: "Sign in once, then activate the device",
                    body: "Give the till a name. That's the last time anyone types a password on it.",
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-sm font-semibold text-emerald-500">
                      {step.n}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- how it works */}
      <section id="how" className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Selling by this afternoon
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Three steps, and none of them involve a technician.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <span className="font-mono text-3xl font-semibold text-emerald-600/40">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <SmartphoneIcon className="size-4 text-emerald-500" />
              Installs from the browser
            </span>
            <span className="flex items-center gap-2">
              <LockKeyholeIcon className="size-4 text-emerald-500" />
              Your data stays yours
            </span>
            <span className="flex items-center gap-2">
              <CloudOffIcon className="size-4 text-emerald-500" />
              Keeps selling offline
            </span>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- faq */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Questions people actually ask
        </h2>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {faq.q}
                <span className="shrink-0 text-emerald-500 transition-transform group-open:rotate-45">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- cta */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-600/30 bg-emerald-600/10 px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.18),transparent_70%)]"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Set it up today, sell on it tomorrow
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Bring your menu, your staff and whatever machine you already have at the counter.
            </p>
            <Button
              size="lg"
              className="mt-8 h-12 gap-2 bg-emerald-600 px-8 text-base hover:bg-emerald-600/90"
              render={<Link href={primaryHref} />}
            >
              {primaryLabel}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lenzro POS · Built in Kenya
          </p>
        </div>
      </footer>
    </div>
  );
}
