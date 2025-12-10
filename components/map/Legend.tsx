import * as React from 'react';
import type { ScaleThreshold } from 'd3';

interface LegendProps {
  colorScale: ScaleThreshold<number, string>;
}

export const Legend: React.FC<LegendProps> = ({ colorScale }) => {
  const domain = colorScale.domain();
  const range = colorScale.range();

  const items = React.useMemo(() => {
    const legendItems = [];

    if (domain.length > 0) {
      legendItems.push({ color: range[0], label: `1-${domain[0]}` });
    }

    for (let i = 0; i < domain.length - 1; i++) {
      legendItems.push({ color: range[i + 1], label: `${domain[i] + 1}-${domain[i + 1]}` });
    }

    if (domain.length > 0) {
      legendItems.push({ color: range[range.length - 1], label: `${domain[domain.length - 1] + 1}+` });
    }

    return legendItems;
  }, [domain, range]);

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 group">
          <div
            className="w-4 h-4 rounded border border-white/20 transition-all"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] md:text-xs text-white/70 font-medium tabular-nums">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
