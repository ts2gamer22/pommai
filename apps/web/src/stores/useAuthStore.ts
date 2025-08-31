import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  isGuardian?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
  setInitialized: (initialized: boolean) => void;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  reset: () => void;
  
  // Error helpers
  getErrorMessage: (error: any) => string;
  isFieldError: (field: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      
      // State setters
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      // Auth actions (to be implemented with auth service)
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement with authClient
          console.log('Login:', { email, password });
        } catch (error: any) {
          set({ 
            error: {
              code: error.code || 'LOGIN_FAILED',
              message: get().getErrorMessage(error)
            }
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement with authClient
          console.log('Signup:', { email, password, name });
        } catch (error: any) {
          set({ 
            error: {
              code: error.code || 'SIGNUP_FAILED',
              message: get().getErrorMessage(error)
            }
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: () => {
        set({ user: null, error: null });
      },
      
      reset: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
      
      // Error helpers
      getErrorMessage: (error: any): string => {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.error?.message) return error.error.message;
        
        // Map specific error codes to user-friendly messages
        switch (error?.code) {
          case 'INVALID_CREDENTIALS':
            return 'Invalid email or password';
          case 'USER_NOT_FOUND':
            return 'No account found with this email';
          case 'WEAK_PASSWORD':
            return 'Password must be at least 8 characters long';
          case 'EMAIL_ALREADY_EXISTS':
            return 'An account with this email already exists';
          case 'INVALID_EMAIL':
            return 'Please enter a valid email address';
          default:
            return 'An unexpected error occurred. Please try again.';
        }
      },
      
      isFieldError: (field: string): boolean => {
        return get().error?.field === field;
      },
    }),
    {
      name: 'pommai-auth-store',
      partialize: (state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);