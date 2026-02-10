# Rachgia Dashboard React Migration Plan

## Executive Summary

This document outlines the comprehensive plan to migrate the Rachgia Factory Production Management Dashboard from vanilla JavaScript (v19) to a modern React application with Google Sheets integration and Firebase Cloud Functions.

**Source Reference**: `/Users/ksmoon/Coding/return-dashboard` - Production React app with proven architecture
**Target Project**: `/Users/ksmoon/Coding/오더 현황 분석` - Current vanilla JS dashboard

**Migration Goals**:
1. Modern React architecture with TypeScript-ready structure
2. Google Sheets API integration for real-time data
3. Firebase Cloud Functions for 30-minute auto-refresh
4. 3-tier caching strategy (Memory -> localStorage -> Firestore)
5. Role-based authentication system
6. Improved maintainability and testability

---

## Phase 1: Architecture Analysis

### 1.1 Return-Dashboard Architecture (Reference)

```
return-dashboard/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   │   ├── overview/     # Overview tab components
│   │   │   └── aiInsights/   # AI analysis components
│   │   ├── comparison/       # Comparison view components
│   │   ├── feedback/         # Feedback loop components
│   │   └── report/           # Report generation
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.jsx   # Authentication & RBAC
│   │   └── DashboardContext.jsx # Dashboard state management
│   ├── pages/                # Page-level components
│   ├── services/             # API & data services
│   │   ├── firebase.js       # Firebase initialization
│   │   ├── firestoreCache.js # 3-tier caching
│   │   └── sheetsApi.js      # Google Sheets API client
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── constants/            # Configuration constants
│   └── i18n/                 # Internationalization
├── functions/                # Firebase Cloud Functions
│   └── index.js              # Scheduled cache refresh
└── public/                   # Static assets
```

### 1.2 Key Patterns from Return-Dashboard

#### 3-Tier Caching Strategy (firestoreCache.js)
```javascript
// Priority order: Memory Cache -> localStorage -> Firestore
// 1. Memory cache: 5 minutes TTL (same session)
// 2. localStorage: 60 minutes TTL (offline support)
// 3. Firestore: 35 minutes TTL (cloud backup)

const MEMORY_CACHE_TTL = 5 * 60 * 1000;     // 5 minutes
const LOCAL_CACHE_TTL = 60 * 60 * 1000;     // 60 minutes
const CACHE_TTL_MS = 35 * 60 * 1000;        // 35 minutes (Firestore)
```

#### Multi-Factory Configuration
```javascript
export const FACTORY_CONFIG = {
  FACTORY_A: {
    id: 'FACTORY_A',
    name: 'Factory A',
    spreadsheetId: 'SPREADSHEET_ID',
    sheetName: 'Data Sheet',
    filterColumn: 'Factory',
    filterValue: 'A',
    active: true
  },
  // ... more factories
};
```

#### Cloud Functions Auto-Refresh (functions/index.js)
```javascript
// 30-minute scheduled cache refresh
exports.scheduledCacheRefresh = onSchedule(
  { schedule: "*/30 * * * *", timeZone: "Asia/Ho_Chi_Minh" },
  async () => { /* refresh all factory caches */ }
);
```

### 1.3 Current Rachgia Dashboard Features

#### Tabs/Views to Migrate
| Tab ID | Description | Priority |
|--------|-------------|----------|
| monthlyTab | Monthly overview with KPIs | P0 |
| destinationTab | Destination analysis | P1 |
| modelTab | Model-wise breakdown | P1 |
| factoryTab | Factory A/B/C/D comparison | P0 |
| vendorTab | Outsole vendor analysis | P1 |
| heatmapTab | Process heatmap visualization | P2 |
| dataTab | Raw data table with filters | P0 |
| orderSearchTab | Order search functionality | P1 |
| monitoringTab | Production monitoring | P1 |
| taskAssignmentTab | Task assignment | P2 |
| taskResultTab | Task results | P2 |
| settingsTab | Settings & configuration | P1 |

#### Key Business Logic (OrderModel.js)
```javascript
// Ground Truth for delay calculation
isDelayed(d)  // SDD > CRD && !shipped && !code04
isWarning(d)  // CRD - SDD between 0-3 days
isCritical(d) // CRD within 3 days from today
isShipped(d)  // WH_OUT completed >= quantity
```

#### Production Process Flow
```
S_CUT -> PRE_SEW -> SEW_INPUT -> SEW_BAL -> OSC -> ASS -> WH_IN -> WH_OUT
(재단)   (선봉)    (재봉투입)    (재봉)    (외주)  (조립)  (입고)   (출고)
```

