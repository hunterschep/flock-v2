'use client';

import * as React from 'react';
import { Map as MapGL, Source, Layer, Marker, type LayerProps, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Maximize2, Minimize2 } from 'lucide-react';
import center from '@turf/center';
import { STATE_NAME_TO_ABBREV } from '@/lib/constants/location';
import type { PropertyValueSpecification } from 'maplibre-gl';
import { Legend } from './Legend';
import * as d3 from 'd3';
import { getCustomBuckets } from '@/lib/utils';

// Types
interface LocationData {
  [location: string]: number; // states or cities
}

interface CityCoordinates {
  [city: string]: [number, number];
}

interface LocationResponse {
  locations: LocationData;
  coordinates: CityCoordinates;
}

// Type guard
function isLocationResponse(data: unknown): data is LocationResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'locations' in data &&
    'coordinates' in data
  );
}

const stateGeoUrl =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

const countriesGeoUrl = 
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

const layerStyle = (colorExpression: PropertyValueSpecification<string>): LayerProps => ({
  id: 'states-fill',
  type: 'fill',
  paint: {
    'fill-color': colorExpression,
    'fill-opacity': 0.4,
    'fill-outline-color': '#333333',
  },
});

const hoverLayerStyle: LayerProps = {
  id: 'states-hover',
  type: 'line' as const,
  paint: {
    'line-color': '#333333',
    'line-width': 2,
  },
};

interface FlockMapProps {
  onLocationSelect: (city: string, state: string) => void;
}

