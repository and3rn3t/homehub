# HomeHub Documentation Index

**Last Updated**: October 16, 2025
**Total Documents**: 100+ files (organized into logical directories)
**Status**: ✅ Phase 1 Polish complete (UI/UX Enhancements) + Phase 6.1 + Mobile + Production hardening

---

## 🚀 Quick Start

**New to HomeHub?** Start here:

1. 📖 [Setup Quickstart](guides/SETUP_QUICKSTART.md) - Get running in 15 minutes
2. 🏗️ [Architecture Overview](guides/ARCHITECTURE.md) - Understand the system
3. 💻 [Best Practices](guides/BEST_PRACTICES.md) - Coding standards and patterns
4. 🎯 [Current Roadmap](development/NEXT_STEPS.md) - Planning Phase 4/5
5. 🎓 [Lessons Learned](development/LESSONS_LEARNED_OCT14_2025.md) - Oct 12-15 technical wins

---

## 📚 Documentation Structure

### 📁 Directory Organization

```
docs/
├── guides/               → Setup, integration, and reference guides
│   ├── setup/           → Getting started guides
│   ├── integration/     → Device/protocol integration
│   └── reference/       → Quick reference docs
├── development/         → Active development documentation
│   ├── milestones/      → Phase/milestone completions
│   ├── features/        → Feature implementations
│   ├── sessions/        → Dev session notes
│   └── fixes/           → Bug fix documentation
├── deployment/          → Production deployment guides
├── history/             → Phase 1-2 historical docs
└── archive/             → Archived/outdated documentation
    ├── planning/        → Old planning documents
    └── development/     → Completed phase work
```

---

## 🎯 Essential Core Documents

**Must-read documentation for all contributors:**

| Document                                       | Description                                | Status     |
| ---------------------------------------------- | ------------------------------------------ | ---------- |
| [ARCHITECTURE.md](guides/ARCHITECTURE.md)      | System design, data flow, Mermaid diagrams | ✅ Current |
| [BEST_PRACTICES.md](guides/BEST_PRACTICES.md)  | Coding standards, component patterns       | ✅ Current |
| [CONFIGURATION.md](guides/CONFIGURATION.md)    | Complete configuration reference           | ✅ Current |
| [NEXT_STEPS.md](development/NEXT_STEPS.md)     | Current roadmap and priorities (Phase 3)   | ✅ Current |
| [SECURITY.md](deployment/SECURITY.md)          | Security guidelines and best practices     | ✅ Current |
| [guides/README.md](guides/README.md)           | **NEW** - Guides navigation                | 🆕 NEW     |
| [development/README.md](development/README.md) | **NEW** - Development docs navigation      | 🆕 NEW     |

---

## �️ Setup & Configuration

**Getting started with HomeHub:**

| Document                                                    | Description                       | Status     |
| ----------------------------------------------------------- | --------------------------------- | ---------- |
| [SETUP_QUICKSTART.md](guides/setup/SETUP_QUICKSTART.md)     | Complete setup guide (15 minutes) | ✅ Current |
| [EXTENSIONS_GUIDE.md](guides/setup/EXTENSIONS_GUIDE.md)     | VS Code extensions                | ✅ Current |
| [GITHUB_TOKEN_SETUP.md](guides/setup/GITHUB_TOKEN_SETUP.md) | GitHub authentication             | ✅ Current |
| [CI_CD_SETUP.md](guides/setup/CI_CD_SETUP.md)               | CI/CD configuration               | ✅ Current |
| [CI_MONITORING.md](guides/setup/CI_MONITORING.md)           | CI monitoring and badges          | ✅ Current |

**Configuration references:**

