# UI Patterns & Design System
## Component Guidelines, Layout Patterns, and User Experience Standards

### Design Philosophy

**Visual Identity**: Professional, modern, AI-first aesthetic with trust-building elements
**Color Palette**: Blue (primary), Purple (secondary), Green (success), Orange (warning), Red (error)
**Typography**: Inter font family with clear hierarchy
**Spacing**: Consistent 4px base unit scaling
**Accessibility**: WCAG 2.1 AA compliance for all components

### Layout Patterns

#### Standard Page Layout
```tsx
// Primary page structure for all features
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  {/* Header */}
  <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
              <p className="text-gray-600 mt-1">Page description</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Action buttons */}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">{/* Primary content */}</div>
      <div className="space-y-6">{/* Sidebar */}</div>
    </div>
  </main>
</div>
```

#### Card Layouts
```tsx
// Standard card pattern for data display
<Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500">
  <CardHeader className="pb-3">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
          Card Title
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Category</Badge>
          <Badge variant="secondary" className="text-xs">Metadata</Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Action buttons */}
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Card content */}
  </CardContent>
</Card>
```

### Component Library Standards

#### Button Patterns
```tsx
// Primary action button
<Button 
  size="sm"
  className="flex items-center gap-2"
  onClick={handleAction}
>
  <Icon className="h-4 w-4" />
  Action Label
</Button>

// Secondary action button
<Button 
  variant="outline"
  size="sm"
  className="flex items-center gap-2"
>
  <Icon className="h-4 w-4" />
  Secondary Action
</Button>

// Icon-only button
<Button
  variant="ghost"
  size="sm"
  className="p-1"
>
  <Icon className="h-4 w-4" />
</Button>
```

#### Loading States
```tsx
// Skeleton loading for content
if (isLoading) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  )
}

// Loading button state
<Button disabled={isPending}>
  {isPending ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Processing...
    </>
  ) : (
    <>
      <Icon className="h-4 w-4 mr-2" />
      Action
    </>
  )}
</Button>
```

#### Error States
```tsx
// Error boundary pattern
if (error) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Error occurred
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error.message}</p>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-red-800 border-red-300 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### AI-Specific UI Patterns

#### Intelligence Indicators
```tsx
// AI confidence scoring display
<div className="flex items-center gap-2">
  <Badge 
    variant="outline"
    className={`text-xs ${getConfidenceColor(confidence)}`}
  >
    {Math.round(confidence * 100)}% confidence
  </Badge>
  <Badge variant="secondary" className="text-xs">
    AI Analysis
  </Badge>
</div>

// Chain-of-thought reasoning
<details className="text-sm">
  <summary className="cursor-pointer text-blue-700 hover:text-blue-800 font-medium">
    View AI Reasoning Chain
  </summary>
  <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200">
    {reasoningChain.map((step, index) => (
      <div key={index} className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Step {step.step}
          </span>
          <span className="text-xs text-gray-700">
            {Math.round(step.confidence * 100)}% confidence
          </span>
        </div>
        <p className="text-xs text-gray-800">{step.description}</p>
      </div>
    ))}
  </div>
</details>
```

#### Live Intelligence Dashboard
```tsx
// Collapsible dashboard pattern
<Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-blue-600" />
        Live Intelligence Dashboard
      </CardTitle>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="p-1"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
    </div>
  </CardHeader>
  
  {expanded && (
    <CardContent className="space-y-4">
      {/* Dashboard metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600">{metric.label}</div>
            <div className="text-xs text-gray-700 font-medium">{metric.description}</div>
          </div>
        ))}
      </div>
    </CardContent>
  )}
</Card>
```

### Form Patterns

#### Company Profile Forms
```tsx
// Consistent form layout for company configuration
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        AI Analysis Setup - Configure your company profile
      </span>
    </div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div>
      <label className="text-xs font-medium text-gray-700">Industry</label>
      <select className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm">
        <option value="technology">Technology</option>
        <option value="healthcare">Healthcare</option>
        <option value="finance">Finance</option>
      </select>
    </div>
    {/* Additional form fields */}
  </div>
</div>
```

#### Search and Filter Patterns
```tsx
// Consistent search and filter layout
<div className="flex items-center gap-4 flex-wrap">
  <div className="flex-shrink-0">
    <TrendFilters
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
    />
  </div>
  <div className="flex items-center gap-2 min-w-0 flex-1">
    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
    <Input
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="flex-1 min-w-0"
    />
  </div>
</div>
```

### Data Visualization Patterns

#### Trend Cards vs Row Views
```tsx
// Toggle between view modes
<div className="flex items-center bg-gray-100 rounded-lg p-1">
  <Button
    variant={viewMode === 'cards' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setViewMode('cards')}
    className="flex items-center gap-2 h-8"
  >
    <Grid3X3 className="h-4 w-4" />
    Cards
  </Button>
  <Button
    variant={viewMode === 'rows' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setViewMode('rows')}
    className="flex items-center gap-2 h-8"
  >
    <List className="h-4 w-4" />
    Rows
  </Button>
</div>
```

#### Progressive Disclosure
```tsx
// Expandable content pattern for detailed information
<div className="space-y-2">
  {items.map((item) => {
    const isExpanded = expandedItem === item.id
    return (
      <div key={item.id} className="border rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">{/* Summary content */}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
            className="p-1 h-auto"
          >
            <ChevronRight 
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </Button>
        </div>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            {/* Detailed content */}
          </div>
        )}
      </div>
    )
  })}
</div>
```

### Responsive Design Standards

#### Breakpoint Strategy
- `sm:` 640px - Mobile landscape
- `md:` 768px - Tablet
- `lg:` 1024px - Desktop
- `xl:` 1280px - Large desktop

#### Mobile-First Approach
```tsx
// Always design mobile-first, then enhance for larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content adapts from 1 column on mobile to 3 on desktop */}
</div>

<div className="flex flex-col lg:flex-row gap-4">
  {/* Stack vertically on mobile, horizontally on desktop */}
</div>
```

### Accessibility Standards

#### Semantic HTML
- Use proper heading hierarchy (`h1` → `h2` → `h3`)
- Include `aria-label` for icon-only buttons
- Provide `alt` text for informative images
- Use `role` attributes for complex interactions

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order through the interface
- Escape key to close modals and dropdowns

#### Color and Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Don't rely solely on color to convey information
- Provide text alternatives for color-coded elements

### Performance Guidelines

#### Image Optimization
- Use Next.js Image component for all images
- Provide appropriate `width` and `height` attributes
- Use `loading="lazy"` for images below the fold
- Optimize image formats (WebP when supported)

#### Component Optimization
- Use React.memo for expensive components
- Implement proper key props for list items
- Avoid inline object/function creation in render
- Use useCallback and useMemo judiciously