export const FlockMap: React.FC<FlockMapProps> = ({ onLocationSelect }) => {
  const mapRef = React.useRef<MapRef>(null);

  const [viewState, setViewState] = React.useState({
    longitude: -97,
    latitude: 38,
    zoom: 3.5,
    transitionDuration: 500,
  });

  const [selectedState, setSelectedState] = React.useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>('United States');
  const [viewLevel, setViewLevel] = React.useState<'world' | 'country' | 'state'>('country');
  const [hoveredStateId, setHoveredStateId] = React.useState<number | null>(null);
  const [hoveredCity, setHoveredCity] = React.useState<{
    city: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<{
    name: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const [zoomedIn, setZoomedIn] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [cityCoordinates, setCityCoordinates] = React.useState<CityCoordinates>({});

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['locationData', selectedCountry, selectedState],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (selectedState) {
        params.append('state', STATE_NAME_TO_ABBREV[selectedState]);
      } else if (selectedCountry) {
        params.append('country', selectedCountry);
      }

      const response = await fetch(`/api/locations?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch location data');
      return response.json();
    },
    enabled: true,
  });

  // Process the API response data
  React.useEffect(() => {
    if (apiResponse && isLocationResponse(apiResponse)) {
      setCityCoordinates(apiResponse.coordinates);
    }
  }, [apiResponse]);

  // Extract the location data from the response
  const locationData: LocationData = React.useMemo(() => {
    if (!apiResponse) return {};
    if (isLocationResponse(apiResponse)) {
      return apiResponse.locations;
    }
    return apiResponse as LocationData;
  }, [apiResponse]);

  const [geoJson, setGeoJson] = React.useState<any>(null);
  const [countriesGeoJson, setCountriesGeoJson] = React.useState<any>(null);

  React.useEffect(() => {
    fetch(stateGeoUrl)
      .then((res) => res.json())
      .then((data) => setGeoJson(data));
    
    fetch(countriesGeoUrl)
      .then((res) => res.json())
      .then((data) => setCountriesGeoJson(data));
  }, []);

  const maxValue =
    Object.values(locationData || {}).reduce((max, value) => Math.max(max, value), 0) || 1;

  const thresholds = getCustomBuckets(maxValue);

  // Match colors to number of bins
  const colorSchemes: { [key: number]: string[] } = {
    2: ['#fb6a4a', '#de2d26'],
    3: ['#fc9272', '#fb6a4a', '#de2d26'],
    4: ['#fc9272', '#fb6a4a', '#de2d26', '#a50f15'],
    5: ['#fc9272', '#fb6a4a', '#de2d26', '#a50f15', '#701013'],
  };

  const colorRange = colorSchemes[thresholds.length] || colorSchemes[5];

  const colorScale = d3
    .scaleThreshold<number, string>()
    .domain(thresholds.slice(0, -1))
    .range(colorRange);

  const fillColorExpression = React.useMemo(() => {
    if (!locationData || Object.keys(locationData).length === 0 || selectedState || (selectedCountry && viewLevel === 'state')) {
      // Return a simple color when no data
      return '#cccccc' as PropertyValueSpecification<string>;
    }

    const pairs = Object.entries(locationData)
      .map(([location, value]) => [location, colorScale(value)])
      .flat();

    // Only return match expression if we have data
    if (pairs.length === 0) {
      return '#cccccc' as PropertyValueSpecification<string>;
    }

    return [
      'match',
      ['get', 'name'],
      ...pairs,
      '#cccccc', // fallback for "no data"
    ] as unknown as PropertyValueSpecification<string>;
  }, [locationData, selectedState, selectedCountry, viewLevel, colorScale]);

  const renderLegendSkeleton = () => (
    <div className="space-y-2.5">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded border border-gray-100 bg-gray-200 animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
    </div>
  );

  const handleCountryClick = (feature: any) => {
    const clickedCountry = feature.properties?.name;
    if (!clickedCountry) return;

    const centroid = center(feature);
    const [lon, lat] = centroid.geometry.coordinates;

    // Special handling for USA - zoom to show states
    if (clickedCountry === 'United States of America') {
      setSelectedCountry('United States');
      setViewLevel('country');
      setZoomedIn(true);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [-97, 38],
          zoom: 3.5,
          pitch: 0,
          speed: 1.2,
          curve: 1.5,
          easing: (t: any) => t,
          essential: true,
        });
      }
    } else {
      // For other countries, zoom to country level and show cities
      setSelectedCountry(clickedCountry);
      setViewLevel('country');
      setZoomedIn(true);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lon, lat],
          zoom: 5,
          pitch: 0,
          speed: 1.2,
          curve: 1.5,
          easing: (t: any) => t,
          essential: true,
        });
      }

      // Notify parent of country selection
      onLocationSelect('', clickedCountry);
    }
  };

  const handleStateClick = (feature: any) => {
    const clickedState = feature.properties?.name;
    if (!clickedState) return;

    const stateAbbrev = STATE_NAME_TO_ABBREV[clickedState];
    if (!stateAbbrev) return;

    const centroid = center(feature);
    const [lon, lat] = centroid.geometry.coordinates;

    setSelectedState(clickedState);
    setViewLevel('state');
    setZoomedIn(true);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 6,
        pitch: 30,
        speed: 1.2,
        curve: 1.5,
        easing: (t: any) => t,
        essential: true,
      });
    }

    // Notify parent of state selection
    onLocationSelect('', stateAbbrev);
  };

  const showSkeleton = !mapLoaded || isLoading;

  const handleMouseMove = React.useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature && mapRef.current) {
        const name = feature.properties?.name || 'Unknown';
        const value = locationData?.[name] || 0;

        const rect = mapRef.current.getMap().getCanvas().getBoundingClientRect();
        const correctedX = rect.left + event.point.x;
        const correctedY = rect.top + event.point.y;

        setHoveredStateId(feature.id as number);
        setHoverInfo({
          name,
          value,
          x: correctedX,
          y: correctedY,
        });
      } else {
        setHoveredStateId(null);
        setHoverInfo(null);
      }
    },
    [locationData]
  );

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${zoomedIn ? 'bg-gray-50' : 'bg-[#F9F9F9]'}`}
    >
      <MapGL
        {...viewState}
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.stadiamaps.com/styles/outdoors.json"
        cursor={hoveredStateId !== null ? 'pointer' : 'grab'}
        onMove={(evt) => {
          setViewState((prev) => ({
            ...evt.viewState,
            transitionDuration: prev.transitionDuration,
          }));
        }}
        interactiveLayerIds={viewLevel === 'world' ? ['countries-fill'] : viewLevel === 'country' ? ['states-fill'] : []}
        onLoad={() => setMapLoaded(true)}
        onClick={(event) => {
          const feature = event.features?.[0];
          if (feature) {
            if (viewLevel === 'world') {
              handleCountryClick(feature);
            } else if (viewLevel === 'country' && !selectedState) {
              handleStateClick(feature);
            }
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredStateId(null);
          setHoverInfo(null);
        }}
      >
        {/* World view - show countries */}
        {countriesGeoJson && viewLevel === 'world' && (
          <Source id="countries" type="geojson" data={countriesGeoJson}>
            <Layer {...layerStyle(fillColorExpression)} id="countries-fill" />
            {hoveredStateId !== null && (
              <Layer {...hoverLayerStyle} filter={['==', '$id', hoveredStateId]} />
            )}
          </Source>
        )}

        {/* Country view (USA) - show states */}
        {geoJson && viewLevel === 'country' && selectedCountry === 'United States' && !selectedState && (
          <Source id="states" type="geojson" data={geoJson}>
            <Layer {...layerStyle(fillColorExpression)} />
            {hoveredStateId !== null && (
              <Layer {...hoverLayerStyle} filter={['==', '$id', hoveredStateId]} />
            )}
          </Source>
        )}

        {/* City bubbles - show when we have a state selected OR a non-US country selected */}
        {(selectedState || (selectedCountry && selectedCountry !== 'United States')) &&
          locationData &&
          Object.entries(locationData).map(([city, value]) => {
            const coords = cityCoordinates[city];
            if (!coords) return null;

            const normalizedValue = Math.sqrt(value) / Math.sqrt(maxValue);
            const bubbleSize = Math.min(50, 20 + normalizedValue * 40);

            return (
              <Marker key={city} longitude={coords[0]} latitude={coords[1]}>
                <div
                  className="bubble"
                  onClick={() => onLocationSelect(city, selectedState ? STATE_NAME_TO_ABBREV[selectedState] : selectedCountry || '')}
                  onMouseEnter={(e) => {
                    setHoveredCity({
                      city,
                      value,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  onMouseMove={(e) => {
                    setHoveredCity({
                      city,
                      value,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                    backgroundColor: colorScale(value),
                    borderRadius: '50%',
                    opacity: hoveredCity?.city === city ? 0.9 : 0.7,
                    border: hoveredCity?.city === city ? '2px solid #111' : '1px solid #333',
                    transform:
                      hoveredCity?.city === city
                        ? 'translate(-50%, -50%) scale(1.1)'
                        : 'translate(-50%, -50%) scale(1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    zIndex: hoveredCity?.city === city ? 200 : 100,
                    boxShadow: hoveredCity?.city === city ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                />
              </Marker>
            );
          })}

        {/* Tooltips */}
        {hoverInfo && !selectedState && (
          <div
            className="fixed bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 pointer-events-none z-50 text-xs"
            style={{
              left: hoverInfo.x,
              top: hoverInfo.y,
              transform: 'translate(0px, -100%)',
            }}
          >
            <div className="font-medium text-gray-900">{hoverInfo.name}</div>
            <div className="text-gray-500">
              {hoverInfo.value} {hoverInfo.value === 1 ? 'person' : 'people'}
            </div>
          </div>
        )}
        {hoveredCity && (
          <div
            className="fixed bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 text-xs z-50 pointer-events-none"
            style={{
              left: hoveredCity.x,
              top: hoveredCity.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-medium text-gray-900">{hoveredCity.city}</div>
            <div className="text-gray-500">{hoveredCity.value} people</div>
          </div>
        )}
      </MapGL>

      {/* Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={() => setViewState((s) => ({ ...s, zoom: Math.min(8, s.zoom * 1.2) }))}
          className="p-2 cursor-pointer bg-white rounded-lg shadow-md border transition transform hover:scale-110 hover:bg-gray-100 hover:shadow-lg"
        >
          <Plus className="w-4 h-4 text-gray-900" />
        </button>
        <button
          onClick={() => setViewState((s) => ({ ...s, zoom: Math.max(1, s.zoom / 1.2) }))}
          className="p-2 cursor-pointer bg-white rounded-lg shadow-md border transition transform hover:scale-110 hover:bg-gray-100 hover:shadow-lg"
        >
          <Minus className="w-4 h-4 text-gray-900" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-gray-100 p-3 z-10 max-w-xs">
        <div className="text-sm font-semibold text-gray-900 mb-1">
          {selectedState 
            ? `${selectedState} Cities` 
            : selectedCountry && selectedCountry !== 'United States'
              ? `${selectedCountry} Cities`
              : selectedCountry === 'United States'
                ? 'USA States'
                : 'Classmates by Country'
          }
        </div>
        <div className="text-xs text-gray-600 mb-3">
          {selectedState || (selectedCountry && selectedCountry !== 'United States')
            ? 'Institution + 50mi radius' 
            : 'From your institution'
          }
        </div>
        {showSkeleton ? renderLegendSkeleton() : <Legend colorScale={colorScale} />}
      </div>

      {/* Back Button */}
      {(selectedState || selectedCountry) && (
        <button
          onClick={() => {
            if (selectedState) {
              // Go back to country view (USA states)
              setSelectedState(null);
              setViewLevel('country');
              onLocationSelect('', '');
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [-97, 38],
                  zoom: 3.5,
                  speed: 1.2,
                  pitch: 0,
                  curve: 1.5,
                  easing: (t: any) => t,
                  essential: true,
                });
              }
            } else if (selectedCountry) {
              // Go back to world view
              setSelectedCountry(null);
              setViewLevel('world');
              setZoomedIn(false);
              onLocationSelect('', '');
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [0, 20],
                  zoom: 1.5,
                  speed: 1.2,
                  pitch: 0,
                  curve: 1.5,
                  easing: (t: any) => t,
                  essential: true,
                });
              }
            }
          }}
          className="absolute top-4 right-16 px-4 py-2 bg-white rounded-lg shadow-md border hover:bg-gray-50 transition z-10 text-gray-900 cursor-pointer text-sm font-medium"
        >
          ← Back to {selectedState ? 'USA' : 'World'}
        </button>
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute top-4 p-2 bg-white rounded-lg shadow-md border hover:bg-gray-50 transition z-10 text-gray-900 right-4 cursor-pointer"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