| Document                                                                | Description                     | Status     |
| ----------------------------------------------------------------------- | ------------------------------- | ---------- |
| [CONFIGURATION.md](guides/CONFIGURATION.md)                             | Complete configuration guide    | ✅ Current |
| [CONFIGURATION_SYNC.md](guides/CONFIGURATION_SYNC.md)                   | Config synchronization patterns | ✅ Current |
| [CONFIGURATION_QUICKREF.md](guides/reference/CONFIGURATION_QUICKREF.md) | Quick config lookup             | ✅ Current |

---

## 🔌 Device Integration

**Connecting smart home devices:**

| Document                                                                        | Description                | Status     |
| ------------------------------------------------------------------------------- | -------------------------- | ---------- |
| [HTTP_ADAPTER_QUICKSTART.md](guides/integration/HTTP_ADAPTER_QUICKSTART.md)     | HTTP device integration    | ✅ Current |
| [MQTT_INTEGRATION_QUICKREF.md](guides/integration/MQTT_INTEGRATION_QUICKREF.md) | MQTT quick reference       | ✅ Current |
| [MQTT_QUICKREF.md](guides/integration/MQTT_QUICKREF.md)                         | MQTT commands and patterns | ✅ Current |

---

## 📖 Quick References

**Cheat sheets and fast lookups:**

| Document                                                                    | Description                  | Status     |
| --------------------------------------------------------------------------- | ---------------------------- | ---------- |
| [CONFIGURATION_QUICKREF.md](guides/reference/CONFIGURATION_QUICKREF.md)     | Config quick lookup          | ✅ Current |
| [EXTENSIONS_QUICKREF.md](guides/reference/EXTENSIONS_QUICKREF.md)           | Extensions cheat sheet       | ✅ Current |
| [VIRTUAL_DEVICES_QUICKREF.md](guides/reference/VIRTUAL_DEVICES_QUICKREF.md) | Testing with virtual devices | ✅ Current |
| [ICON_USAGE_GUIDE.md](guides/reference/ICON_USAGE_GUIDE.md)                 | Lucide icon system           | ✅ Current |
| [iOS_DESIGN_ENHANCEMENTS.md](guides/reference/iOS_DESIGN_ENHANCEMENTS.md)   | iOS design patterns          | ✅ Current |

---

## 🚀 Deployment

**Production deployment and CI/CD:**

| Document                                                                              | Description                    | Status      |
| ------------------------------------------------------------------------------------- | ------------------------------ | ----------- |
| [CLOUDFLARE_DEPLOYMENT.md](deployment/CLOUDFLARE_DEPLOYMENT.md)                       | Complete Cloudflare deployment | ✅ Current  |
| [PRODUCTION_DEPLOYMENT_OCT14_2025.md](deployment/PRODUCTION_DEPLOYMENT_OCT14_2025.md) | Latest deployment log          | ✅ Current  |
| [PRODUCTION_LOGGING_COMPLETE.md](deployment/PRODUCTION_LOGGING_COMPLETE.md)           | Logging setup                  | ✅ Complete |
| [SECURITY.md](deployment/SECURITY.md)                                                 | Security guidelines            | ✅ Current  |

---

## 🔬 Current Development (Phase 6.1 + Production Hardening)

**Active Phase 6.1, mobile optimization, and production fixes:**

