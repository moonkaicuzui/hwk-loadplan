/**
 * @fileoverview Authentication Context
 * Provides authentication state and RBAC (Role-Based Access Control).
 *
 * Features:
 * - Firebase Authentication integration (Google OAuth)
 * - Role-based permissions
 * - Factory access control
 * - Demo mode for development
 *
 * @module contexts/AuthContext
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// ========================================
// Context Creation
// ========================================

const AuthContext = createContext(null);

// ========================================
// Constants
// ========================================

const SELECTED_FACTORY_KEY = 'selectedFactory';
const DEFAULT_FACTORY = 'ALL';

// ========================================
// User Roles Configuration
// ========================================

/**
 * Email domain-based role mapping
 * Maps user emails to their roles and permissions
 */
const USER_ROLES = {
  // Master Admin - full access
  'ksmoon@hsvina.com': {
    role: 'admin',
    displayName: 'KS Moon (Master)',
    restrictedFactory: null
  },

  // Admin - full access
  'admin@rachgia.com': {
    role: 'admin',
    displayName: 'Administrator',
    restrictedFactory: null
  },

  // Factory managers - restricted to their factory
  'manager.a@rachgia.com': {
    role: 'factory_manager',
    displayName: 'Factory A Manager',
    restrictedFactory: 'A'
  },
  'manager.b@rachgia.com': {
    role: 'factory_manager',
    displayName: 'Factory B Manager',
    restrictedFactory: 'B'
  },
  'manager.c@rachgia.com': {
    role: 'factory_manager',
    displayName: 'Factory C Manager',
    restrictedFactory: 'C'
  },
  'manager.d@rachgia.com': {
    role: 'factory_manager',
    displayName: 'Factory D Manager',
    restrictedFactory: 'D'
  },

  // Production supervisors - view all
  'supervisor@rachgia.com': {
    role: 'supervisor',
    displayName: 'Production Supervisor',
    restrictedFactory: null
  }
};

/**
 * Role permissions matrix
 */
const ROLE_PERMISSIONS = {
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
  },
  demo: {
    canViewAllFactories: true,
    canEditSettings: false,
    canExportData: true,
    canManageTasks: false
  }
};

// ========================================
// Firebase Error Handling
// ========================================

const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-credential': '잘못된 인증 정보입니다.',
  'auth/user-not-found': '등록되지 않은 사용자입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
  'auth/user-disabled': '비활성화된 계정입니다.',
  'auth/too-many-requests': '너무 많은 시도입니다. 잠시 후 다시 시도하세요.',
  'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
  'auth/cancelled-popup-request': '로그인이 취소되었습니다.',
  'auth/popup-blocked': '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'
};

const getFirebaseErrorMessage = (error) => {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  const errorCode = error.code || error.message;
  return FIREBASE_ERROR_MESSAGES[errorCode] || `오류: ${errorCode}`;
};

// ========================================
// Helper Functions
// ========================================

const getRoleFromEmail = (email) => {
  const userInfo = USER_ROLES[email?.toLowerCase()];
  if (userInfo) return userInfo;

  // Default role for any authenticated user
  return {
    role: 'viewer',
    displayName: null,
    restrictedFactory: null
  };
};

// ========================================
// Custom Hook
// ========================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ========================================
// Provider Component
// ========================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========================================
  // Authentication State Listener
  // ========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const { role, displayName: roleDisplayName, restrictedFactory } = getRoleFromEmail(firebaseUser.email);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: roleDisplayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL,
          role: role,
          restrictedFactory: restrictedFactory || null,
          isDemo: false
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ========================================
  // Authentication Methods
  // ========================================

  /**
   * Login with Google OAuth via Firebase
   */
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      console.error('[Auth] Google login error:', err);
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const loginWithEmail = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      console.error('[Auth] Email login error:', err);
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login as demo user (development only)
   */
  const loginAsDemo = async () => {
    setError(null);
    setLoading(true);

    try {
      // Demo mode - create a mock user
      const demoUser = {
        uid: 'demo-user-' + Date.now(),
        email: 'demo@rachgia.com',
        displayName: 'Demo User',
        photoURL: null,
        role: 'demo',
        restrictedFactory: null,
        isDemo: true
      };

      setUser(demoUser);
      return demoUser;
    } catch (err) {
      console.error('[Auth] Demo login error:', err);
      setError('데모 로그인에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    setError(null);

    try {
      // If demo user, just clear state
      if (user?.isDemo) {
        setUser(null);
        return;
      }

      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('[Auth] Logout error:', err);
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Clear error
   */
  const clearError = () => setError(null);

  // ========================================
  // Permission Checks
  // ========================================

  const isAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'factory_manager' || user?.role === 'admin';
  const isSupervisor = () => user?.role === 'supervisor' || user?.role === 'admin';
  const isViewer = () => user?.role === 'viewer';
  const isDemo = () => user?.isDemo === true;

  const hasRestrictedFactory = () => !!user?.restrictedFactory;
  const getRestrictedFactory = () => user?.restrictedFactory || null;

  const hasFactoryAccess = (factoryId) => {
    if (!user) return false;
    if (factoryId === 'ALL') return true;
    if (user.restrictedFactory) {
      return user.restrictedFactory === factoryId;
    }
    return true;
  };

  const canExport = () => ROLE_PERMISSIONS[user?.role]?.canExportData || false;
  const canEditSettings = () => ROLE_PERMISSIONS[user?.role]?.canEditSettings || false;
  const canManageTasks = () => ROLE_PERMISSIONS[user?.role]?.canManageTasks || false;
  const canViewAllFactories = () => ROLE_PERMISSIONS[user?.role]?.canViewAllFactories || false;

  // ========================================
  // Context Value
  // ========================================

  const value = {
    // User state
    user,
    loading,
    error,
    isAuthenticated: !!user,

    // Auth methods
    loginWithGoogle,
    loginWithEmail,
    loginAsDemo,
    logout,
    clearError,

    // Role checks
    isAdmin,
    isManager,
    isSupervisor,
    isViewer,
    isDemo,

    // Permission checks
    canExport,
    canEditSettings,
    canManageTasks,
    canViewAllFactories,

    // Factory access
    hasRestrictedFactory,
    getRestrictedFactory,
    hasFactoryAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
