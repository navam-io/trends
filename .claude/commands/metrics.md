---
description: Generate comprehensive static code analysis metrics report
---

# Metrics Analysis Command

You are a code metrics analyst. Your task is to perform comprehensive static code analysis on the Trends project and generate a detailed metrics report.

## Analysis Scope

Analyze the following aspects of the codebase:

### 1. Code Volume Metrics
- **Total Lines of Code (LOC)**: Count all lines in source files
- **Source Lines of Code (SLOC)**: Exclude blank lines and comments
- **Lines by Language**: Break down by TypeScript, JavaScript, JSON, Markdown, CSS
- **Lines by Directory**: src/, tests/, components/, lib/, app/, etc.

### 2. File and Module Metrics
- **Total Files**: Count by type (.ts, .tsx, .js, .jsx, .json, .md, .css)
- **Average File Size**: Mean lines per file
- **Largest Files**: Top 10 files by line count
- **Module Distribution**: Components vs utilities vs API routes vs types

### 3. Test Coverage Metrics
- **Test Files**: Count of test files (*.test.ts, *.spec.ts)
- **Test Lines**: Total lines in test files
- **Test-to-Code Ratio**: Test LOC / Source LOC
- **Tested Modules**: Files with corresponding test files
- **Coverage Gaps**: Source files without tests

### 4. Code Quality Metrics
- **Comment Density**: Comment lines / Total lines
- **Documentation**: JSDoc comments, inline comments, README files
- **Type Safety**: TypeScript files vs JavaScript files
- **Function Complexity**: Average function length (lines per function)
- **Import Analysis**: External dependencies vs internal imports

### 5. Architecture Metrics
- **Component Count**: React components (.tsx files)
- **Hook Count**: Custom hooks (use-*.ts files)
- **API Routes**: Number of API endpoints
- **Type Definitions**: Interface and type declarations
- **Utility Functions**: Shared utilities and helpers

### 6. Dependency Analysis
- **Package Dependencies**: Count from package.json
- **Dev Dependencies**: Development-only packages
- **Dependency Tree Depth**: Analyze node_modules structure
- **Unused Dependencies**: Potential optimization candidates

### 7. Feature Architecture Analysis (Trends-specific)
- **Feature Slices**: Count of independent features (features/ folder)
- **Intelligence Agents**: AI agents in intelligence/ folder
- **Trend Categories**: Consumer, Competition, Economy, Regulation
- **Specifications**: Documentation in .claude/specs/ folder
- **Blog Documentation**: Educational content in blog/ folder

## Implementation Steps

### Step 1: Setup Metrics Directory
```bash
mkdir -p metrics
cd /Users/manavsehgal/Developer/trends
```

### Step 2: Count Lines of Code
Use tools like `cloc` or custom bash scripts:
```bash
# Install cloc if needed
# brew install cloc (macOS)
# sudo apt-get install cloc (Linux)

# Run analysis for Trends project structure
cloc app/ --json > /tmp/cloc-app.json
cloc features/ --json > /tmp/cloc-features.json
cloc intelligence/ --json > /tmp/cloc-intelligence.json
cloc lib/ --json > /tmp/cloc-lib.json
cloc server/ --json > /tmp/cloc-server.json
cloc .claude/ --json > /tmp/cloc-claude.json
cloc blog/ --json > /tmp/cloc-blog.json
cloc . --exclude-dir=node_modules,.next,build,dist,metrics --json > /tmp/cloc-total.json
```

### Step 3: Analyze File Structure
```bash
# Count files by type
find . -name "node_modules" -prune -o -type f -name "*.ts" -print | wc -l
find . -name "node_modules" -prune -o -type f -name "*.tsx" -print | wc -l
find . -name "node_modules" -prune -o -type f -name "*.css" -print | wc -l
find . -name "node_modules" -prune -o -type f -name "*.md" -print | wc -l

# Analyze directory structure (Trends-specific)
tree -L 3 app/ > /tmp/app-structure.txt 2>/dev/null || ls -R app/ > /tmp/app-structure.txt
tree -L 3 features/ > /tmp/features-structure.txt 2>/dev/null || ls -R features/ > /tmp/features-structure.txt
tree -L 3 intelligence/ > /tmp/intelligence-structure.txt 2>/dev/null || ls -R intelligence/ > /tmp/intelligence-structure.txt
tree -L 2 lib/ > /tmp/lib-structure.txt 2>/dev/null || ls -R lib/ > /tmp/lib-structure.txt
```

