# DPM Calendar Roadmap

Public roadmap for DPM Calendar development. This document outlines planned features and milestones.

> **Note**: This roadmap is subject to change based on user feedback and priorities.

---

## Version Overview

| Version | Theme | Status | Target |
|---------|-------|--------|--------|
| v0.1.0 | Foundation | ✅ Released | 2024-Q4 |
| v0.2.0 | Focus & Energy | 🚧 In Progress | 2025-Q1 |
| v0.3.0 | Intelligence | 📋 Planned | 2025-Q2 |
| v1.0.0 | Production Ready | 📋 Planned | 2025-Q3 |
| v1.5.0 | Teams & Collaboration | 📋 Planned | 2025-Q4 |
| v2.0.0 | AI-Native Experience | 🔮 Future | 2026 |

---

## v0.1.0 — Foundation ✅

**Theme**: Core productivity features

### Completed
- [x] Calendar with day/week/month views
- [x] Google Calendar OAuth sync
- [x] Task management with drag & drop
- [x] Habit tracking with streaks
- [x] Dashboard with heatmap
- [x] Focus Mode with Pomodoro timer
- [x] Morning ritual component
- [x] Internationalization (FR/EN)
- [x] Authentication (Google, GitHub, OIDC)
- [x] Sunsama-style onboarding
- [x] Push notifications

---

## v0.2.0 — Focus & Energy 🚧

**Theme**: Energy-aware productivity

### In Progress
- [x] Chronotype quiz (12-question MEQ)
- [x] Energy-aware scheduling
- [x] Focus timer engine with persistence
- [x] Focus task picker
- [x] Focus progress ring with streaks
- [x] CBT reframing for procrastination
- [x] Priority cap enforcement
- [x] Meeting load management
- [x] N-of-1 experiment lab
- [x] Morning ritual enhancements
- [x] Shutdown routine with gratitude
- [ ] Quick capture with NLP (chrono-node)
- [ ] MCII goal visualization flow

### Planned
- [ ] Energy overlay on calendar
- [ ] Smart task suggestions based on energy
- [ ] Distraction tracking
- [ ] Focus session analytics

---

## v0.3.0 — Intelligence 📋

**Theme**: AI-powered assistance

### Planned Features

#### Smart Scheduling
- [ ] AI auto-scheduler for tasks
- [ ] Conflict detection and resolution
- [ ] Buffer time recommendations
- [ ] Meeting prep reminders

#### Natural Language
- [ ] NLP task creation ("Add meeting with John tomorrow at 2pm")
- [ ] Voice commands (Web Speech API)
- [ ] Smart search across all content

#### Insights
- [ ] Weekly productivity reports
- [ ] Pattern recognition (best focus times)
- [ ] Burnout risk detection
- [ ] Personalized recommendations

---

## v1.0.0 — Production Ready 📋

**Theme**: Stability and polish

### Stability
- [ ] 80%+ test coverage
- [ ] End-to-end tests with Playwright
- [ ] Performance optimization (<3s LCP)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Error monitoring (Sentry)

### Polish
- [ ] Keyboard shortcuts guide
- [ ] Onboarding improvements
- [ ] Empty state designs
- [ ] Loading skeletons
- [ ] Offline support (PWA)

### Infrastructure
- [ ] Database backups automation
- [ ] CDN for static assets
- [ ] Rate limiting
- [ ] API versioning

---

## v1.5.0 — Teams & Collaboration 📋

**Theme**: Multi-user workspaces

### Team Features
- [ ] Team workspaces
- [ ] Shared calendars
- [ ] Task assignment
- [ ] Team availability view
- [ ] Meeting scheduling (Calendly-like)

### Communication
- [ ] In-app notifications
- [ ] Email digests
- [ ] Slack integration
- [ ] MS Teams integration

### Admin
- [ ] Team admin dashboard
- [ ] User management
- [ ] Role-based permissions
- [ ] Activity audit logs

---

## v2.0.0 — AI-Native Experience 🔮

**Theme**: Next-generation productivity

### AI Features
- [ ] AI assistant (chat interface)
- [ ] Automatic task breakdown
- [ ] Smart prioritization
- [ ] Context-aware suggestions
- [ ] Meeting transcription & summaries

### Advanced Integrations
- [ ] Notion sync
- [ ] Linear/Jira sync
- [ ] Email integration (Gmail/Outlook)
- [ ] Browser extension

### Platform
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron/Tauri)
- [ ] API for third-party integrations
- [ ] Webhooks

---

## Feature Requests

Want to suggest a feature?

1. Check [existing issues](https://github.com/ralphchrg/dpm-calendar/issues)
2. Open a new [feature request](https://github.com/ralphchrg/dpm-calendar/issues/new?template=feature_request.md)
3. Join the [discussion](https://github.com/ralphchrg/dpm-calendar/discussions)

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

---

## Contributing

Interested in contributing to a roadmap item? See [CONTRIBUTING.md](./CONTRIBUTING.md).

Priority labels:
- **P0**: Critical path, current sprint
- **P1**: Important, next sprint
- **P2**: Nice to have, backlog

---

*Last updated: 2024-04-05*