---

## Phase 2: React App Structure

### 2.1 Proposed Directory Structure

```
react-app/
├── public/
│   ├── index.html
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # App icons
├── src/
│   ├── main.jsx                # Entry point
│   ├── App.jsx                 # Root component with routing
│   │
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Shared components
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── FilterChip.jsx
│   │   │   └── Toast.jsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Layout.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MobileMenu.jsx
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── KPICard.jsx
│   │   │   ├── ProcessFunnel.jsx
│   │   │   ├── ProcessTimeline.jsx
│   │   │   └── ProgressBar.jsx
│   │   ├── charts/             # Chart components
│   │   │   ├── FactoryComparisonChart.jsx
│   │   │   ├── MonthlyTrendChart.jsx
│   │   │   ├── DestinationPieChart.jsx
│   │   │   ├── VendorScoreChart.jsx
│   │   │   └── ProcessHeatmap.jsx
│   │   ├── tables/             # Table components
│   │   │   ├── DataTable.jsx
│   │   │   ├── SortableHeader.jsx
│   │   │   └── MobileCard.jsx
│   │   └── modals/             # Modal components
│   │       ├── OrderDetailModal.jsx
│   │       ├── FilterModal.jsx
│   │       └── SettingsModal.jsx
│   │
│   ├── pages/                  # Page components (route targets)
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── Login.jsx           # Authentication
│   │   ├── MonthlyOverview.jsx # Monthly tab
│   │   ├── DestinationAnalysis.jsx
│   │   ├── ModelAnalysis.jsx
│   │   ├── FactoryComparison.jsx
│   │   ├── VendorAnalysis.jsx
│   │   ├── ProcessHeatmap.jsx
│   │   ├── DataExplorer.jsx    # Raw data table
│   │   ├── OrderSearch.jsx
│   │   ├── Monitoring.jsx
│   │   ├── TaskManagement.jsx
│   │   └── Settings.jsx
│   │
│   ├── contexts/               # React Context
│   │   ├── AuthContext.jsx     # Authentication & RBAC
│   │   └── DashboardContext.jsx # Dashboard state
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useOrders.js        # Order data fetching
│   │   ├── useFilters.js       # Filter state management
│   │   ├── useCharts.js        # Chart data preparation
│   │   ├── useFactories.js     # Factory-specific data
│   │   └── usePagination.js    # Pagination logic
│   │
│   ├── services/               # API & data services
│   │   ├── firebase.js         # Firebase initialization
│   │   ├── firestoreCache.js   # 3-tier caching
│   │   ├── sheetsApi.js        # Google Sheets API
│   │   └── orderService.js     # Order data processing
│   │
│   ├── utils/                  # Utility functions
│   │   ├── dateUtils.js        # Date parsing & formatting
│   │   ├── orderUtils.js       # Order state calculations
│   │   ├── formatters.js       # Number/string formatting
│   │   ├── validators.js       # Input validation
│   │   └── exportUtils.js      # Excel/PDF export
│   │
│   ├── constants/              # Configuration
│   │   ├── factories.js        # Factory configuration
│   │   ├── processes.js        # Production process definitions
│   │   ├── destinations.js     # Important destinations
│   │   └── auth.js             # Role definitions
│   │
│   └── i18n/                   # Internationalization
│       ├── index.js            # i18n setup
│       └── locales/
│           ├── ko.json
│           ├── en.json
│           └── vi.json
│
├── functions/                  # Firebase Cloud Functions
│   ├── index.js                # Main functions file
│   └── package.json
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firebase.json
├── firestore.rules
└── .env.example
```

### 2.2 Component Mapping (Old to New)

| Vanilla JS Function/Element | React Component | Notes |
|------------------------------|-----------------|-------|
| renderKPIs() | KPICard | 4 KPI cards |
| renderProcessFunnel() | ProcessFunnel | Process flow visualization |
| renderProcessTimeline() | ProcessTimeline | Timeline view |
| renderTable() | DataTable | Main data table |
| renderMobileCard() | MobileCard | Mobile responsive card |
| renderFactoryChart() | FactoryComparisonChart | Factory comparison |
| renderMonthlyChart() | MonthlyTrendChart | Monthly trends |
| switchTab() | React Router | Tab navigation via routes |
| applyFilters() | useFilters hook | Filter state management |
| showModal() | OrderDetailModal | Modal dialogs |
| Filter chips | FilterChip | Filter UI components |
| Pagination | Pagination | Page navigation |
| Settings | Settings page | Configuration |

---

## Phase 3: Service Layer Design

### 3.1 Firebase Configuration (firebase.js)

