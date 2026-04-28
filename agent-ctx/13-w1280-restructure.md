# Task 13: W1280 Layout Restructure & Overlapping Fix

## Task Description
Restructure the agent-hierarchy.tsx component to use a max-w-[1280px] centered layout instead of the current fullscreen layout, and fix all overlapping layer issues.

## Changes Made

### 1. Main Container Restructure
- **Before**: `w-screen h-screen overflow-hidden relative select-none` with `background: '#000000'`
- **After**: 
  - Outer wrapper: `min-h-screen bg-black flex justify-center`
  - Inner container: `max-w-[1280px] w-full h-screen flex flex-col relative overflow-hidden select-none`
  - BackgroundParticles moved to separate `fixed inset-0 pointer-events-none z-0` div

### 2. Header Fix
- **Before**: `fixed top-0 left-0 right-0 z-40` with `height: 48px`
- **After**: `relative z-40` with `height: 48px` — normal block element at top of flex column

### 3. Sidebar Fix
- **Before**: `fixed left-0 z-30 flex flex-col` with `top: 48px; bottom: 0`
- **After**: `relative z-30 flex flex-col flex-shrink-0 h-full` — proper flex child
- Changed `overflow: hidden` to `overflowX: visible; overflowY: hidden` for toggle button visibility

### 4. SVG Canvas Fix
- **Before**: `absolute inset-0 z-10` with marginLeft/width calculation hacks
- **After**: Wrapped in `<div ref={svgContainerRef} className="flex-1 relative overflow-hidden">` with SVG using `width="100%" height="100%"`
- Removed all marginLeft and `calc(100% - 280px)` width hacks

### 5. Dimensions Calculation
- **Before**: `setDimensions({ width: window.innerWidth, height: window.innerHeight })`
- **After**: Uses `svgContainerRef` with `ResizeObserver` to get actual container dimensions

### 6. Breadcrumb Trail
- **Before**: `fixed top-20 left-1/2 -translate-x-1/2 z-40` with marginLeft hack
- **After**: `absolute top-2 left-1/2 -translate-x-1/2 z-40` within SVG container div

### 7. Mobile Search Row
- **Before**: `md:hidden fixed top-12 left-0 right-0 z-30`
- **After**: `md:hidden relative z-30` within flex column

### 8. AgentDetailPanel
- **Before**: `fixed right-4 bottom-4 w-[340px] z-50`
- **After**: `absolute right-4 bottom-4 w-[340px] z-50`

### 9. Mobile Overlay
- **Before**: `fixed inset-0 z-20 bg-black/50`
- **After**: `absolute inset-0 z-20 bg-black/50`

### 10. Loading Overlay
- **Before**: `fixed inset-0 z-50`
- **After**: `absolute inset-0 z-50`

### 11. Mouse Event Handlers
- Moved from container div to SVG container div — panning/zooming only on canvas

### 12. BreadcrumbTrail Component
- Removed `fixed` positioning from className

## New Layout Structure
```
<div class="min-h-screen bg-black flex justify-center">  <!-- full viewport bg -->
  <div class="fixed inset-0 pointer-events-none z-0">    <!-- background particles -->
    <BackgroundParticles />
  </div>
  <div class="max-w-[1280px] w-full h-screen flex flex-col relative overflow-hidden select-none">
    <header class="relative z-40">...</header>            <!-- NOT fixed -->
    <div class="md:hidden relative z-30">...</div>        <!-- mobile search, NOT fixed -->
    <div class="flex flex-1 overflow-hidden relative">    <!-- sidebar + canvas -->
      <sidebar class="relative z-30 flex-shrink-0 h-full">...</sidebar>
      <div class="flex-1 relative overflow-hidden" ref={svgContainerRef}>
        <breadcrumb class="absolute top-2 ...">...</breadcrumb>
        <svg width="100%" height="100%">...</svg>         <!-- fills remaining space -->
      </div>
    </div>
    <!-- agent detail panel, context menu, etc. -->
  </div>
</div>
```

## Verification
- Lint: 0 errors
- Dev server: compiling and serving successfully
- All functionality preserved: zoom, pan, drag, search, filtering, node selection, context menu, keyboard shortcuts
