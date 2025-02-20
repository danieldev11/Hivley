import { NavigateFunction } from 'react-router-dom';

export type WorkflowStep = 'role-selection' | 'signup' | 'login' | 'dashboard';

interface NavigationState {
  fromRoleSelection?: boolean;
  role?: 'provider' | 'client';
  previousStep?: WorkflowStep;
  redirectTo?: string;
}

export class NavigationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NavigationError';
  }
}

export const validateNavigation = (
  currentStep: WorkflowStep,
  state: NavigationState | null
): boolean => {
  if (!state) return true;
  
  switch (currentStep) {
    case 'signup':
      // Allow direct access to main signup page
      return true;
    case 'dashboard':
      return !!sessionStorage.getItem('sb-auth-token');
    default:
      return true;
  }
};

export const handleNavigation = async (
  navigate: NavigateFunction,
  destination: string,
  state: NavigationState = {}
): Promise<void> => {
  try {
    // Store current page as previous step
    const currentPath = window.location.pathname;
    const currentStep = getCurrentStep(currentPath);
    
    if (currentStep) {
      state.previousStep = currentStep;
    }

    // Ensure state is properly structured
    const sanitizedState = {
      ...state,
      fromRoleSelection: state.fromRoleSelection ?? false,
      role: state.role || undefined,
    };

    // Add current state to browser history
    navigate(destination, {
      state: sanitizedState,
      replace: shouldReplaceHistory(currentStep, destination)
    });

  } catch (error) {
    console.error('Navigation error:', error);
    // Instead of throwing, navigate to a safe fallback
    navigate('/auth/signup', { replace: true });
  }
};

const getCurrentStep = (path: string): WorkflowStep | null => {
  if (path.includes('/auth/signup')) return 'signup';
  if (path.includes('/auth')) return 'login';
  if (path.includes('/dashboard')) return 'dashboard';
  if (path.includes('/role-selection')) return 'role-selection';
  return null;
};

const shouldReplaceHistory = (
  currentStep: WorkflowStep | null,
  destination: string
): boolean => {
  // Replace history for authentication flows to prevent back navigation
  if (destination.includes('/auth') || destination.includes('/dashboard')) {
    return true;
  }
  
  // Replace if navigating backwards in the flow
  if (currentStep === 'signup' && destination.includes('/role-selection')) {
    return true;
  }
  
  return false;
};