```javascript
// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 3.2 Google Sheets API Integration (sheetsApi.js)

```javascript
// src/services/sheetsApi.js

// Factory configuration for Rachgia (A, B, C, D factories)
export const FACTORY_CONFIG = {
  FACTORY_A: {
    id: 'FACTORY_A',
    name: 'Factory A',
    shortName: 'A',
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    sheetName: 'Factory A Data',
    filterColumn: 'Factory',
    filterValue: 'A',
    active: true
  },
  FACTORY_B: { /* ... */ },
  FACTORY_C: { /* ... */ },
  FACTORY_D: { /* ... */ },
  ALL_FACTORIES: {
    id: 'ALL_FACTORIES',
    name: 'All Factories',
    isAggregate: true,
    active: true
  }
};

// Main API class
export class SheetsAPI {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.currentFactory = 'ALL_FACTORIES';
  }

  setFactory(factoryId) {
    this.currentFactory = factoryId;
  }

  async fetchAllData() {
    // Fetch from Firestore cache first
    // Fall back to direct Sheets API if needed
  }
}
```

### 3.3 3-Tier Caching (firestoreCache.js)

```javascript
// src/services/firestoreCache.js

const MEMORY_CACHE_TTL = 5 * 60 * 1000;     // 5 minutes
const LOCAL_CACHE_TTL = 60 * 60 * 1000;     // 60 minutes
const FIRESTORE_CACHE_TTL = 35 * 60 * 1000; // 35 minutes
const CACHE_VERSION = 1;

const memoryCache = new Map();

// Main cache function - cascading priority
export async function getCachedData(factoryId) {
  // 1. Check memory cache
  // 2. Check localStorage
  // 3. Fetch from Firestore
  // 4. Background refresh
}
```

---

## Phase 4: Authentication & RBAC

### 4.1 User Roles

```javascript
// src/constants/auth.js

export const USER_ROLES = {
  'admin@rachgia.com': {
    role: 'admin',
    displayName: 'Administrator',
    factories: ['ALL_FACTORIES']
  },
  'manager.a@rachgia.com': {
    role: 'factory_manager',
    displayName: 'Factory A Manager',
    restrictedFactory: 'FACTORY_A'
  },
  'supervisor@rachgia.com': {
    role: 'supervisor',
    displayName: 'Production Supervisor',
    factories: ['ALL_FACTORIES']
  },
  'viewer@rachgia.com': {
    role: 'viewer',
    displayName: 'Viewer',
    dashboardOnly: true
  }
};

export const ROLE_PERMISSIONS = {
  admin: {
    canViewAllFactories: true,
    canEditSettings: true,
    canExportData: true,
    canManageTasks: true
  },
  factory_manager: {
    canViewAllFactories: false,
    canEditSettings: false,
    canExportData: true,
    canManageTasks: true
  },
  supervisor: {
    canViewAllFactories: true,
    canEditSettings: false,
    canExportData: true,
    canManageTasks: false
  },
  viewer: {
    canViewAllFactories: true,
    canEditSettings: false,
    canExportData: false,
    canManageTasks: false
  }
};
```

---

## Phase 5: Step-by-Step Implementation Guide

### Step 1: Project Setup (Day 1-2)

```bash
# Create Vite project
npm create vite@latest rachgia-react -- --template react

# Install dependencies
npm install react-router-dom firebase recharts i18next react-i18next
npm install xlsx lucide-react tailwindcss postcss autoprefixer

