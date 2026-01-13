/* v2.0.0-alpha.1 */
/* =========================================================
   TOOLTIP — IN-GAME INFO POPUP
   Design System v1
   ========================================================= */

.dex-owner-tooltip {
  position: fixed;
  z-index: 9999;

  min-width: 220px;
  max-width: 520px;
  max-height: 220px;

  padding: var(--space-2) var(--space-3);

  background: var(--bg-panel);
  color: var(--text-main);

  border: var(--border-soft);
  border-radius: 12px;

  box-shadow: var(--shadow-depth);

  font-family: 'Press Start 2P', monospace;
  font-size: var(--font-card-stat);

  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.dex-owner-tooltip.show {
  opacity: 1;
}

/* ---------------------------------------------------------
   TITLE
   --------------------------------------------------------- */

.dex-owner-tooltip .owners-title {
  margin-bottom: var(--space-1);

  font-size: var(--font-card-stat);
  letter-spacing: 1px;

  color: var(--accent);
}

/* ---------------------------------------------------------
   OWNER LIST (SCROLLING)
   --------------------------------------------------------- */

.dex-owner-tooltip .owners-list {
  position: relative;
  height: 3.2em;
  overflow: hidden;

  color: var(--text-muted);
}

.dex-owner-tooltip .scrolling-names {
  position: absolute;
  inset: 0;

  text-align: center;
  white-space: pre-line;

  animation: tooltip-scroll 14s linear infinite;
}

/* ---------------------------------------------------------
   SCROLL ANIMATION (READABLE)
   --------------------------------------------------------- */

@keyframes tooltip-scroll {
  0%   { transform: translateY(0); }
  20%  { transform: translateY(0); }
  80%  { transform: translateY(calc(-100% + 3.2em)); }
  100% { transform: translateY(calc(-100% + 3.2em)); }
}
