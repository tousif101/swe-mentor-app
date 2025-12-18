# Journal Entries List - Design

**Date:** 2025-12-17
**Status:** Approved

## Overview

Display a scrollable feed of day-cards showing morning intentions and evening reflections, with search and hashtag filtering.

**Primary View:** Timeline feed of day-cards, newest first

**Key Principles:**
- Grouped by day (morning + evening on one card)
- Minimal cognitive load - progressive disclosure
- Search and filter always visible
- No guilt for missed entries - gentle nudges only
- Focus area becomes the hashtag system (auto-generated)

---

## Screen Layout

```
┌─────────────────────────────────┐
│ Journal                    [Cal]│  <- Header with calendar icon
├─────────────────────────────────┤
│ Search entries...               │  <- Search bar
│ [All] [#system-design] [#comms] │  <- Hashtag filter chips
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Dec 17 · Tuesday        ✓   │ │  <- Day card (collapsed)
│ │ #system-design              │ │
│ │ Refactor onboarding flow... │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Dec 16 · Monday         ◐   │ │
│ │ #communication              │ │
│ │ Prepare 1:1 talking pts...  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Day Card Component

### Collapsed State (default in feed)

| Element | Position | Details |
|---------|----------|---------|
| Date | Top left | "Dec 17 · Tuesday" |
| Status icon | Top right | ✓ green / ◐ yellow / ✗ red / – gray |
| Hashtag | Below date | `#system-design` - tappable to filter |
| Goal preview | Below hashtag | 1 line, truncated with ellipsis |
| Energy indicator | Bottom right | Only if evening exists (1-5 scale) |

**Status Icon Legend:**
- ✓ (green) - Goal completed
- ◐ (yellow) - Partially completed
- ✗ (red) - Not completed
- – (gray) - Evening not logged yet

### Expanded State (on tap)

```
┌─────────────────────────────────────┐
│ Dec 17 · Tuesday                 ✓  │
│ #system-design                      │
├─────────────────────────────────────┤
│ Morning                             │
│ Focus: System Design                │
│ Goal: Refactor onboarding flow to   │
│       support async sessions        │
├─────────────────────────────────────┤
│ Evening                             │
│ Outcome: Completed                  │
│ Win: Handled async session edges    │
│ Blocker: Ambiguity in session model │
│ Energy: 3/5                         │
│ Tomorrow: Write test coverage       │
└─────────────────────────────────────┘
```

### Partial Day (morning only, no evening)

- Evening section shown with dashed border
- Text: "Evening reflection not logged"
- Muted colors, subtle visual - no guilt

---

## Filter & Search

### Search Bar
- Placeholder: "Search entries..."
- Searches fields: `daily_goal`, `quick_win`, `blocker`, `tomorrow_carry`
- Debounced input (300ms) to avoid excessive queries
- Clear button (X) when text entered

### Hashtag Chips
- First chip: "All" (clears filter, always present)
- Remaining chips: User's unique focus areas from their check-ins
- Horizontal scroll if many tags
- Active chip highlighted with primary color (purple)
- Tapping a hashtag in a card also filters the feed

### Combined Filtering
- Search + hashtag can work together (AND logic)
- "Clear filters" link appears when any filter is active
- Results count shown: "12 entries" or "3 entries match"

---

## Empty States

### No entries yet (new user)

```
┌─────────────────────────────────┐
│                                 │
│        No entries yet           │
│                                 │
│  Complete your first check-in   │
│  to start building your journal │
│                                 │
│    [Start Check-in]             │
│                                 │
└─────────────────────────────────┘
```

- Button navigates to appropriate check-in (morning or evening based on time)

### No search results

```
┌─────────────────────────────────┐
│                                 │
│  No entries match your search   │
│                                 │
│  Try a different tag or date    │
│                                 │
│    [Clear Filters]              │
│                                 │
└─────────────────────────────────┘
```

---

## Data & Queries

### Database Schema (existing - no changes needed)

The `check_ins` table already has all required fields:
- `id`, `user_id`, `check_in_type`, `check_in_date`
- Morning: `focus_area`, `daily_goal`
- Evening: `goal_completed`, `quick_win`, `blocker`, `energy_level`, `tomorrow_carry`
- Metadata: `completed_at`, `created_at`

### Fetch Check-ins Query

```sql
SELECT * FROM check_ins
WHERE user_id = $1
ORDER BY check_in_date DESC, check_in_type DESC
```

### Group by Day (frontend logic)

```typescript
type DayGroup = {
  date: string // "2025-12-17"
  morning: CheckIn | null
  evening: CheckIn | null
}

function groupCheckInsByDay(checkIns: CheckIn[]): DayGroup[] {
  // Group by check_in_date
  // Each day has at most one morning + one evening
}
```

### Get Unique Hashtags Query

```sql
SELECT DISTINCT focus_area FROM check_ins
WHERE user_id = $1 AND focus_area IS NOT NULL
ORDER BY focus_area
```

### Search Query

```sql
SELECT * FROM check_ins
WHERE user_id = $1
  AND (
    daily_goal ILIKE $2 OR
    quick_win ILIKE $2 OR
    blocker ILIKE $2 OR
    tomorrow_carry ILIKE $2
  )
ORDER BY check_in_date DESC
```

---

## File Structure

```
apps/mobile/src/
├── screens/main/
│   └── JournalScreen.tsx        # Main screen (update existing)
├── components/
│   ├── journal/
│   │   ├── DayCard.tsx          # Collapsed/expanded day card
│   │   ├── JournalSearch.tsx    # Search bar + hashtag chips
│   │   └── JournalEmptyState.tsx # Empty/no results states
│   └── index.ts                 # Export new components
└── utils/
    └── journalHelpers.ts        # Query functions, grouping logic
```

---

## Component Props

### DayCard

```typescript
type DayCardProps = {
  date: string
  morning: CheckIn | null
  evening: CheckIn | null
  onHashtagPress: (tag: string) => void
  defaultExpanded?: boolean
}
```

### JournalSearch

```typescript
type JournalSearchProps = {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTag: string | null
  availableTags: string[]
  onTagSelect: (tag: string | null) => void
}
```

### JournalEmptyState

```typescript
type JournalEmptyStateProps = {
  type: 'no-entries' | 'no-results'
  onAction: () => void // Start check-in or clear filters
}
```

---

## Styling (Glassmorphism)

Apply existing design system from `docs/plans/2025-12-16-glassmorphism-design-system.md`:

- **Card background:** `rgba(255, 255, 255, 0.05)`
- **Card border:** `1px solid rgba(255, 255, 255, 0.1)`
- **Border radius:** 16px
- **Hashtag chips:** Glass pill style with primary color when active
- **Status colors:**
  - Completed: `#10b981` (green)
  - Partial: `#f59e0b` (amber)
  - Missed: `#ef4444` (red)
  - Pending: `#6b7280` (gray)

---

## Future Enhancements (deferred)

- Calendar view as secondary navigation
- Swipe left/right to navigate days
- "Favorite" or "Tag" entries for quick access
- AI-generated summaries ("You mentioned 'blockers' 3 times this week")
- Backfill missed check-ins from calendar
- Export to PDF/CSV

---

## Implementation Notes

- No database migrations required
- Reuse existing `checkInHelpers.ts` patterns
- Use `useFocusEffect` to refresh data when tab is focused
- Implement pull-to-refresh
- Add loading skeleton while fetching
- Animate card expansion/collapse