# Install dev dependencies
npm install -D @vitejs/plugin-react vitest @testing-library/react
```

**Tasks**:
- [ ] Initialize Vite React project
- [ ] Configure Tailwind CSS
- [ ] Set up Firebase project
- [ ] Configure environment variables
- [ ] Create basic folder structure

### Step 2: Core Services (Day 3-5)
- [ ] Implement firebase.js
- [ ] Implement firestoreCache.js
- [ ] Implement sheetsApi.js
- [ ] Port OrderModel.js business logic

### Step 3: Context & State (Day 6-7)
- [ ] Implement AuthContext.jsx
- [ ] Implement DashboardContext.jsx
- [ ] Create authentication flow
- [ ] Set up routing structure

### Step 4: Common Components (Day 8-10)
- [ ] Create Layout.jsx
- [ ] Implement ErrorBoundary.jsx
- [ ] Create Pagination.jsx
- [ ] Implement FilterChip.jsx

### Step 5: Dashboard Components (Day 11-14)
- [ ] Create KPICard.jsx
- [ ] Implement ProcessFunnel.jsx
- [ ] Create ProgressBar.jsx

### Step 6: Chart Components (Day 15-18)
- [ ] Create FactoryComparisonChart.jsx
- [ ] Implement MonthlyTrendChart.jsx
- [ ] Create ProcessHeatmap.jsx

### Step 7: Table Components (Day 19-22)
- [ ] Create DataTable.jsx
- [ ] Implement SortableHeader.jsx
- [ ] Create MobileCard.jsx

### Step 8: Page Components (Day 23-28)
- [ ] Create Dashboard.jsx
- [ ] Implement DataExplorer.jsx
- [ ] Create remaining analysis pages

### Step 9: Cloud Functions (Day 29-30)
- [ ] Set up Firebase Functions
- [ ] Implement scheduledCacheRefresh
- [ ] Deploy and test functions

### Step 10: Testing & Optimization (Day 31-35)
- [ ] Write unit tests
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## Phase 6: Effort Estimation

| Component Category | Components | Estimated Hours |
|-------------------|------------|-----------------|
| Project Setup | Config, structure | 8 |
| Core Services | firebase, cache, sheets | 24 |
| Contexts | Auth, Dashboard | 16 |
| Common Components | 6 components | 20 |
| Dashboard Components | 4 components | 16 |
| Chart Components | 5 components | 25 |
| Table Components | 3 components | 20 |
| Page Components | 12 pages | 48 |
| Cloud Functions | 2 functions | 12 |
| Testing | Unit + Integration | 24 |
| Documentation | README, API docs | 8 |
| Buffer | Bug fixes, polish | 20 |
| **Total** | | **241 hours** |

**Estimated Timeline**: 6-8 weeks with 1 developer

---

## Phase 7: Data Migration Strategy

### 7.1 Current Data Structure

```javascript
// From rachgia_data_v8.js
{
  factory: "A",
  unit: "RAF.01-SEW RA.01",
  season: "SS26",
  model: "Tensaur Sport 2.0 CF I",
  article: "AB7-GW6468",
  color: "FTWR WHITE/TEAM RE",
  destination: "Saudi Arabia",
  quantity: 840,
  poNumber: "S11/5",
  crd: "2026-01-15",           // Customer Required Date
  sddValue: "2025-12-13",      // Scheduled Delivery Date
  code04: null,                // Official SDD change approval
  outsoleVendor: "HVC NT",
  production: {
    s_cut: { completed: 840, pending: 0, status: "completed" },
    pre_sew: { completed: 840, pending: 0, status: "completed" },
    sew_input: { completed: 840, pending: 0, status: "completed" },
    sew_bal: { completed: 840, pending: 0, status: "completed" },
    s_fit: { completed: 840, pending: 0, status: "completed" },
    ass_bal: { completed: 840, pending: 0, status: "completed" },
    wh_in: { completed: 840, pending: 0, status: "completed" },
    wh_out: { completed: 0, pending: 840, status: "pending" }
  },
  remaining: { osc: 0, sew: 0, ass: 0, whIn: 0, whOut: 840 }
}
```

### 7.2 Firestore Cache Structure

```javascript
// Firestore collection: productionCache
// Document: FACTORY_A, FACTORY_B, etc.
{
  factoryId: "FACTORY_A",
  factoryName: "Factory A",
  updatedAt: Timestamp,

  statistics: {
    totalOrders: 1250,
    totalQuantity: 125000,
    completedQuantity: 98500,
    delayedOrders: 45,
    warningOrders: 23,
    delayRate: "3.6%",
    completionRate: "78.8%"
  },

  dailyData: [
    { date: "2026-01-15", orders: 25, quantity: 5000, completed: 4200 }
  ],

  modelData: [
    { model: "Tensaur Sport", orders: 150, quantity: 15000, delayRate: "2.5%" }
  ],

  processData: {
    s_cut: { completed: 95000, pending: 5000, rate: 95 },
    // ... other processes
  }
}
```

---

## Appendix A: Environment Variables

```bash
# .env.example

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Sheets API
VITE_GOOGLE_API_KEY=your-google-api-key
VITE_GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# Feature Flags
VITE_ENABLE_GOOGLE_DRIVE=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_CACHE_TTL_MINUTES=35
```

---

## Appendix B: Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google Sheets API limits | High | Aggressive caching, batch requests |
| Firebase costs | Medium | Monitor usage, budget alerts |
| Data sync delays | Medium | Clear UI indicators, manual refresh |
| Mobile performance | Medium | Virtual scrolling, lazy loading |
| Browser compatibility | Low | Test on major browsers, polyfills |

---

*Document Version: 1.0*
*Created: 2026-02-02*
*Author: Migration Analysis Agent*
