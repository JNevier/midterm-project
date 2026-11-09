import { useEffect } from 'react';

// Sets the browser tab title while a page is shown.
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};
