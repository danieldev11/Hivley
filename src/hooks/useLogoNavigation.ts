import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/auth';

export const useLogoNavigation = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState<string>('/');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const determineNavigation = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();

        if (user?.profile) {
          const role = user.profile.role;
          if (role === 'client') {
            setDestination('/services');
          } else if (role === 'provider') {
            setDestination('/dashboard/provider/overview');
          }
          setIsActive(true);
        } else {
          setDestination('/');
          setIsActive(false);
        }
      } catch (error) {
        console.error('Navigation determination error:', error);
        setDestination('/');
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    determineNavigation();
  }, []);

  const handleNavigation = () => {
    if (!isLoading && isActive) {
      navigate(destination);
    }
  };

  return {
    handleNavigation,
    isLoading,
    isActive,
    destination
  };
};