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
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: item.color }}
          />
          <div className="text-xs text-gray-700">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

