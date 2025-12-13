<script lang="ts">
  import {
    ZapIcon,
    LayoutDashboardIcon,
    BellIcon,
    ShieldCheckIcon,
    SearchIcon,
    AlertTriangleIcon,
    WrenchIcon,
    ClockIcon,
  } from 'lucide-svelte';
</script>

<section id="logdash-difference" class="container mx-auto px-4">
  <div class="mb-12 text-center">
    <h2 class="mb-2 text-3xl font-bold md:text-4xl">The Logdash difference</h2>
    <p class="mx-auto max-w-3xl text-xl opacity-80">
      Compare doing this yourself vs. having Logdash handle it.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
    <!-- Logdash Side -->
    <div
      class="ld-card-base text-base-content relative overflow-hidden rounded-3xl border p-8"
    >
      <div class="mb-6">
        <h3 class="flex items-center gap-2 text-2xl font-bold">
          Shipping with <span
            class="bg-primary text-primary-content rounded px-2 py-1 text-lg"
          >
            Logdash
          </span>
        </h3>
      </div>

      <ul class="space-y-6">
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <ZapIcon class="text-primary h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">You (5 min setup):</span>
            <span class="opacity-80">
              Install the SDK, add a few lines of code, and you're collecting
              data instantly.
            </span>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <LayoutDashboardIcon class="text-primary h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">Unified Dashboard:</span>
            <span class="opacity-80">
              Logs, metrics, and uptime in one view. No jumping between AWS,
              Vercel, and other tools.
            </span>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <BellIcon class="text-primary h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">Intelligent Alerts:</span>
            <span class="opacity-80">
              Get notified on Telegram/Discord only when it matters. No alert
              fatigue.
            </span>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <ShieldCheckIcon class="text-primary h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">Peace of Mind:</span>
            <span class="opacity-80">
              Focus on shipping features. We watch your back.
            </span>
          </div>
        </li>
      </ul>

      <div class="border-primary/20 mt-8 border-t pt-6">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-lg font-bold">Result:</span>
          <span
            class="bg-primary text-primary-content rounded px-3 py-1 font-bold"
          >
            5 min setup
          </span>
          <span class="font-semibold">then full clarity</span>
        </div>
      </div>
    </div>

    <!-- On Your Own Side -->
    <div
      class="bg-error/10 border-error/20 relative overflow-hidden rounded-3xl border p-8"
    >
      <div class="mb-6">
        <h3 class="flex items-center gap-2 text-2xl font-bold">
          Shipping <span
            class="bg-error text-error-content rounded px-2 py-1 text-lg"
          >
            on your own
          </span>
        </h3>
      </div>

      <ul class="space-y-6">
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <SearchIcon class="text-error h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">You (Manual Config):</span>
            <span class="opacity-80">
              Spend days setting up Prometheus, Grafana, or configuring
              dispersed cloud logs.
            </span>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <AlertTriangleIcon class="text-error h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">Fragmented Data:</span>
            <span class="opacity-80">
              Manually correlating timestamps across Vercel logs and database
              metrics.
            </span>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <WrenchIcon class="text-error h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">Maintenance:</span>
            <span class="opacity-80">
              Managing self-hosted instances, updates, and storage costs.
            </span>
          </div>
        </li>
        <li class="flex gap-4">
          <div class="mt-1 shrink-0">
            <ClockIcon class="text-error h-6 w-6" />
          </div>
          <div>
            <span class="font-bold">Constant Worry:</span>
            <span class="opacity-80">
              Manually checking "is the app down?" every few hours.
            </span>
          </div>
        </li>
      </ul>

      <div class="border-error/20 mt-8 border-t pt-6">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-lg font-bold">Result:</span>
          <span class="bg-error text-error-content rounded px-3 py-1 font-bold">
            Hours wasted
          </span>
          <span class="font-semibold">with burnout risk</span>
        </div>
      </div>
    </div>
  </div>
</section>
