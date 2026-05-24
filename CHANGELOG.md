# Changelog

All notable changes to DPM Calendar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Wave 3 features: Chronotype quiz, Energy overlay, Task picker, SMART goals (#136, #93, #118, #119)
- Meeting load management widget with daily capacity tracking (#143)
- Daily priority cap enforcement to prevent overcommitment (#142)
- Shutdown routine with gratitude journaling and close-the-loop review (#95)
- Morning ritual enhanced with top-3 priorities and reorder functionality (#94)
- N-of-1 experiment lab with CRUD operations and list UI (#144)
- Focus progress ring with daily goal tracking and streak display (#119)
- CBT reframing prompts for procrastination detection (#140)
- Focus task picker bound to focus sessions (#118)
- Focus timer engine with session persistence (#117)
- Energy-aware scheduling using chronotype curves (#93)
- Chronotype engine with 12-question assessment quiz (#136)
- GitHub Actions CI/CD workflows and branch protection documentation
- Vitest setup with 25 critical unit tests

### Changed
- Complete feature-first architecture migration (Batches 1-6)
- Infrastructure and shared layer extraction
- Dead export cleanup via ts-prune analysis

### Security
- P0 security foundations (Batch 0)

## [0.1.0] - 2024-12-XX

### Added

#### Phase 1: Core Calendar
- Full calendar implementation with day, week, month views
- Google Calendar OAuth integration with bi-directional sync
- Drag & drop task scheduling and time blocking
- Resizable calendar panels with hydration fix
- Clickable days in week and month views
- Calendar sections UI with CRUD operations
- Collapsible calendar sidebar

#### Phase 2: Task Management
- Task creation, editing, and deletion
- Task detail modal with focus/Pomodoro modes
- Subtasks and checklist support
- Tags and categorization system
- Multiple task views (list, board, calendar)
- Real-time timer in task modal
- Planned time editor

#### Phase 3: Dashboard
- Dashboard with greeting and workload editor
- Heatmap view for activity visualization
- Daily tips and mood modal
- Right sidebar menu with panels (Sunsama-style)
- Collapsible sections in sidebar

#### Phase 4: Automation Rules
- Rule engine for task automation
- Conditional triggers and actions
- Template-based rule creation

#### Phase 5: Habits
- Habit tracking with streaks
- Habit cards with progress visualization
- Daily habit completion tracking

#### Phase 6: Wellness
- Focus Mode with Pomodoro timer
- Interactive Pomodoro timer in Focus Mode
- Morning ritual component
- Evening shutdown routine
- MCII (Mental Contrasting with Implementation Intentions) flow
- Micro-commitment system for anti-procrastination

#### Phase 7: Collaboration
- Team workspace foundations
- Shared calendar capabilities

#### Authentication
- NextAuth.js integration
- Google OAuth provider
- GitHub OAuth provider
- Enterprise SSO (OIDC) support
- Demo mode for unauthenticated users

#### Internationalization
- Full i18n support (French and English)
- French accent corrections
- Bilingual landing page

#### User Experience
- Sunsama-style onboarding flow
- Quick-win 4-step onboarding
- Command palette with NLP quick capture
- Push notifications with Web Push API
- Voice input support
- Responsive design
- Theme support (light/dark mode)
- DPM Calendar branding and logos

#### Landing Page
- Professional landing page design
- Interactive mockups
- Persona-based feature tabs
- Google Calendar-inspired styling

### Fixed
- Prisma client generation for Vercel deployment
- TypeScript errors with ring color styling
- Task interface types (time fields)
- Duplicate "Suivant" buttons in onboarding
- TaskDetailModal click-away behavior
- Hydration issues with resizable panels

### Security
- Removed sensitive client secret files from tracking
- Secure token handling for OAuth providers

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2024-12 | Initial release with Phases 1-7 |
| Unreleased | - | Wave 3 (Chronotype, Focus, Experiments) |

## Links

- [Repository](https://github.com/ralphchrg/dpm-calendar)
- [Issues](https://github.com/ralphchrg/dpm-calendar/issues)
- [Roadmap](./ROADMAP.md)

[Unreleased]: https://github.com/ralphchrg/dpm-calendar/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ralphchrg/dpm-calendar/releases/tag/v0.1.0
