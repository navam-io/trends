import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { router } from '@/server/trpc';
import { trendsRouter } from '@/features/trends/server/router';
import { needsRouter } from '@/features/needs/server/router';
import { solutionsRouter } from '@/features/solutions/server/router';
import { marketIntelligenceRouter } from '@/intelligence/server/market-intelligence-router';

const appRouter = router({
  trends: trendsRouter,
  needs: needsRouter,
  solutions: solutionsRouter,
  intelligence: marketIntelligenceRouter,
});

export type AppRouter = typeof appRouter;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };