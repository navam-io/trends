# Trends Development Guidelines

## Project Context
Trends is an AI engineering advisory platform built with **feature-slice architecture** for rapid solo development. Each feature is a complete vertical slice that can be shipped independently.

**Current Status**: Pre-MVP foundation phase
**Target**: Ship one feature per week with real user feedback
**Philosophy**: Vibe coding - ship fast, learn faster, revenue over features

## Core Commands

### Development
```bash
npm run dev                 # Start development server
npm run build              # Build for production
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript compiler check
npm run test:feature       # Test specific feature slice
```

### Feature Management
```bash
npm run feature:new [name]  # Create new feature from template
npm run feature:toggle [name] # Toggle feature flag
npm run feature:deploy [name] # Deploy single feature
```

### Database
```bash
npx supabase db push       # Push schema changes
npx supabase db reset      # Reset database
npx supabase functions deploy # Deploy edge functions
```

## Code Style

### TypeScript
- **ALWAYS** use strict mode - no `any` types
- **PREFER** type inference over explicit types when obvious
- **USE** Zod schemas for all API inputs and form validation
- **EXPORT** only what's needed from feature modules

### Imports
- **USE** absolute imports from `@/` for cross-feature imports
- **USE** relative imports within features
- **NEVER** import directly from another feature's internals
- **ALWAYS** import from feature's index.ts barrel export

Example:
```typescript
// Good
import { Button } from '@/packages/ui'
import { useEvents } from '@/lib/events'

// Bad  
import { TrendCard } from '@/features/trends/components/TrendCard'

// Good
import { TrendCard } from '@/features/trends'
```

### React Components
- **USE** function components with TypeScript
- **PREFER** single responsibility - one component, one job
- **USE** CVA for variant styling
- **AVOID** inline styles - use Tailwind classes

### Feature Structure
Each feature MUST follow this structure:
```
/features/[feature-name]/
  /components/       # UI components
  /server/          # tRPC routers
  /stores/          # Zustand stores  
  /hooks/           # Custom React hooks
  /types/           # TypeScript types
  /utils/           # Helper functions
  index.ts          # Public API exports
```

## Workflow

### Adding New Features
1. **ALWAYS** create feature behind flag (0% rollout)
2. **START** with tRPC router to define API contract
3. **BUILD** minimal UI to test core interaction
4. **SHIP** to preview URL for testing
5. **ITERATE** based on user feedback same day

### Before Committing
- **RUN** `npm run lint` and fix all errors
- **RUN** `npm run typecheck` and fix all errors
- **TEST** feature in isolation at preview URL
- **CHECK** no direct dependencies on other features

### Event Communication
Features MUST communicate via events, not direct calls:
```typescript
// Publish event
events.emit('trend.analyzed', { trendId, analysis })

// Subscribe to event
events.on('trend.analyzed', async (data) => {
  // React to event
})
```

### AI Integration
- **CACHE** all AI responses in Vercel KV
- **USE** streaming for long-running AI operations
- **PROVIDE** loading states with progress indicators
- **HANDLE** rate limits gracefully with backoff

## Architecture Rules

### Feature Independence
**IMPORTANT**: Features must be deletable without breaking others
- No compile-time dependencies between features
- All communication via events
- Shared code only in `/lib` or `/packages`

### Database Schema
- Each feature owns its database tables
- Prefix tables with feature name: `trends_*`, `needs_*`
- Foreign keys only to platform tables (users, events)

### API Design
- Each feature has ONE tRPC router in `/features/[name]/server/`
- Server-side tRPC setup in `/server/trpc.ts`
- Client-side tRPC setup in `/lib/trpc/client.tsx`
- **NEVER** import server tRPC code into client components
- Procedures follow pattern: `[action][Entity]`
- Always validate with Zod schemas
- Return consistent error shapes

### State Management
- Each feature has isolated Zustand store
- No global state except user session
- Persist only essential data

## Performance Guidelines

### Speed Targets
- Page load: < 3 seconds
- API response: < 500ms
- AI operations: < 10 seconds with streaming

### Optimization Rules
- **LAZY LOAD** features not on critical path
- **PREFETCH** next likely user action
- **CACHE** expensive computations
- **DEBOUNCE** user inputs

## Testing Approach

### What to Test
- **CRITICAL** user paths only
- **API** contracts with integration tests
- **AI** prompts with snapshot tests

### What NOT to Test
- UI implementation details
- Styling/layout
- Third-party integrations (mock them)

## Deployment

### Preview Deployments
Every push creates preview at: `[branch-name].trends.vercel.app`

### Feature Rollout
```typescript
// Progressive rollout percentages
Day 1: 0% (team only)
Day 2: 5% (early adopters)  
Day 3: 25% (if metrics good)
Day 4: 50% (if stable)
Day 5: 100% (full rollout)
```

### Rollback Procedure
1. Set feature flag to 0%
2. Investigate issue
3. Fix and test on preview
4. Resume rollout

## Common Patterns

### Loading States
```typescript
// Always show loading for async operations
if (isLoading) return <Skeleton />
if (error) return <ErrorBoundary error={error} />
return <Content data={data} />
```

### Error Handling
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

### Feature Flags
```typescript
// Check flag before rendering
if (!flags.trends.enabled) return null
return <TrendsDashboard />
```

## Environment Variables

Required in `.env.local`:
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

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true
```

### Anthropic API Key Configuration

The system uses `ANTHROPIC_API_KEY` from:
1. `.env.local` file (project-specific) - preferred for development
2. User environment variables (global) - preferred for production/deployment

To set a user environment variable:
```bash
# macOS/Linux
export ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key