### Step 4: Test Coverage Analysis
```bash
# Find test files
find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l

# Analyze test coverage (if jest is configured)
npm run test -- --coverage --json > /tmp/coverage.json 2>/dev/null || true
```

### Step 5: Code Quality Metrics
```bash
# Count comments
grep -r "^[[:space:]]*\/\/" src/ | wc -l
grep -r "^[[:space:]]*\/\*" src/ | wc -l

# Count TypeScript vs JavaScript
find src -name "*.ts" -o -name "*.tsx" | wc -l
find src -name "*.js" -o -name "*.jsx" | wc -l
```

### Step 6: Dependency Analysis
```bash
# Count dependencies
cat package.json | jq '.dependencies | length'
cat package.json | jq '.devDependencies | length'

# List all dependencies
cat package.json | jq -r '.dependencies | keys[]' | sort
```

### Step 7: Trends Feature Architecture Analysis
```bash
# Count feature slices
ls -d features/*/ 2>/dev/null | wc -l

# Count components per feature
for feature in features/*/; do
  echo "$(basename $feature): $(find $feature/components -name "*.tsx" 2>/dev/null | wc -l) components"
done

# Count intelligence agents
find intelligence/agents -type f -name "*.ts" 2>/dev/null | wc -l

# Count tRPC routers
find features -name "router.ts" 2>/dev/null | wc -l
find intelligence -name "*router.ts" 2>/dev/null | wc -l

# Count Zustand stores
find features -name "*Store.ts" -o -name "*store.ts" 2>/dev/null | wc -l

# Count specifications
find .claude/specs -name "*.md" 2>/dev/null | wc -l

# Count blog posts
find blog -name "*.md" 2>/dev/null | wc -l

# Count UI components library
find lib/ui -name "*.tsx" 2>/dev/null | wc -l

# Count custom hooks
find features -name "use-*.ts" 2>/dev/null | wc -l

# Analyze feature independence (check for cross-feature imports)
echo "Checking feature independence..."
for feature in features/*/; do
  feature_name=$(basename $feature)
  cross_imports=$(grep -r "from '@/features/" $feature 2>/dev/null | grep -v "from '@/features/$feature_name" | wc -l)
  echo "$feature_name: $cross_imports cross-feature imports (should be 0)"
done

# Count AI/LLM integration points
echo "AI Integration Analysis..."
grep -r "anthropic" lib/ features/ intelligence/ 2>/dev/null | wc -l
grep -r "streaming" features/ 2>/dev/null | grep -i "stream" | wc -l
find features -name "*generator.ts" 2>/dev/null | wc -l

# Event-driven architecture analysis
echo "Event System Analysis..."
grep "export const EVENTS" lib/events/index.ts -A 50 2>/dev/null | grep -c ":" || echo "Count events in EVENTS object"
grep -r "events.emit" features/ app/ 2>/dev/null | wc -l
grep -r "events.on" features/ app/ 2>/dev/null | wc -l

# UI component usage analysis
echo "UI Component Usage..."
for component in lib/ui/*.tsx; do
  comp_name=$(basename $component .tsx)
  usage_count=$(grep -r "import.*${comp_name}" app/ features/ 2>/dev/null | wc -l)
  echo "$comp_name: used $usage_count times"
done
```

## Report Generation

Create a comprehensive markdown report at `metrics/report-{timestamp}.md` with the following structure:

