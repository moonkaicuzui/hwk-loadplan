/**
 * @fileoverview Dashboard State Management Context
 * Centralized state management for dashboard data and UI state.
 *
 * Features:
 * - Reducer-based state management
 * - Caching with validity checks
 * - Action creators for state updates
 * - Filter and UI state management
 *
 * @module contexts/DashboardContext
 */

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// ========================================
// Initial State
// ========================================

const initialState = {
  // Data state
  allData: [],           // Raw order data
  filteredData: [],      // Filtered order data
  dailyData: [],         // Daily aggregation
  modelData: [],         // Model aggregation
  factoryData: [],       // Factory comparison
  processData: null,     // Process pipeline status
  statistics: null,      // KPI statistics

  // UI state
  activeTab: 'monthly',
  selectedPeriod: 'thisMonth',
  selectedModel: null,
  selectedFactory: 'ALL',
  dateMode: 'SDD',
  isLoading: false,
  error: null,

  // Sort state
  sortState: {
    dataTable: { column: null, direction: 'asc' }
  },

  // Pagination state
  currentPage: 1,
  pageSize: 50,

  // Filter state
  filters: {
    factory: 'ALL',
    model: null,
    destination: null,
    dateFrom: null,
    dateTo: null,
    status: 'all',      // all, delayed, warning, normal, shipped
    vendor: null,
    minQuantity: null,
    maxQuantity: null,
    searchQuery: ''
  },

  // Cache state
  lastFetched: null,
  cacheValidUntil: null
};

// ========================================
// Action Types
// ========================================

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ALL_DATA: 'SET_ALL_DATA',
  SET_FILTERED_DATA: 'SET_FILTERED_DATA',
  SET_DAILY_DATA: 'SET_DAILY_DATA',
  SET_MODEL_DATA: 'SET_MODEL_DATA',
  SET_FACTORY_DATA: 'SET_FACTORY_DATA',
  SET_PROCESS_DATA: 'SET_PROCESS_DATA',
  SET_STATISTICS: 'SET_STATISTICS',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_SELECTED_PERIOD: 'SET_SELECTED_PERIOD',
  SET_SELECTED_MODEL: 'SET_SELECTED_MODEL',
  SET_SELECTED_FACTORY: 'SET_SELECTED_FACTORY',
  SET_FACTORY: 'SET_FACTORY',           // Alias for Header.jsx compatibility
  SET_DATE_MODE: 'SET_DATE_MODE',       // For CRD/SDD toggle
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_SORT_STATE: 'SET_SORT_STATE',
  SET_PAGE: 'SET_PAGE',
  SET_PAGE_SIZE: 'SET_PAGE_SIZE',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  SET_ORDERS: 'SET_ORDERS',
  RESET_STATE: 'RESET_STATE'
};

// ========================================
// Reducer
// ========================================

function dashboardReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.SET_ALL_DATA:
      return { ...state, allData: action.payload };

    case ActionTypes.SET_FILTERED_DATA:
      return { ...state, filteredData: action.payload };

    case ActionTypes.SET_DAILY_DATA:
      return { ...state, dailyData: action.payload };

    case ActionTypes.SET_MODEL_DATA:
      return { ...state, modelData: action.payload };

    case ActionTypes.SET_FACTORY_DATA:
      return { ...state, factoryData: action.payload };

    case ActionTypes.SET_PROCESS_DATA:
      return { ...state, processData: action.payload };

    case ActionTypes.SET_STATISTICS:
      return { ...state, statistics: action.payload };

    case ActionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    case ActionTypes.SET_SELECTED_PERIOD:
      return { ...state, selectedPeriod: action.payload };

    case ActionTypes.SET_SELECTED_MODEL:
      return { ...state, selectedModel: action.payload };

    case ActionTypes.SET_SELECTED_FACTORY:
      return { ...state, selectedFactory: action.payload };

    case ActionTypes.SET_FACTORY:
      // Alias for SET_SELECTED_FACTORY (Header.jsx compatibility)
      return { ...state, selectedFactory: action.payload };

    case ActionTypes.SET_DATE_MODE:
      // Toggle between SDD and CRD date modes
      return { ...state, dateMode: action.payload };

    case ActionTypes.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        currentPage: 1  // Reset page when filters change
      };

    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
        currentPage: 1
      };

    case ActionTypes.SET_SORT_STATE:
      return {
        ...state,
        sortState: {
          ...state.sortState,
          [action.payload.table]: action.payload.state
        }
      };

    case ActionTypes.SET_PAGE:
      return { ...state, currentPage: action.payload };

    case ActionTypes.SET_PAGE_SIZE:
      return { ...state, pageSize: action.payload, currentPage: 1 };

    case ActionTypes.SET_DASHBOARD_DATA:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
        cacheValidUntil: Date.now() + 5 * 60 * 1000  // 5 min cache
      };

    case ActionTypes.SET_ORDERS:
      return {
        ...state,
        allData: action.payload,
        filteredData: action.payload,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
        cacheValidUntil: Date.now() + 5 * 60 * 1000
      };

    case ActionTypes.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