| Document                                                                                                         | Description                             | Status      |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------- |
| [LESSONS_LEARNED_OCT14_2025.md](development/LESSONS_LEARNED_OCT14_2025.md)                                       | **Master lessons doc** (Oct 12-15 2025) | ✅ Current  |
| [NEXT_STEPS.md](development/NEXT_STEPS.md)                                                                       | Current roadmap and priorities          | ✅ Current  |
| [DASHBOARD_REFACTORING_OCT15_2025.md](development/DASHBOARD_REFACTORING_OCT15_2025.md)                           | 87% complexity reduction                | ✅ Complete |
| [LANDING_PAGE_OPTIMIZATION_COMPLETE_OCT15_2025.md](development/LANDING_PAGE_OPTIMIZATION_COMPLETE_OCT15_2025.md) | 96% bundle size reduction               | ✅ Complete |
| [ISSUE_RESOLUTION_SUMMARY_OCT15_2025.md](development/ISSUE_RESOLUTION_SUMMARY_OCT15_2025.md)                     | Production bug fixes                    | ✅ Complete |
| [MOBILE_OPTIMIZATION_COMPLETE.md](development/MOBILE_OPTIMIZATION_COMPLETE.md)                                   | iOS-focused enhancements                | ✅ Complete |
| [LIVE_STREAMING_COMPLETE.md](development/LIVE_STREAMING_COMPLETE.md)                                             | DASH/HLS streaming                      | ✅ Complete |
| [MILESTONE_6.1.3_COMPLETE.md](development/MILESTONE_6.1.3_COMPLETE.md)                                           | Video optimization                      | ✅ Complete |

---

## 🔬 Current Development (Phase 3)

**Active Phase 3 validation documentation:**

| Document                                                                         | Description                    | Status         |
| -------------------------------------------------------------------------------- | ------------------------------ | -------------- |
| [NEXT_STEPS.md](development/NEXT_STEPS.md)                                       | Current roadmap and priorities | ✅ Current     |
| [PHASE_3_PRODUCTION_VALIDATION.md](development/PHASE_3_PRODUCTION_VALIDATION.md) | Validation plan                | 🔄 In Progress |
| [PHASE_3_VALIDATION_STATUS.md](development/PHASE_3_VALIDATION_STATUS.md)         | Current status                 | � In Progress  |
| [TEST_SUITE_QUICKSTART.md](development/TEST_SUITE_QUICKSTART.md)                 | Testing quick reference        | ✅ Current     |
| [START_HERE_VALIDATION.md](development/START_HERE_VALIDATION.md)                 | Validation entry point         | ✅ Current     |

---

## � Development Documentation

### Milestones & Phases

**Completed milestones and phase summaries:**

| Document                                                                                                              | Phase   | Description                 | Status      |
| --------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------- | ----------- |
| [PHASE_3_COMPLETE.md](development/milestones/PHASE_3_COMPLETE.md)                                                     | Phase 3 | Automation engine complete  | ✅ Complete |
| [MILESTONE_3.1_SCHEDULER_COMPLETE.md](development/milestones/MILESTONE_3.1_SCHEDULER_COMPLETE.md)                     | 3.1     | Time-based scheduling       | ✅ Complete |
| [MILESTONE_3.2_CONDITION_EVALUATOR_COMPLETE.md](development/milestones/MILESTONE_3.2_CONDITION_EVALUATOR_COMPLETE.md) | 3.2     | Threshold monitoring        | ✅ Complete |
| [MILESTONE_3.3_ACTION_EXECUTOR_COMPLETE.md](development/milestones/MILESTONE_3.3_ACTION_EXECUTOR_COMPLETE.md)         | 3.3     | Device control actions      | ✅ Complete |
| [MILESTONE_3.4_FLOW_INTERPRETER_COMPLETE.md](development/milestones/MILESTONE_3.4_FLOW_INTERPRETER_COMPLETE.md)       | 3.4     | Visual flow interpreter     | ✅ Complete |
| [PHASE_2_COMPLETE_SUMMARY.md](development/milestones/PHASE_2_COMPLETE_SUMMARY.md)                                     | Phase 2 | Device integration complete | ✅ Complete |
| [MILESTONE_2.2.3_DISCOVERY_COMPLETE.md](development/milestones/MILESTONE_2.2.3_DISCOVERY_COMPLETE.md)                 | 2.2.3   | Device discovery            | ✅ Complete |
| [MILESTONE_2.2.4_COMPLETE.md](development/milestones/MILESTONE_2.2.4_COMPLETE.md)                                     | 2.2.4   | HTTP device control         | ✅ Complete |
| [MILESTONE_2.2.5_COMPLETE.md](development/milestones/MILESTONE_2.2.5_COMPLETE.md)                                     | 2.2.5   | Advanced discovery          | ✅ Complete |

