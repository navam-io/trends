# Development Guidelines & Workflows
## Code Quality, Testing, and Feature Development Patterns

### Code Style & Standards

#### TypeScript
- **ALWAYS** use strict mode - no `any` types
- **PREFER** type inference over explicit types when obvious
- **USE** Zod schemas for all API inputs and form validation
- **EXPORT** only what's needed from feature modules

#### Imports
- **USE** absolute imports from `@/` for cross-feature imports
- **USE** relative imports within features
- **NEVER** import directly from another feature's internals
- **ALWAYS** import from feature's index.ts barrel export

```typescript
// Good
import { Button } from '@/lib/ui'
import { useEvents } from '@/lib/events'

// Bad  
import { TrendCard } from '@/features/trends/components/TrendCard'

// Good
import { TrendCard } from '@/features/trends'
```

#### React Components
- **USE** function components with TypeScript
- **PREFER** single responsibility - one component, one job
- **USE** CVA for variant styling
- **AVOID** inline styles - use Tailwind classes
- **NO COMMENTS** unless explicitly requested

### Feature Development Workflow

#### 1. Feature Creation
```bash
npm run feature:new [name]  # Create new feature from template
```

#### 2. Development Process
1. **ALWAYS** create feature behind flag (0% rollout)
2. **START** with tRPC router to define API contract
3. **BUILD** minimal UI to test core interaction
4. **SHIP** to preview URL for testing
5. **ITERATE** based on user feedback same day

#### 3. Before Committing
- **RUN** `npm run lint` and fix all errors
- **RUN** `npm run typecheck` and fix all errors
- **TEST** feature in isolation at preview URL
- **CHECK** no direct dependencies on other features

### Testing Strategy

#### What to Test
- **CRITICAL** user paths only
- **API** contracts with integration tests
- **AI** prompts with snapshot tests

#### What NOT to Test
- UI implementation details
- Styling/layout
- Third-party integrations (mock them)

#### Testing Commands
```bash
npm run test:feature       # Test specific feature slice
npm run test              # Run all tests
npm run test:watch        # Watch mode for development
```

### Error Handling Rules

#### API Key Management
- **ALWAYS** check for API keys in project `.env.local` first, then user environment variables
- **NEVER** use hardcoded fallback data when API keys are missing
- **THROW** clear, actionable errors when API services are unavailable

#### Fallback Strategy
- **NEVER** create mock or hardcoded fallback responses
- **ALWAYS** surface actual errors to users with clear instructions
- **PROVIDE** actionable error messages (e.g., "Set ANTHROPIC_API_KEY in .env.local or environment")
- **FAIL FAST** - let users know exactly what needs to be configured

#### Error Messages
- Include timestamp and context in error messages
- Provide copy functionality for easy error reporting
- Show clear next steps for resolution

### AI Integration Guidelines

#### Caching Strategy
- **CACHE** all AI responses in Vercel KV
- **USE** streaming for long-running AI operations
- **PROVIDE** loading states with progress indicators
- **HANDLE** rate limits gracefully with backoff

#### Prompt Engineering
```typescript
// Always include confidence scoring
const prompt = `
Analyze this trend for enterprise impact:
- Business implications
- Technical requirements  
- Implementation timeline
- Risk factors
Keep response under 200 words.
Include confidence score (0-1).
`;
```

### Performance Guidelines

#### Speed Targets
- Page load: < 3 seconds
- API response: < 500ms
- AI operations: < 10 seconds with streaming

#### Optimization Rules
- **LAZY LOAD** features not on critical path
- **PREFETCH** next likely user action
- **CACHE** expensive computations
- **DEBOUNCE** user inputs

### Common Patterns

#### Loading States
```typescript
// Always show loading for async operations
if (isLoading) return <Skeleton />
if (error) return <ErrorBoundary error={error} />
return <Content data={data} />
```

#### Error Handling
```typescript
// Wrap all async operations
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  captureException(error) // Send to Sentry
  return { success: false, error: error.message }
}
```

#### Feature Flags
```typescript
// Check flag before rendering
if (!flags.trends.enabled) return null
return <TrendsDashboard />
```

### Deployment Strategy

#### Progressive Rollout Pattern
```typescript
// Progressive rollout percentages
Day 1: 0% (team only)
Day 2: 5% (early adopters)  
Day 3: 25% (if metrics good)
Day 4: 50% (if stable)
Day 5: 100% (full rollout)
```

#### Rollback Procedure
1. Set feature flag to 0%
2. Investigate issue
3. Fix and test on preview
4. Resume rollout

### Quality Gates

#### Before Merge
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with zero warnings
- [ ] Feature works in isolation
- [ ] No breaking changes to other features
- [ ] Preview deployment successful

#### Before Production
- [ ] Feature flag configured
- [ ] Monitoring alerts configured
- [ ] Error tracking enabled
- [ ] Performance metrics tracked
- [ ] Rollback plan documented

### Debug & Troubleshooting

#### Common Issues
1. **Feature not showing**: Check feature flag in PostHog
2. **Type errors**: Run `npm run typecheck`
3. **API failing**: Check tRPC error in Network tab
4. **Events not firing**: Check event log in browser console

#### Useful Commands
```bash
# View real-time logs
vercel logs --follow

# Check dependencies
npm ls

# Reset local state
rm -rf .next && npm run dev

# Clear cache
npx next telemetry disable
```

### Development Environment

#### Required Environment Variables
```bash
# Database
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI
ANTHROPIC_API_KEY=

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

#### Development URLs
- Local: http://localhost:3001
- Preview: `[branch-name].trends.vercel.app`
- Production: https://trends.com