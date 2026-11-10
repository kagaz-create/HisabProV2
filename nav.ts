import { useEffect, useState } from 'react';

export type Tab = 'home' | 'customers' | 'reports' | 'settings';
export interface Route {
  tab: Tab;
  customerId: string | null;
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const c = /^c\/([A-Za-z0-9_-]{1,128})$/.exec(h);
  if (c) return { tab: 'customers', customerId: c[1] };
  if (h === 'customers' || h === 'reports' || h === 'settings') return { tab: h, customerId: null };
  return { tab: 'home', customerId: null };
}

export const goto = (path: string): void => {
  window.location.hash = '#/' + path;
};

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
