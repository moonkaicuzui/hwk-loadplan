/**
 * @fileoverview Component Error Boundary
 * Smaller error boundary for individual dashboard sections.
 * Shows inline error message instead of full-page error.
 *
 * @module components/common/ComponentErrorBoundary
 */

import { Component } from 'react';
import { errorTracking, ERROR_CATEGORY, ERROR_SEVERITY } from '../../services/errorTracking';

class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const componentName = this.props.name || 'component';
    console.error(`[ComponentErrorBoundary] Error in ${componentName}:`, error, errorInfo);

    // Track error using the error tracking service
    errorTracking.track(error, {
      category: ERROR_CATEGORY.UI,
      severity: ERROR_SEVERITY.HIGH,
      component: componentName,
      action: 'component_crash',
      metadata: {
        componentStack: errorInfo?.componentStack
      }
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { name = '컴포넌트', minHeight = '200px' } = this.props;

      return (
        <div
          className="bg-card rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center"
          style={{ minHeight }}
        >
          <div className="w-12 h-12 mb-3 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {name} 로드 실패
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            일시적인 오류가 발생했습니다
          </p>
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
