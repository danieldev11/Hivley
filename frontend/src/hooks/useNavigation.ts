import { useNavigate, useLocation } from 'react-router-dom';
import { handleNavigation, validateNavigation, WorkflowStep } from '../lib/navigation';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = async (
    destination: string,
    options: {
      requiresAuth?: boolean;
      validateCurrentStep?: boolean;
      state?: Record<string, unknown>;
      preserveRole?: boolean;
    } = {}
  ) => {
    try {
      const { 
        requiresAuth = false, 
        validateCurrentStep = true, 
        state = {},
        preserveRole = true
      } = options;

      // Preserve role state when needed
      const currentState = location.state || {};
      const newState = {
        ...(preserveRole ? {
          fromRoleSelection: currentState.fromRoleSelection,
          role: currentState.role
        } : {}),
        ...state
      };

      if (requiresAuth && !sessionStorage.getItem('sb-auth-token')) {
        await handleNavigation(navigate, '/auth', {
          redirectTo: destination,
          ...newState
        });
        return;
      }

      if (validateCurrentStep) {
        const currentPath = location.pathname;
        const currentStep = currentPath.split('/').pop() as WorkflowStep;
        
        if (!validateNavigation(currentStep, newState)) {
          await handleNavigation(navigate, '/auth/signup');
          return;
        }
      }

      await handleNavigation(navigate, destination, newState);

    } catch (error) {
      console.error('Navigation failed:', error);
      await handleNavigation(navigate, '/auth/signup');
    }
  };

  return {
    navigateTo,
    currentPath: location.pathname,
    locationState: location.state
  };
};