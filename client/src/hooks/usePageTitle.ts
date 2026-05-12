import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Quan ly muon do dung`;
  }, [title]);
}
