# Logdash Monorepo

Logdash is an open-source, developer-friendly observability platform designed for side projects and weekend builds. This monorepo contains the full codebase, including the frontend, backend, and shared packages.

> 🧪 Metrics, logging and monitoring — all in one place.

---

## 🌍 Project Structure

```
logdash/
├── apps/
│   ├── frontend/     # SvelteKit app (UI & BFF)
│   └── backend/      # NestJS API (logs, metrics, auth)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json
└── LICENSE
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Run frontend and backend

```bash
pnpm --filter frontend dev
pnpm --filter backend start:dev
```

### 3. Build all packages

```bash
pnpm run build
```

---

## 📦 Technologies

- **Frontend:** [SvelteKit](https://kit.svelte.dev) + [Tailwind CSS](https://tailwindcss.com)
- **Backend:** [NestJS](https://nestjs.com)
- **Database:** [MongoDB](https://www.mongodb.com) + [Redis](https://redis.io)
- **Monorepo:** pnpm workspaces
- **Type safety:** TypeScript with shared types (maybe one day)

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE) for details.

---

## 🤝 Contributing

We welcome PRs and suggestions! If you’d like to get involved:

1. Fork this repo
2. Create a new branch
3. Submit a pull request with clear description

---

## 💬 Contact

Questions? Ideas? Feedback?  
Join our [Discord](https://discord.gg/naftPW4Hxe) or open an issue. Let's build Logdash together 💡
