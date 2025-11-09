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

    // First item: 0 to first threshold
    if (domain.length > 0) {
      legendItems.push({
        color: range[0],
        label: `1-${domain[0]}`,
      });
    }

    // Middle items: between thresholds
    for (let i = 0; i < domain.length - 1; i++) {
      legendItems.push({
        color: range[i + 1],
        label: `${domain[i] + 1}-${domain[i + 1]}`,
      });
    }

    // Last item: above last threshold
    if (domain.length > 0) {
      legendItems.push({
        color: range[range.length - 1],
        label: `${domain[domain.length - 1] + 1}+`,
      });
    }

    return legendItems;
  }, [domain, range]);

  return (
    <div className="space-y-1.5 sm:space-y-2.5">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="flex items-center gap-2 sm:gap-3 group hover:scale-105 transition-all duration-300 cursor-default"
        >
          <div
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg border-2 border-white/40 group-hover:border-white/60 shadow-lg transition-all duration-300 flex-shrink-0"
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 10px ${item.color}40`
            }}
          />
          <div className="text-[10px] sm:text-xs text-white drop-shadow font-semibold tracking-wide group-hover:text-white/90 transition-colors leading-tight">
            {item.label} {item.label.includes('+') ? 'people' : ''}
          </div>
        </div>
      ))}
    </div>
  );
};