_See [development/milestones/](development/milestones/) for all milestone documentation_

### Features Implemented

**Major feature implementations:**

| Document                                                                                            | Feature               | Status      |
| --------------------------------------------------------------------------------------------------- | --------------------- | ----------- |
| [PHASE_1_POLISH_UI_UX_ENHANCEMENTS.md](development/PHASE_1_POLISH_UI_UX_ENHANCEMENTS.md)            | UI/UX Polish (Oct 16) | 🆕 NEW      |
| [ENHANCEMENT_2_EMPTY_STATES_COMPLETE.md](development/ENHANCEMENT_2_EMPTY_STATES_COMPLETE.md)        | Empty state templates | ✅ Complete |
| [ENHANCEMENT_3_UNDO_REDO_COMPLETE.md](development/ENHANCEMENT_3_UNDO_REDO_COMPLETE.md)              | Undo/redo actions     | ✅ Complete |
| [ARLO_INTEGRATION_SUMMARY.md](development/features/ARLO_INTEGRATION_SUMMARY.md)                     | Arlo Cloud API        | ⚠️ Blocked  |
| [ARLO_CLOUDFLARE_BLOCKING.md](development/issues/ARLO_CLOUDFLARE_BLOCKING.md)                       | Arlo API blocker      | ✅ Updated  |
| [ARLO_OPTION_C_DEVELOPER_API.md](development/issues/ARLO_OPTION_C_DEVELOPER_API.md)                 | Arlo OAuth2 (DEAD)    | ❌ Archived |
| [DOORBELL_INTEGRATION.md](development/features/DOORBELL_INTEGRATION.md)                             | Doorbell system       | 🆕 NEW      |
| [DOORBELL_QUICKREF.md](development/features/DOORBELL_QUICKREF.md)                                   | Doorbell quick ref    | 🆕 NEW      |
| [DOORBELL_TEST_REPORT.md](development/features/DOORBELL_TEST_REPORT.md)                             | Doorbell testing      | 🆕 NEW      |
| [ADVANCED_HUE_FEATURES.md](development/features/ADVANCED_HUE_FEATURES.md)                           | Hue integration       | ✅ Complete |
| [COLOR_CONTROLS_COMPLETE.md](development/features/COLOR_CONTROLS_COMPLETE.md)                       | Color picker          | ✅ Complete |
| [DARK_MODE_IMPLEMENTATION_OCT_2025.md](development/features/DARK_MODE_IMPLEMENTATION_OCT_2025.md)   | Dark mode             | ✅ Complete |
| [LUCIDE_MIGRATION_COMPLETE.md](development/features/LUCIDE_MIGRATION_COMPLETE.md)                   | Icon system           | ✅ Complete |
| [CI_CD_INTEGRATION_COMPLETE.md](development/features/CI_CD_INTEGRATION_COMPLETE.md)                 | CI/CD pipeline        | ✅ Complete |
| [VALIDATION_INFRASTRUCTURE_COMPLETE.md](development/features/VALIDATION_INFRASTRUCTURE_COMPLETE.md) | Test infrastructure   | ✅ Complete |

_See [development/features/](development/features/) for all feature documentation_

### Development Sessions

**Session notes and test results:**

| Document                                                                                            | Type    | Status      |
| --------------------------------------------------------------------------------------------------- | ------- | ----------- |
| [PHASE_2_POLISH_SESSION_3_DRAG_DROP.md](development/sessions/PHASE_2_POLISH_SESSION_3_DRAG_DROP.md) | Polish  | ✅ Complete |
| [DISCOVERY_TEST_RESULTS.md](development/sessions/DISCOVERY_TEST_RESULTS.md)                         | Testing | ✅ Complete |
| [HUE_ADAPTER_TEST_RESULTS.md](development/sessions/HUE_ADAPTER_TEST_RESULTS.md)                     | Testing | ✅ Complete |

