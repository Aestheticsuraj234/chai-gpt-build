This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Database Setup (Chat Branching)
The chat branching feature stores messages in a tree structure using PostgreSQL. To initialize the local database:

1. Make sure you have Docker installed.
2. Start the Postgres container:
   ```bash
   docker compose up -d
   ```
3. Push the Prisma schema to the database and generate the client:
   ```bash
   bunx prisma db push
   bunx prisma generate
   ```

### 2. Environment Variables (AI Tools)
You need to set up the appropriate environment variables for the AI Tools (like Web Search) to function properly.

1. Create a `.env.local` file in the root of the project.
2. Add your Tavily API key for the web search tool, and your local Database URL:
   ```env
   TAVILY_API_KEY=your_tavily_api_key_here
   DATABASE_URL=postgresql://myuser:mypassword@localhost:5433/mydb?schema=public
   ```

### 3. Run the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
