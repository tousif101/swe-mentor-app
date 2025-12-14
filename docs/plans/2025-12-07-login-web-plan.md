# Login/Signup Flow Implementation Plan (Web)

> **Created:** 2025-12-07
> **Status:** Ready to implement
> **Estimate:** ~2-3 hours

## Overview

Implement modern, accessible login and signup pages for the SWE Mentor web app using DaisyUI, following the existing dark theme design system.

---

## Files to Create

### 1. Reusable Components (`apps/web/src/components/auth/`)

| File | Purpose |
|------|---------|
| `AuthCard.tsx` | Glass-effect card container |
| `AuthHeader.tsx` | Logo + title with animations |
| `FormInput.tsx` | Accessible input with label/error |
| `PasswordInput.tsx` | Password with show/hide toggle |
| `SocialAuthButtons.tsx` | Google OAuth button |
| `AuthDivider.tsx` | "or continue with" separator |
| `SubmitButton.tsx` | Loading-aware submit button |

### 2. Auth Pages

| File | Purpose |
|------|---------|
| `apps/web/src/app/(auth)/layout.tsx` | Centered layout with gradient bg |
| `apps/web/src/app/(auth)/login/page.tsx` | Login page |
| `apps/web/src/app/(auth)/login/actions.ts` | Login server actions |
| `apps/web/src/app/(auth)/signup/page.tsx` | Signup page |
| `apps/web/src/app/(auth)/signup/actions.ts` | Signup server actions |

### 3. Style Updates

| File | Changes |
|------|---------|
| `apps/web/src/app/globals.css` | Add button-pop, input-glow, shake animations |

---

## Critical Files to Reference

- `apps/web/src/lib/supabase/server.ts` - Server auth client
- `apps/web/src/lib/supabase/client.ts` - Browser client for OAuth
- `apps/web/src/app/globals.css` - Design system
- `apps/web/src/app/auth/callback/route.ts` - OAuth callback (done)

---

## Server/Client Component Matrix

| Component | Type | Directive | Reason |
|-----------|------|-----------|--------|
| `(auth)/layout.tsx` | Server | None | Static layout, no interactivity |
| `(auth)/login/page.tsx` | Client | `"use client"` | Uses `useActionState` for form |
| `(auth)/login/actions.ts` | Server | `"use server"` | Server action |
| `(auth)/signup/page.tsx` | Client | `"use client"` | Uses `useActionState` for form |
| `(auth)/signup/actions.ts` | Server | `"use server"` | Server action |
| `AuthCard.tsx` | Server | None | Static container, no state |
| `AuthHeader.tsx` | Server | None | Static content |
| `AuthDivider.tsx` | Server | None | Static content |
| `FormInput.tsx` | Client | `"use client"` | Receives props from form state |
| `PasswordInput.tsx` | Client | `"use client"` | Has toggle state |
| `SubmitButton.tsx` | Client | `"use client"` | Uses `useFormStatus` |
| `SocialAuthButtons.tsx` | Client | `"use client"` | Has onClick, async state |

---

## Form State Management Pattern

Use React 19's `useActionState` (formerly `useFormState`) for type-safe form handling:

```typescript
// login/page.tsx
'use client'
import { useActionState } from 'react'
import { login } from './actions'
import type { AuthActionState } from '@/types/auth'

const initialState: AuthActionState = { status: 'idle' }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction}>
      <FormInput
        name="email"
        error={state.errors?.email?.[0]}
      />
      <PasswordInput
        name="password"
        error={state.errors?.password?.[0]}
      />
      <SubmitButton pending={isPending}>Login</SubmitButton>
      {state.errors?._form && (
        <div role="alert" className="alert alert-error">
          {state.errors._form[0]}
        </div>
      )}
    </form>
  )
}
```

```typescript
// SubmitButton.tsx - Uses useFormStatus for pending state
'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn btn-primary w-full"
    >
      {pending ? (
        <>
          <span className="loading loading-spinner" aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  )
}
```

---

## Design System

