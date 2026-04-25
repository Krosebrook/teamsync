import React, { useEffect, useRef } from 'react';

export default function ContextualTutorialHighlight({
  active = false,
  targetSelector = null,
  title = '',
  hint = '',
  position = 'bottom'
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!active || !targetSelector) return;

    const updatePosition = () => {
      const target = document.querySelector(targetSelector);
      if (!target || !popoverRef.current) return;

      const rect = target.rect?.getBoundingClientRect?.() || target.getBoundingClientRect?.();
      if (!rect) return;

      const popover = popoverRef.current;
      const padding = 12;
      let top, left;

      switch (position) {
        case 'top':
          top = rect.top - popover.offsetHeight - padding;
          left = rect.left + rect.width / 2 - popover.offsetWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - popover.offsetWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - popover.offsetHeight / 2;
          left = rect.left - popover.offsetWidth - padding;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - popover.offsetHeight / 2;
          left = rect.right + padding;
          break;
        default:
          return;
      }

      popover.style.top = Math.max(10, top) + 'px';
      popover.style.left = Math.max(10, left) + 'px';
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [active, targetSelector, position]);

  if (!active) return null;

  return (
    <>
      {/* Highlight circle around target */}
      {targetSelector && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <svg className="w-full h-full">
            <defs>
              <mask id="highlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {(() => {
                  const target = document.querySelector(targetSelector);
                  if (!target) return null;
                  const rect = target.getBoundingClientRect();
                  const size = Math.max(rect.width, rect.height) + 20;
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={size / 2}
                      fill="black"
                    />
                  );
                })()}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.5)"
              mask="url(#highlight-mask)"
            />
          </svg>

          {/* Pulsing ring */}
          {(() => {
            const target = document.querySelector(targetSelector);
            if (!target) return null;
            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) + 20;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            return (
              <svg
                className="fixed"
                style={{
                  left: cx - size / 2,
                  top: cy - size / 2,
                  width: size,
                  height: size
                }}
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2 - 2}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </svg>
            );
          })()}
        </div>
      )}

      {/* Floating hint popover */}
      {title && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-violet-200 max-w-xs pointer-events-auto"
        >
          <div className="p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {hint && <p className="text-xs text-slate-600 leading-relaxed">{hint}</p>}
          </div>
          <div className="px-4 pb-3 pt-1">
            <div className="text-xs text-violet-600 font-medium">✨ Tutorial</div>
          </div>
        </div>
      )}
    </>
  );
}