# Windows
set ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
```

## Debugging Tips

### Common Issues
1. **Feature not showing**: Check feature flag in PostHog
2. **Type errors**: Run `npm run typecheck`
3. **API failing**: Check tRPC error in Network tab
4. **Events not firing**: Check event log in Supabase

### Useful Commands
```bash
# View real-time logs
vercel logs --follow

# Check feature flags
curl https://api.posthog.com/flags

# Reset local database
npx supabase db reset

# Clear cache
rm -rf .next
```

## AI Prompts Library

### Trend Analysis
```
Analyze this trend for enterprise impact:
- Business implications
- Technical requirements  
- Implementation timeline
- Risk factors
Keep response under 200 words.
```

### Need Generation
```
Based on this trend and company context, identify 3 specific needs:
- Each need should be actionable
- Include stakeholder impact
- Estimate complexity (low/medium/high)
Format as JSON array.
```

### Solution Matching
```
Match this need to solution patterns:
- Consider build vs buy vs partner
- Estimate implementation effort
- Calculate rough ROI
Return top 3 matches with confidence scores.
```

## IMPORTANT Reminders

- **NEVER** commit API keys or secrets
- **ALWAYS** test on preview before merging
- **PREFER** shipping broken over not shipping
- **FOCUS** on user value, not code perfection
- **MEASURE** everything - usage, errors, performance
- **TALK** to users daily - their feedback drives development

## Error Handling Rules

### API Key Management
- **ALWAYS** check for API keys in project `.env.local` first, then user environment variables
- **NEVER** use hardcoded fallback data when API keys are missing
- **THROW** clear, actionable errors when API services are unavailable

### Fallback Strategy
- **NEVER** create mock or hardcoded fallback responses
- **ALWAYS** surface actual errors to users with clear instructions
- **PROVIDE** actionable error messages (e.g., "Set ANTHROPIC_API_KEY in .env.local or environment")
- **FAIL FAST** - let users know exactly what needs to be configured

### Error Messages
- Include timestamp and context in error messages
- Provide copy functionality for easy error reporting
- Show clear next steps for resolution

## Context Engineering & Specs Usage

### Efficient Specs File Usage

The `.claude/specs/` directory is organized for optimal context engineering and code generation quality. Use these files strategically:

#### **1. Architecture & System Design**
📁 **Use `.claude/specs/core.md`** (127 lines) for:
- System architecture decisions and tech stack
- Feature-slice architecture patterns
- Event-driven communication
- Data flow and performance requirements
- Security and compliance standards

#### **2. Development Standards & Workflow**
📁 **Use `.claude/specs/development.md`** (238 lines) for:
- TypeScript and React coding standards
- Error handling rules and patterns
- Testing strategy and quality gates
- Deployment and rollback procedures
- Performance optimization guidelines

#### **3. Feature Requirements & Specifications**  
📁 **Use `.claude/specs/features.md`** (200 lines) for:
- Current feature specifications and status
- User requirements and success metrics
- Feature flag configuration
- Integration requirements
- Performance targets

#### **4. AI Integration & Intelligence System**
📁 **Use `.claude/specs/ai-system.md`** (314 lines) for:
- Multi-agent system architecture
- GPT-4o integration patterns
- Chain-of-thought reasoning implementation
- Data quality and validation
- AI performance monitoring

#### **5. UI Implementation & Design System**
📁 **Use `.claude/specs/ui-patterns.md`** (415 lines) for:
- Component library standards
- Layout and responsive design patterns
- Accessibility requirements
- AI-specific UI components
- Performance optimization for UI

#### **6. Product Vision & Strategy**
📁 **Use `.claude/specs/vision.md`** (161 lines) for:
- Product philosophy and target users
- Long-term strategic direction
- Market positioning

### Context Selection Strategy

**For Feature Development Tasks:**
1. **Start with** `features.md` to understand requirements
2. **Reference** `core.md` for architectural patterns
3. **Follow** `development.md` for implementation standards
4. **Integrate** `ai-system.md` for AI functionality
5. **Apply** `ui-patterns.md` for user interface

**For Architecture Questions:**
- Primary: `core.md`
- Secondary: `ai-system.md` (for AI architecture)

**For Code Quality Issues:**
- Primary: `development.md`
- Secondary: `core.md` (for architectural context)

**For UI/UX Implementation:**
- Primary: `ui-patterns.md`
- Secondary: `features.md` (for feature requirements)

**For AI Integration:**
- Primary: `ai-system.md`
- Secondary: `development.md` (for integration patterns)

### File Size Guidelines

All specs files are optimized for efficient LLM context:
- **Target range**: 200-400 lines per file
- **Maximum size**: 415 lines (largest file)
- **Total size**: 1,469 lines across 6 files
- **Benefit**: Fast loading, focused context, no redundancy

### Update Patterns

**When adding new features:**
1. Update `features.md` with requirements
2. Reference existing patterns in other specs
3. Update relevant specs if new patterns emerge

**When changing architecture:**
1. Update `core.md` with new patterns
2. Update `development.md` if workflow changes
3. Update `ai-system.md` if AI patterns change

**When improving UI:**
1. Update `ui-patterns.md` with new components
2. Ensure consistency with `features.md` requirements

### Slash Commands Integration

The `/feature` command automatically references appropriate specs:
- Analyzes requirements from `features.md`
- Applies architecture from `core.md`
- Follows standards from `development.md`
- Integrates AI from `ai-system.md`
- Implements UI from `ui-patterns.md`

## Questions or Issues?
- Check appropriate `.claude/specs/` file using guidelines above
- Review recent commits for patterns
- When in doubt, ship and iterate

---
*Last updated: Today*
*Version: 1.0*