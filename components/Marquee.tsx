import type { ReactNode } from 'react';

/** Endless ticker. Items are rendered twice so the loop is seamless. */
export function Marquee({ items }: { items: ReactNode[] }) {
  return (
    <div className="marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee-track">
        {[0, 1].map((n) => (
          <div key={n} className="flex shrink-0 items-center" aria-hidden={n === 1}>
            {items.map((item, i) => (
              <div key={i} className="flex items-center whitespace-nowrap px-7">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