// ========================================
// Context
// ========================================

const DashboardContext = createContext(null);

// ========================================
// Provider Component
// ========================================

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // ========================================
  // Action Creators
  // ========================================

  const actions = useMemo(() => ({
    setLoading: (loading) =>
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),

    setError: (error) =>
      dispatch({ type: ActionTypes.SET_ERROR, payload: error }),

    setAllData: (data) =>
      dispatch({ type: ActionTypes.SET_ALL_DATA, payload: data }),

    setFilteredData: (data) =>
      dispatch({ type: ActionTypes.SET_FILTERED_DATA, payload: data }),

    setDailyData: (data) =>
      dispatch({ type: ActionTypes.SET_DAILY_DATA, payload: data }),

    setModelData: (data) =>
      dispatch({ type: ActionTypes.SET_MODEL_DATA, payload: data }),

    setFactoryData: (data) =>
      dispatch({ type: ActionTypes.SET_FACTORY_DATA, payload: data }),

    setProcessData: (data) =>
      dispatch({ type: ActionTypes.SET_PROCESS_DATA, payload: data }),

    setStatistics: (stats) =>
      dispatch({ type: ActionTypes.SET_STATISTICS, payload: stats }),

    setActiveTab: (tab) =>
      dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: tab }),

    setSelectedPeriod: (period) =>
      dispatch({ type: ActionTypes.SET_SELECTED_PERIOD, payload: period }),

    setSelectedModel: (model) =>
      dispatch({ type: ActionTypes.SET_SELECTED_MODEL, payload: model }),

    setSelectedFactory: (factory) =>
      dispatch({ type: ActionTypes.SET_SELECTED_FACTORY, payload: factory }),

    setFilters: (filters) =>
      dispatch({ type: ActionTypes.SET_FILTERS, payload: filters }),

    resetFilters: () =>
      dispatch({ type: ActionTypes.RESET_FILTERS }),

    setSortState: (table, sortState) =>
      dispatch({ type: ActionTypes.SET_SORT_STATE, payload: { table, state: sortState } }),

    setPage: (page) =>
      dispatch({ type: ActionTypes.SET_PAGE, payload: page }),

    setPageSize: (size) =>
      dispatch({ type: ActionTypes.SET_PAGE_SIZE, payload: size }),

    setDashboardData: (data) =>
      dispatch({ type: ActionTypes.SET_DASHBOARD_DATA, payload: data }),

    setOrders: (orders) =>
      dispatch({ type: ActionTypes.SET_ORDERS, payload: orders }),

    resetState: () =>
      dispatch({ type: ActionTypes.RESET_STATE })
  }), []);

  // ========================================
  // Computed Values
  // ========================================

  const isCacheValid = useCallback(() => {
    return state.cacheValidUntil && Date.now() < state.cacheValidUntil;
  }, [state.cacheValidUntil]);

  const getActiveFiltersCount = useCallback(() => {
    const { filters } = state;
    let count = 0;
    if (filters.factory !== 'ALL') count++;
    if (filters.model) count++;
    if (filters.destination) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.status !== 'all') count++;
    if (filters.vendor) count++;
    if (filters.minQuantity) count++;
    if (filters.maxQuantity) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [state.filters]);

  const getPaginatedData = useCallback(() => {
    const { filteredData, currentPage, pageSize } = state;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: filteredData.slice(start, end),
      totalPages: Math.ceil(filteredData.length / pageSize),
      totalItems: filteredData.length
    };
  }, [state.filteredData, state.currentPage, state.pageSize]);

  // ========================================
  // Context Value
  // ========================================

  const value = useMemo(() => ({
    state,
    dispatch,
    ...state,
    ...actions,
    isCacheValid,
    getActiveFiltersCount,
    getPaginatedData
  }), [state, actions, isCacheValid, getActiveFiltersCount, getPaginatedData]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ========================================
// Custom Hook
// ========================================

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardContext;
