Loaded cached credentials.
The following files have been analyzed for performance optimizations.

### 1. `src/App.tsx`

**Issue:** The `animations` array is re-created on every render, causing `AnimationSelector` to re-render unnecessarily even if memoized.
**Fix:** Move the `animations` constant outside the component or use `useMemo`.

**Issue:** Child components (`SnowOverlay`, `VehicleSelector`, `AnimationSelector`) re-render on every `stats` update because `App` re-renders.
**Fix:** While `React.memo` will be applied to the children in their respective files, moving the constant definition is the first step here.

```typescript
// src/App.tsx:89
// Move this array outside the App component function
const ANIMATIONS = [
  'Death_A', 'Death_A_Pose', 'Death_B', 'Death_B_Pose',
  // ...
];
```

### 2. `src/components/ui/VehicleSelector.tsx`

**Issue:** Missing `React.memo`. The component re-renders whenever the parent (`App`) updates (e.g., on every frame of stats update), even if vehicle selection hasn't changed.
**Issue:** `vehicles` array is created on every render.

```typescript
// src/components/ui/VehicleSelector.tsx
import React, { memo } from 'react'; // Import memo

// Move vehicles array outside
const VEHICLES = [
  { type: null, icon: '🚶', label: 'Foot' },
  // ...
];

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ onSelect, currentVehicle }) => {
  // Use VEHICLES constant
  return (...)
};

export default memo(VehicleSelector); // Wrap in memo
```

### 3. `src/components/ui/AnimationSelector.tsx`

**Issue:** Missing `React.memo`. Re-renders on every parent update.

```typescript
// src/components/ui/AnimationSelector.tsx
import React, { useState, memo } from 'react';

// ... component code ...

export default memo(AnimationSelector);
```

### 4. `src/components/ui/SnowOverlay.tsx`

**Issue:** Missing `React.memo`. Even though it has no props, it will re-execute the function body on every parent render.

```typescript
// src/components/ui/SnowOverlay.tsx
import React, { useEffect, useRef, memo } from 'react';

// ... component code ...

export default memo(SnowOverlay);
```

### 5. `src/components/GameCanvas.tsx`

**Issue:** Missing `React.memo`.

```typescript
// src/components/GameCanvas.tsx
import React, { useRef, useEffect, useState, memo } from 'react';

// ... component code ...

export default memo(GameCanvas);
```

### 6. `src/components/ui/NotificationSystem.tsx`

**Issue:** Missing `React.memo`.
**Issue:** Inline style objects for animations are created on every render.

```typescript
// src/components/ui/NotificationSystem.tsx
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

// ... component code ...

export default memo(NotificationSystem);
```

### 7. `src/components/ui/Menus.tsx`

**Issue:** Missing `React.memo` for `MainMenu` and `GameOver`.

```typescript
// src/components/ui/Menus.tsx
// ...
export const MainMenu = React.memo<MainMenuProps>(({
  onStart,
  isLoading = false,
}) => {
  // ...
});

// ...

export const GameOver = React.memo<GameOverProps>(({ stats, onRestart }) => {
  // ...
});
```

I will now apply these changes using `replace`.

Error executing tool default_api:replace: Tool "default_api:replace" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "read_file", "list_directory", "web_fetch"?
The analysis of the React components has identified several performance issues, primarily related to unnecessary re-renders caused by inline object creation and missing `React.memo`.

Here are the identified issues and their exact fixes:

### 1. `src/App.tsx`

**Issue:** `animations` array (lines 89-102) is created on every render. This breaks potential memoization of the `AnimationSelector` component, causing it to re-render on every frame update.
**Fix:** Move the `animations` array definition outside the `App` component.

```typescript
// src/App.tsx

// 1. Define outside component
const ANIMATIONS = [
  'Death_A', 'Death_A_Pose', 'Death_B', 'Death_B_Pose',
  'Hit_A', 'Hit_B', 'Idle_A', 'Idle_B', 'Interact',
  'Jump_Full_Long', 'Jump_Full_Short', 'Jump_Idle', 'Jump_Land', 'Jump_Start',
  'Melee_1H_Attack_Chop', 'Melee_1H_Attack_Jump_Chop', 'Melee_1H_Attack_Slice_Diagonal',
  'Melee_1H_Attack_Slice_Horizontal', 'Melee_1H_Attack_Stab',
  'Melee_2H_Attack_Chop', 'Melee_2H_Attack_Slice', 'Melee_2H_Attack_Spin',
  'Melee_2H_Attack_Spinning', 'Melee_2H_Attack_Stab', 'Melee_2H_Idle',
  'Melee_Block', 'Melee_Block_Attack', 'Melee_Block_Hit', 'Melee_Blocking',
  'Melee_Dualwield_Attack_Chop', 'Melee_Dualwield_Attack_Slice', 'Melee_Dualwield_Attack_Stab',
  'Melee_Unarmed_Attack_Kick', 'Melee_Unarmed_Attack_Punch_A', 'Melee_Unarmed_Idle',
  'PickUp', 'Running_A', 'Running_B', 'Spawn_Air', 'Spawn_Ground',
  'T-Pose', 'Throw', 'Use_Item', 'Walking_A', 'Walking_B', 'Walking_C', 'Seated_Bike'
];

function App() {
  // ... existing code ...
  
  // 2. Remove the inline `animations` constant inside App

  return (
    // ...
            <AnimationSelector
              animations={ANIMATIONS} // 3. Use the static constant
              onSelect={handleAnimationSelect}
              onPlayOnce={handleAnimationPlayOnce}
              currentAnimation={currentAnimation}
            />
    // ...
  );
}
```

