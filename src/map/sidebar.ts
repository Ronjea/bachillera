import type { Map as MapLibreMap } from 'maplibre-gl';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 860px)';

/** Wires the sidebar collapse/drawer toggle (desktop collapses width to 0,
 *  mobile slides in as an overlay drawer with a backdrop) and the
 *  scroll-fade hint that hides once the panel is scrolled to its end. */
export const initSidebarToggle = (map: MapLibreMap): void => {
  const sidebar = document.querySelector<HTMLElement>('#sidebar');
  const backdrop = document.querySelector<HTMLElement>('#sidebarBackdrop');
  const toggle = document.querySelector<HTMLButtonElement>('#sidebarToggle');
  const scrollEl = document.querySelector<HTMLElement>('#sidebarScroll');
  if (!sidebar || !backdrop || !toggle || !scrollEl) return;

  const isMobile = (): boolean => window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;

  toggle.addEventListener('click', () => {
    if (isMobile()) {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('show', sidebar.classList.contains('mobile-open'));
      return;
    }
    sidebar.classList.toggle('collapsed');
    setTimeout(() => map.resize(), 180);
  });

  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
  });

  const updateScrollHint = (): void => {
    const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 4;
    sidebar.classList.toggle('scrolled-to-bottom', atBottom);
  };
  scrollEl.addEventListener('scroll', updateScrollHint);
  window.addEventListener('resize', updateScrollHint);
  updateScrollHint();
};