```markdown
# Trends - AI Engineering Advisory Platform - Code Metrics Report

**Generated:** {timestamp}
**Branch:** {git branch}
**Commit:** {git commit hash}

## Executive Summary

- **Total Lines of Code:** {number}
- **Source Files:** {number}
- **Test Coverage:** {percentage}%
- **Comment Density:** {percentage}%
- **TypeScript Adoption:** {percentage}%

## 1. Code Volume Metrics

### Lines of Code by Language
| Language   | Files | Blank | Comment | Code  | Total  |
|------------|-------|-------|---------|-------|--------|
| TypeScript | ...   | ...   | ...     | ...   | ...    |
| JavaScript | ...   | ...   | ...     | ...   | ...    |
| CSS        | ...   | ...   | ...     | ...   | ...    |
| Markdown   | ...   | ...   | ...     | ...   | ...    |
| JSON       | ...   | ...   | ...     | ...   | ...    |

### Lines of Code by Directory
| Directory         | Files | Lines | Percentage |
|-------------------|-------|-------|------------|
| app/              | ...   | ...   | ...%       |
| features/         | ...   | ...   | ...%       |
| intelligence/     | ...   | ...   | ...%       |
| lib/              | ...   | ...   | ...%       |
| server/           | ...   | ...   | ...%       |
| .claude/specs/    | ...   | ...   | ...%       |
| blog/             | ...   | ...   | ...%       |

## 2. File and Module Metrics

- **Total Files:** {number}
- **Average File Size:** {number} lines
- **Median File Size:** {number} lines

### Largest Files (Top 10)
| File | Lines | Type |
|------|-------|------|
| ...  | ...   | ...  |

### File Distribution by Type
| Extension | Count | Percentage |
|-----------|-------|------------|
| .tsx      | ...   | ...%       |
| .ts       | ...   | ...%       |
| .json     | ...   | ...%       |
| .md       | ...   | ...%       |

## 3. Test Coverage Metrics

- **Test Files:** {number}
- **Test Lines:** {number}
- **Test-to-Code Ratio:** {ratio}
- **Tested Modules:** {number}/{total} ({percentage}%)

### Coverage Gaps
{List of untested files or modules}

## 4. Code Quality Metrics

- **Comment Lines:** {number}
- **Comment Density:** {percentage}%
- **JSDoc Coverage:** {percentage}%
- **TypeScript Files:** {number}
- **JavaScript Files:** {number}
- **Type Safety:** {percentage}% TypeScript adoption

### Code Complexity
- **Average Function Length:** {number} lines
- **Longest Function:** {number} lines in {file}
- **Component Average Size:** {number} lines

## 5. Architecture Metrics

### React Components
- **Total Components:** {number}
- **Page Components:** {number}
- **UI Components:** {number}
- **Custom Hooks:** {number}

### API Architecture
- **API Routes:** {number}
- **Dynamic Routes:** {number}
- **Static Routes:** {number}

### Type System
- **Type Definitions:** {number}
- **Interfaces:** {number}
- **Enums:** {number}

## 6. Dependency Analysis

### Package Dependencies
- **Production Dependencies:** {number}
- **Development Dependencies:** {number}
- **Total Dependencies:** {number}

### Key Dependencies
{List top 10 most important dependencies}

### Dependency Health
- **Outdated Packages:** {number}
- **Security Vulnerabilities:** {number}
- **License Compliance:** ✅/❌

## 7. Feature Architecture Analysis (Trends-specific)

### Feature-Slice Architecture
- **Feature Slices:** {number} (trends, needs, solutions)
- **Intelligence Agents:** {number}
- **tRPC Routers:** {number}
- **Zustand Stores:** {number}
- **Specification Documents:** {number}
- **Blog Posts:** {number}

### Feature Distribution
| Feature Slice | Components | Server Routes | Hooks | Store | Status |
|---------------|------------|---------------|-------|-------|--------|
| trends        | ...        | ...           | ...   | ✅    | Active |
| needs         | ...        | ...           | ...   | ✅    | Active |
| solutions     | ...        | ...           | ...   | ✅    | Active |
| market-intel  | ...        | ...           | ...   | ❌    | Planned|

### Intelligence System
- **Base Agents:** {number}
- **Market Intelligence Agents:** {number}
- **Cache Implementations:** {number}
- **Orchestration Components:** {number}
- **Data Pipelines:** {number}

### AI/LLM Integration Metrics
- **AI Service Integrations:** Anthropic Claude, OpenAI (if used)
- **Streaming Implementations:** {number} (progressive rendering, real-time updates)
- **AI Prompt Templates:** {count from features/*/server/generator.ts files}
- **Cache Strategies:** Redis/KV, in-memory, response caching
- **Error Handling Coverage:** API key validation, rate limiting, fallback strategies

### Event-Driven Architecture
- **Event Types Defined:** {count from lib/events/index.ts}
- **Event Emitters:** {count of events.emit() calls}
- **Event Listeners:** {count of events.on() calls}
- **Cross-Feature Communication:** Events used vs direct imports

### UI Component Library (lib/ui/)
| Component | Usage Count | Reusability Score |
|-----------|-------------|-------------------|
| Button    | ...         | High/Medium/Low   |
| Card      | ...         | High/Medium/Low   |
| Dialog    | ...         | High/Medium/Low   |
| Skeleton  | ...         | High/Medium/Low   |
| ...       | ...         | ...               |

## 8. Historical Trends

### Growth Metrics
{If previous reports exist, show trends}

- **LOC Growth:** +{number} lines since last report
- **Test Coverage Change:** +/-{percentage}%
- **New Dependencies:** +{number}

## 9. Recommendations

Based on the analysis:

1. **Code Quality:**
   - [ ] Increase test coverage to 80%+ (currently {current}%)
   - [ ] Add JSDoc comments to public APIs
   - [ ] Refactor files over 500 lines

2. **Architecture:**
   - [ ] Extract repeated logic into utilities
   - [ ] Consider splitting large components
   - [ ] Improve type definitions

3. **Dependencies:**
   - [ ] Update outdated packages
   - [ ] Remove unused dependencies
   - [ ] Audit security vulnerabilities

4. **Documentation:**
   - [ ] Add README files to major directories
   - [ ] Document API routes
   - [ ] Create component usage examples

## 10. Appendices

### A. Detailed File Listing
{Full file tree with line counts}

### B. Dependency Tree
{Complete dependency graph}

### C. Analysis Tools Used
- cloc v{version}
- npm v{version}
- TypeScript v{version}
- Custom analysis scripts

---

**Report Hash:** {sha256 of report content}
**Analysis Duration:** {seconds}s
```