### 2. `src/components/ui/VehicleSelector.tsx`

**Issue:** 
1.  `vehicles` array (lines 10-16) is created on every render.
2.  Component is not wrapped in `React.memo`. Since it is a child of `App`, it re-renders whenever `App` updates (which is every frame due to `stats` updates), even if vehicle props haven't changed.

**Fix:** Move `vehicles` array outside and wrap in `memo`.

```typescript
// src/components/ui/VehicleSelector.tsx
import React, { memo } from 'react'; // Import memo

// 1. Move outside
const VEHICLES = [
  { type: null, icon: '🚶', label: 'Foot' },
  { type: VehicleType.BICYCLE, icon: '🚲', label: 'Bicycle' },
  { type: VehicleType.MOTORBIKE, icon: '🏍️', label: 'Motorbike' },
  { type: VehicleType.SEDAN, icon: '🚗', label: 'Car' },
  { type: VehicleType.TRUCK, icon: '🚛', label: '18-Wheeler' },
];

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ onSelect, currentVehicle }) => {
  // 2. Use VEHICLES in the map function
  return (
    <>
      {VEHICLES.map((v) => (
        // ... existing code ...
      ))}
    </>
  );
};

export default memo(VehicleSelector); // 3. Wrap in memo
```

### 3. `src/components/ui/AnimationSelector.tsx`

**Issue:** Component is not wrapped in `React.memo`. It receives the `animations` array (fixed in item #1) and callbacks. Without `memo`, it re-renders every time `App` re-renders.

**Fix:** Wrap in `memo`.

```typescript
// src/components/ui/AnimationSelector.tsx
import React, { useState, memo } from 'react'; // Import memo

// ... component code ...

export default memo(AnimationSelector); // Wrap in memo
```

### 4. `src/components/ui/SnowOverlay.tsx`

**Issue:** Component is not wrapped in `React.memo`. It has no props, so it should never re-render unless its own state changes (which it doesn't, it uses refs). However, `App` forces it to re-render every frame.

**Fix:** Wrap in `memo`.

```typescript
// src/components/ui/SnowOverlay.tsx
import React, { useEffect, useRef, memo } from 'react'; // Import memo

// ... component code ...

export default memo(SnowOverlay); // Wrap in memo
```

### 5. `src/components/GameCanvas.tsx`

**Issue:** Component is not wrapped in `React.memo`. While it relies heavily on refs and `useEffect`, re-executing the component body every frame (from parent updates) is unnecessary overhead.

**Fix:** Wrap in `memo`.

```typescript
// src/components/GameCanvas.tsx
import React, { useRef, useEffect, useState, memo } from 'react'; // Import memo

// ... component code ...

export default memo(GameCanvas); // Wrap in memo
```

### 6. `src/components/ui/NotificationSystem.tsx`

**Issue:** Component is not wrapped in `React.memo`. It receives `stats`-derived props like `showEnterPrompt` which change frequently, but `memo` will still prevent re-renders when unrelated `App` state changes.

**Fix:** Wrap in `memo`.

```typescript
// src/components/ui/NotificationSystem.tsx
import React, { useState, useEffect, useCallback, useRef, memo } from 'react'; // Import memo

// ... component code ...

export default memo(NotificationSystem); // Wrap in memo
```

### 7. `src/components/ui/Menus.tsx`

**Issue:** `MainMenu` and `GameOver` are not memoized. `GameOver` receives `stats`, but `MainMenu` only receives `onStart` and `isLoading`.

**Fix:** Wrap both components in `memo`.

```typescript
// src/components/ui/Menus.tsx
import React, { useState, useEffect, memo } from "react"; // Import memo

// ... 

export const MainMenu = memo<MainMenuProps>(({ // Wrap definition
  onStart,
  isLoading = false,
}) => {
  // ...
});

// ...

export const GameOver = memo<GameOverProps>(({ stats, onRestart }) => { // Wrap definition
  // ...
});
```