_See [development/sessions/](development/sessions/) for all session documentation_

### Bug Fixes

**Bug fixes and patches:**

| Document                                                                     | Fix               | Status   |
| ---------------------------------------------------------------------------- | ----------------- | -------- |
| [INFINITE_LOOP_FIX_FINAL.md](development/fixes/INFINITE_LOOP_FIX_FINAL.md)   | Infinite loop     | ✅ Fixed |
| [DEVICE_ACCESSIBILITY_FIX.md](development/fixes/DEVICE_ACCESSIBILITY_FIX.md) | Device visibility | ✅ Fixed |
| [TYPESCRIPT_ERRORS_FIXED.md](development/fixes/TYPESCRIPT_ERRORS_FIXED.md)   | TypeScript        | ✅ Fixed |

_See [development/fixes/](development/fixes/) for all bug fix documentation_

---

## � Historical Documentation

### Phase 1: Foundation (✅ Complete)

### 🔐 Phase 5: Security & Surveillance (� Active - Your Setup)

**IP cameras, smart locks, and security system:**

| Document                                                                   | Description                                        | Status     |
| -------------------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| [PHASE_5_SECURITY_PLAN.md](development/PHASE_5_SECURITY_PLAN.md)           | **Master plan** - 5 milestones, 10 weeks           | ✅ Current |
| [PHASE_5_QUICK_START.md](development/PHASE_5_QUICK_START.md)               | **Quick start guide** - Hardware & setup           | ✅ Current |
| [PHASE_5_YOUR_HARDWARE.md](development/PHASE_5_YOUR_HARDWARE.md)           | **YOUR SETUP** - 2 Eufy PTZ + 3 Arlo cameras       | 🆕 NEW     |
| [PHASE_5_YOUR_SETUP_SUMMARY.md](development/PHASE_5_YOUR_SETUP_SUMMARY.md) | **Quick reference** - Your 5-camera implementation | 🆕 NEW     |

**Your Hardware** (Already Owned):

- 2x Eufy PTZ cameras (Pan-Tilt-Zoom)
- 3x Arlo cameras
- **Total**: 5 cameras (~$500-800 value)
- **Cost**: $0 (hardware owned!) + $60-100 (storage)

**Your Implementation Path**:

1. 🏠 Home Assistant Bridge (recommended)
2. 🔌 Eufy Security WS integration (HACS)
3. 📷 Arlo built-in integration
4. 🌐 WebRTC/HLS streaming proxy
5. 🎨 HomeHub 5-camera grid view

**Timeline**: 3-4 weeks (26-36 hours)

**Original Milestones** (Generic):

1. 📷 Camera Integration (20-30h) - RTSP/ONVIF, live streaming
   **Phase 1 foundation documentation:**

| Document                                                                   | Description                 | Status       |
| -------------------------------------------------------------------------- | --------------------------- | ------------ |
| [PHASE_1_COMPLETE.md](history/PHASE_1_COMPLETE.md)                         | Phase 1 summary             | ✅ Complete  |
| [PHASE_1.3_ANIMATIONS.md](history/PHASE_1.3_ANIMATIONS.md)                 | Spring animation patterns   | ✅ Reference |
| [PHASE_1.3_LOADING_STATES.md](history/PHASE_1.3_LOADING_STATES.md)         | Skeleton loaders & spinners | ✅ Reference |
| [PHASE_1.3.4_ERROR_BOUNDARIES.md](history/PHASE_1.3.4_ERROR_BOUNDARIES.md) | Error handling patterns     | ✅ Reference |
| [PHASE_1.3.5_RESPONSIVE.md](history/PHASE_1.3.5_RESPONSIVE.md)             | Responsive design guide     | ✅ Reference |