## Execution Instructions

1. **Install Required Tools:**
   ```bash
   # Install cloc for line counting
   npm install -g cloc

   # Ensure jq is available for JSON parsing
   # macOS: brew install jq
   # Linux: sudo apt-get install jq
   ```

2. **Run Analysis:**
   - Execute all bash commands to collect metrics
   - Parse JSON outputs
   - Calculate derived metrics
   - Generate markdown report

3. **Save Report:**
   - Create timestamp: `date +%Y-%m-%d-%H%M%S`
   - Save to: `metrics/report-{timestamp}.md`
   - Update `metrics/latest.md` symlink

4. **Generate Summary:**
   - Create executive summary
   - Highlight key findings
   - Provide actionable recommendations

5. **Commit Results:**
   - Add metrics report to git
   - Update project documentation
   - Create summary comment

## Success Criteria

The report should include:
- ✅ All 10 sections completed
- ✅ Accurate line counts
- ✅ File statistics
- ✅ Test coverage analysis
- ✅ Dependency breakdown
- ✅ Actionable recommendations
- ✅ Professional formatting
- ✅ Timestamp and metadata

## Notes

- Run this command periodically (weekly/monthly) to track progress
- Compare reports over time to see trends
- Use metrics to guide refactoring decisions
- Share reports with team for visibility
- Archive old reports for historical reference

**IMPORTANT:** Think harder about the metrics that matter most for the Trends project:
- Feature slice independence (zero compile-time dependencies)
- Event-driven architecture compliance
- AI agent specialization and efficiency
- tRPC type safety coverage
- Feature flag implementation
- Real-time streaming capabilities
- Cache hit rates and performance
- Documentation completeness (.claude/specs/)
- Feature-to-test ratio
- Component reusability (lib/ui/)