- **Theme:** Dark only (bg-gray-950)
- **Primary:** Purple (#4c1d95 → #8b5cf6)
- **Accent:** Pink/Magenta (#d946ef)
- **Utilities:** `.gradient-bg`, `.glass`, `.animate-fade-in`

---

## DaisyUI Components to Use

- `card`, `card-body` - Auth container
- `form-control`, `label`, `input` - Form elements
- `btn`, `btn-primary`, `btn-outline` - Buttons
- `loading`, `loading-spinner` - Loading states
- `alert`, `alert-error` - Error messages
- `divider` - Separator

---

## Authentication Flow

1. **Login:** Email/password via `signInWithPassword()` OR Google OAuth via `signInWithOAuth()`
2. **Callback:** Existing `/auth/callback` handles OAuth redirect
3. **Post-auth:** Check `profiles.onboarding_completed` → redirect to `/onboarding` or `/journal`

---

## Accessibility Checklist

- [ ] All inputs have visible `<label>` with `htmlFor`
- [ ] Error messages linked via `aria-describedby`
- [ ] `aria-invalid` on invalid inputs
- [ ] `aria-busy` on loading buttons
- [ ] `role="alert"` on error displays
- [ ] Minimum 44px touch targets
- [ ] Focus ring on all interactive elements
- [ ] Keyboard navigation (Tab order, Enter submit)
- [ ] `autocomplete` attributes on all inputs (email, current-password, new-password)
- [ ] Screen reader announcements for loading states (sr-only live regions)
- [ ] Password toggle announces state change
- [ ] Color contrast verified (4.5:1 text, 3:1 UI components)

---

## Responsive Design

- **Mobile:** Full width, 16px padding, 44px input height
- **Desktop:** Max 448px (max-w-md), 40px padding

---

## Implementation Order

### Step 1: Foundation
1. Create `apps/web/src/app/(auth)/layout.tsx` - gradient bg, centered
2. Create `apps/web/src/components/auth/AuthCard.tsx` - glass card
3. Create `apps/web/src/components/auth/AuthHeader.tsx` - logo + title
4. Create `apps/web/src/components/auth/FormInput.tsx` - accessible input

### Step 2: Login Page
5. Create `apps/web/src/components/auth/PasswordInput.tsx` - with toggle
6. Create `apps/web/src/components/auth/SubmitButton.tsx` - loading state
7. Create `apps/web/src/app/(auth)/login/actions.ts` - Zod validation + Supabase
8. Create `apps/web/src/app/(auth)/login/page.tsx` - full login form

### Step 3: OAuth & Polish
9. Create `apps/web/src/components/auth/SocialAuthButtons.tsx` - Google button
10. Create `apps/web/src/components/auth/AuthDivider.tsx` - separator
11. Add animations to `globals.css` (button-pop, input-glow, shake)

### Step 4: Signup Page
12. Create `apps/web/src/app/(auth)/signup/actions.ts` - with password strength
13. Create `apps/web/src/app/(auth)/signup/page.tsx` - confirm password, success state

### Step 5: Verification
14. Test keyboard navigation
15. Test screen reader
16. Test responsive breakpoints
17. Run existing tests to ensure no regressions

---

## TypeScript Types

Create `apps/web/src/types/auth.ts`:

```typescript
import { z } from 'zod'

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Inferred types
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

// Server action response type
export type AuthActionState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  errors?: {
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
    _form?: string[]
  }
}
```

---

## Component Props Types

```typescript
// FormInput.tsx
export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

// PasswordInput.tsx
export interface PasswordInputProps extends Omit<FormInputProps, 'type'> {
  showStrengthMeter?: boolean
}

// SubmitButton.tsx
export interface SubmitButtonProps {
  children: React.ReactNode
  loadingText?: string
}

// AuthCard.tsx
export interface AuthCardProps {
  children: React.ReactNode
  className?: string
}
```

---

## Server Action Patterns

### Login (`actions.ts`)

```typescript
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, type AuthActionState } from '@/types/auth'

export async function login(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Parse and validate
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // Generic error message to prevent account enumeration
    return {
      status: 'error',
      errors: { _form: ['Invalid email or password'] },
    }
  }

  // Check onboarding status
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      redirect('/onboarding')
    }
  }

  redirect('/journal')
}
```

### Google OAuth (client-side)

```typescript
const supabase = createClient() // browser client
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` },
})
```

---

## Animation Additions to globals.css

```css
/* Button pop on click */
.animate-button-pop:active { transform: scale(0.98); }

