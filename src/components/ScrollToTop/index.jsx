import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Opens every new page at the top, or at the "#section" in the address when
// there is one (for example "Back to all spaces" goes to /#spaces).
// Only runs when the path or hash changes, so in-page links keep working.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
