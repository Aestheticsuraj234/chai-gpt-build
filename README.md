# Chai GPT Build

A production-ready AI chat application built with Next.js and Clerk authentication.

## Project Overview

This project is a conversational AI workspace that supports:
- authenticated user sessions with Clerk
- chat conversations saved in Prisma/PostgreSQL
- chat branching and history tracking
- web search augmentation for smarter responses
- mobile-first responsive UI for authentication and chat flows

## Features

- **Conversation branching**: create alternate response paths from any assistant reply.
- **Branch switching**: navigate between branches and continue the chat from any branch point.
- **Web search tool**: fetch up-to-date search results to enrich AI responses.
- **Authenticated chat**: Clerk sign-in and session persistence.
- **Responsive auth screen**: mobile-friendly Clerk provider layout and centered sign-in flow.
- **AI chat shell**: scrollable chat messages with fixed header and composer.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Bun** for local development and build
- **Prisma 7** with PostgreSQL
- **Clerk** for authentication
- **TanStack Query** for client data fetching
- **Vercel AI SDK** for streaming chat generation
- **Tailwind / shadcn UI** for styling and components

## Getting Started

Install dependencies and run the development server:

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

This project uses environment variables for auth and database configuration. Do not expose or commit any API keys.

Example `.env` values should include:
- `DATABASE_URL`
- `CLERK_FRONTEND_API`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Authentication

The sign-in screen lives under `app/(auth)/sign-in` and uses Clerk's `<SignIn>` component. The layout is optimized for mobile responsiveness and modern auth UX.

## Branching and Conversation Flow

Branching is implemented so users can:
- create a new branch from an assistant response
- preserve the original conversation path
- continue the chat from any branch endpoint

This enables explorative dialogue and alternate answer tracking.

## Web Search Tool

Web search is available as a tool in the chat experience to provide context-aware, current information alongside AI responses.

## Project Link

Share this project with your users at: **[\[PROJECT LINK\]](https://chai-gpt-build-rho.vercel.app/)**

Replace `PROJECT LINK` with the public URL you want to share.

## Build

```bash
bun run build
```

## Notes

- No API keys are included in this repository.
- Keep secrets in environment variables only.