/* Input focus glow */
.input-glow:focus { box-shadow: 0 0 0 3px rgba(139,92,246,0.3); }

/* Error shake */
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
.animate-shake { animation: shake 0.3s; }

/* Slide in messages */
@keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
.animate-slide-in { animation: slideIn 0.2s; }
```

---

## Success Criteria

### Functional
- [ ] Login with email/password works
- [ ] Login with Google OAuth works
- [ ] Signup creates account and shows email confirmation message
- [ ] Errors display with proper styling and accessibility
- [ ] Loading states work correctly
- [ ] Responsive on mobile/tablet/desktop

### Security
- [ ] Password validation enforces 8+ chars with complexity
- [ ] Generic error messages (no account enumeration)
- [ ] All inputs sanitized via Zod validation
- [ ] Security headers configured in next.config.ts

### Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] All animations respect prefers-reduced-motion
- [ ] Screen reader announces loading/error/success states
- [ ] All inputs have autocomplete attributes
- [ ] Keyboard navigation works correctly
- [ ] Tested with VoiceOver or NVDA

### Quality
- [ ] All tests pass
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings

---

## Post-MVP Follow-up Items

> These items were identified during code review, accessibility audit, and security audit.
> Address after MVP launch.

### Accessibility (Critical - WCAG 2.1 AA Compliance)

| Priority | Issue | Fix |
|----------|-------|-----|
| P1 | Missing form input labels | Add `<label>` or `aria-label` to all inputs |
| P1 | Missing `aria-invalid` + `aria-describedby` | Link errors to inputs programmatically |
| P1 | Insufficient color contrast | Change `text-gray-400/500` to `text-gray-300` |
| P2 | Decorative SVGs missing `aria-hidden` | Add `aria-hidden="true"` to icon SVGs |
| P2 | Toggle button state not announced | Add `aria-pressed` to magic link toggle |
| P2 | Success state missing focus management | Focus heading on signup success |
| P3 | Missing accessibility E2E tests | Add Playwright a11y tests with `@axe-core/playwright` |

### Security

| Priority | Issue | Fix |
|----------|-------|-----|
| P1 | No rate limiting | Add `@upstash/ratelimit` for login/signup/magic link |
| P2 | Weak password policy | Add special character requirement to Zod schema |
| P2 | No explicit CSRF tokens | Add CSRF validation (defense-in-depth) |
| P3 | Missing security headers | Configure CSP, X-Frame-Options in `next.config.ts` |
| P3 | No account lockout | Implement temp lockout after N failed attempts |
| P3 | Missing audit logging | Log auth events for security monitoring |

### Code Quality (Test Infrastructure)

| Priority | Issue | Fix |
|----------|-------|-----|
| P2 | Missing env var validation | Add check for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in test client |
| P2 | Race condition in profile test | Replace 500ms sleep with retry logic |
| P2 | Redirect test has no assertion | Add proper URL assertion after auth redirect |
| P3 | Duplicate service key constant | Extract to shared test constants file |
| P3 | Console.logs in tests | Wrap in `DEBUG` flag or use test reporter |

### UX Enhancements

| Priority | Issue | Fix |
|----------|-------|-----|
| P3 | No password strength meter | Add real-time strength indicator on signup |
| P3 | Cleanup script lacks dry-run | Add `--dry-run` CLI flag |

---

## Implementation Complete

✅ **Login/Signup UI** - Implemented with DaisyUI, dark theme
✅ **Server Actions** - Zod validation, Supabase auth
✅ **Magic Link** - Email-based passwordless login
✅ **OAuth Callback** - Google OAuth ready
✅ **E2E Tests** - Playwright tests for visual + auth flows
✅ **Integration Tests** - Vitest tests for Supabase auth
✅ **Test Cleanup** - Script to remove test users