_See [history/](history/) for complete Phase 1 documentation_

### Phase 2: Device Integration (✅ Complete)

**Phase 2 historical documentation:**

| Document                                                                          | Description     | Status      |
| --------------------------------------------------------------------------------- | --------------- | ----------- |
| [PHASE_2_COMPLETE_SUMMARY.md](development/milestones/PHASE_2_COMPLETE_SUMMARY.md) | Phase 2 summary | ✅ Complete |

_See [archive/development/phase-2/](archive/development/phase-2/) for detailed Phase 2 work_

---

## 📦 Archived Documentation

**Old planning documents and completed work:**

- **[archive/planning/](archive/planning/)** - Old planning and status documents
- **[archive/development/phase-2/](archive/development/phase-2/)** - Completed Phase 2 work
- **[history/](history/)** - Phase 1 and Phase 2 historical documentation

---

## 🔍 Finding Documentation

### By Topic

- **Setup**: Start with [guides/setup/SETUP_QUICKSTART.md](guides/setup/SETUP_QUICKSTART.md)
- **Device Integration**: See [guides/integration/](guides/integration/)
- **Current Work**: See [development/NEXT_STEPS.md](development/NEXT_STEPS.md)
- **Architecture**: Read [guides/ARCHITECTURE.md](guides/ARCHITECTURE.md)
- **Deployment**: See [deployment/CLOUDFLARE_DEPLOYMENT.md](deployment/CLOUDFLARE_DEPLOYMENT.md)

### By Status

- ✅ **Current** - Active, up-to-date documentation
- 🔄 **In Progress** - Work currently underway
- ✅ **Complete** - Finished work, reference material
- ✅ **Reference** - Historical but still useful
- 📚 **Archive** - Historical context only

---

## 📊 Documentation Statistics

**Last Reorganization**: October 13, 2025 (Phase 3)

### File Counts

