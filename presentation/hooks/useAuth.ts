
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (hasKey) { setIsAuthorized(true); return; }
      }
      const key = process.env.API_KEY;
      if (key && key.length > 5) setIsAuthorized(true);
    };
    checkAuth();
  }, []);

  const triggerAuth = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setIsAuthorized(true);
    }
  };

  return { isAuthorized, triggerAuth };
};