- **Root docs/**: 5 essential files (INDEX, README, PRD, etc.)
- **guides/**: 4 core + 3 subdirectories (17 total)
- **development/**: 6 active + 4 subdirectories (~90 organized)
- **archive/**: 22+ historical documents

### Organization Benefits

- ✅ **98 → 6 active files** in development/
- ✅ **Clear directory structure** (by purpose)
- ✅ **Easy navigation** (README in each directory)
- ✅ **Preserved history** (git rename tracking)
- ✅ **No broken links** (all paths updated)

---

## 🔄 Recent Updates

### October 13, 2025

- ✅ **Phase 3 Reorganization**: Major directory restructuring
  - Created subdirectories: milestones/, features/, sessions/, fixes/
  - Archived Phase 2 completed work
  - Added navigation READMEs
- ✅ **Phase 2 Consolidation**: Reduced Next Steps variants (4 → 1)
- ✅ **Phase 1 Archive**: Moved old planning docs to archive/

### October 12, 2025

- ✅ **CI/CD Complete**: Coverage badges, automated testing
- ✅ **Markdownlint Setup**: Linting with auto-fix

### October 11-13, 2025

- ✅ **Phase 3 Automation Engine**: All 5 milestones complete
- ✅ **Production Validation**: Test infrastructure established

---

## 🎯 Next Phase Options

**Choose your adventure (see [NEXT_STEPS.md](development/NEXT_STEPS.md)):**

1. **Phase 4: Energy Monitoring** - Power tracking, cost analysis, insights
2. **Phase 5: Security & Cameras** - Video surveillance, access control
3. **Phase 6: Multi-User** - Authentication, roles, permissions

---

_For the complete documentation catalog, see the directory READMEs in [guides/](guides/) and [development/](development/)_

**Future work and consolidation plans:**

| Document                                                         | Description                 | Status     |
| ---------------------------------------------------------------- | --------------------------- | ---------- |
| [NEXT_STEPS.md](NEXT_STEPS.md)                                   | Roadmap and next priorities | ✅ Current |
| [DOCUMENTATION_CONSOLIDATION.md](DOCUMENTATION_CONSOLIDATION.md) | **Doc consolidation plan**  | 🆕 NEW     |

---

## 🔍 Finding Documentation

### By Task

## 📝 Quick Navigation

### "I want to..."

- **Get started** → [SETUP_QUICKSTART.md](guides/setup/SETUP_QUICKSTART.md)
- **Understand the architecture** → [ARCHITECTURE.md](guides/ARCHITECTURE.md)
- **Deploy to production** → [CLOUDFLARE_DEPLOYMENT.md](deployment/CLOUDFLARE_DEPLOYMENT.md)
- **Configure the app** → [CONFIGURATION.md](guides/CONFIGURATION.md)
- **Integrate devices** → [HTTP_ADAPTER_QUICKSTART.md](guides/integration/HTTP_ADAPTER_QUICKSTART.md)
- **Test with virtual devices** → [VIRTUAL_DEVICES_QUICKREF.md](guides/reference/VIRTUAL_DEVICES_QUICKREF.md)
- **Build automations** → [PHASE_3_COMPLETE.md](development/milestones/PHASE_3_COMPLETE.md)
- **Check current work** → [NEXT_STEPS.md](development/NEXT_STEPS.md)

### By Role

**New Contributors**:

1. [SETUP_QUICKSTART.md](guides/setup/SETUP_QUICKSTART.md) - 15 min setup
2. [ARCHITECTURE.md](guides/ARCHITECTURE.md) - 30 min system overview
3. [BEST_PRACTICES.md](guides/BEST_PRACTICES.md) - 20 min patterns
4. [NEXT_STEPS.md](development/NEXT_STEPS.md) - Current priorities

**Testers**:

1. [TEST_SUITE_QUICKSTART.md](development/TEST_SUITE_QUICKSTART.md) - Testing overview
2. [VIRTUAL_DEVICES_QUICKREF.md](guides/reference/VIRTUAL_DEVICES_QUICKREF.md) - Test helpers
3. [development/sessions/](development/sessions/) - Test results

**Deployers**:

1. [CLOUDFLARE_DEPLOYMENT.md](deployment/CLOUDFLARE_DEPLOYMENT.md) - Full deployment guide
2. [SECURITY.md](deployment/SECURITY.md) - Security checklist

---

## 🔗 External Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [React 19 Documentation](https://react.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 📝 Document Maintenance

**Last Major Update**: October 12, 2025
**Recent Additions**: Phase 3 Complete, Phase 5 Planning
**Consolidation Status**: 📋 Planning phase
**Next Review**: After Phase 5.1 completion

**To Add New Documentation**:

1. Choose appropriate directory (guides/, development/, deployment/, etc.)
2. Create file following naming conventions (PascalCase for docs)
3. Update relevant README.md (guides/README.md or development/README.md)
4. Update this INDEX.md if document is essential
5. Follow [BEST_PRACTICES.md](guides/BEST_PRACTICES.md) formatting standards

**To Archive Documentation**:

1. Move to `docs/archive/` (with appropriate subdirectory)
2. Update source directory README.md
3. Update this index if document was listed
4. Preserve git history (use `git mv`)

**After Reorganization**:

- Documentation is now organized by purpose
- Each directory has navigation README
- Essential docs listed in this index
- Full catalog available in directory READMEs

---

## 🙏 Contributing

Found outdated documentation? Have suggestions?

1. Check [development/NEXT_STEPS.md](development/NEXT_STEPS.md) for current priorities
2. Review directory READMEs for organization structure
3. Follow [BEST_PRACTICES.md](guides/BEST_PRACTICES.md) for standards
4. Create PR with clear description of changes

---

**Document Version**: 2.0 (Phase 3 Reorganization)
**Last Updated**: October 13, 2025
**Status**: ✅ Active - Master documentation index
