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
    'fill-opacity': 0.7,
    'fill-outline-color': '#475569', // Slightly lighter outline for better visibility
  },
});

const hoverLayerStyle: LayerProps = {
  id: 'states-hover',
  type: 'line' as const,
  paint: {
    'line-color': '#a78bfa', // Purple hover to match theme
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

  // Match colors to number of bins - Purple/Blue gradient matching site theme
  const colorSchemes: { [key: number]: string[] } = {
    2: ['#a78bfa', '#7c3aed'],       // Light purple -> Purple
    3: ['#c4b5fd', '#a78bfa', '#7c3aed'],  // Very light -> Light -> Purple
    4: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#6d28d9'],  // Very light -> Purple -> Dark purple
    5: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#6d28d9'],  // Lightest -> Darkest purple
  };

  const colorRange = colorSchemes[thresholds.length] || colorSchemes[5];

  const colorScale = d3
    .scaleThreshold<number, string>()
    .domain(thresholds.slice(0, -1))
    .range(colorRange);

  const fillColorExpression = React.useMemo(() => {
    if (!locationData || Object.keys(locationData).length === 0 || selectedState || (selectedCountry && viewLevel === 'state')) {
      // Return a dark gray for no data that matches dark theme
      return '#1e293b' as PropertyValueSpecification<string>;
    }

    const pairs = Object.entries(locationData)
      .map(([location, value]) => [location, colorScale(value)])
      .flat();

    // Only return match expression if we have data
    if (pairs.length === 0) {
      return '#1e293b' as PropertyValueSpecification<string>;
    }

    return [
      'match',
      ['get', 'name'],
      ...pairs,
      '#1e293b', // fallback for "no data" - dark gray matching theme
    ] as unknown as PropertyValueSpecification<string>;
  }, [locationData, selectedState, selectedCountry, viewLevel, colorScale]);

  const renderLegendSkeleton = () => (
    <div className="space-y-2.5">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded border border-white/20 bg-white/10 animate-pulse" />
            <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
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
        mapStyle="https://tiles.stadiamaps.com/styles/alidade_smooth.json"
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
            className="fixed glass-strong px-3 py-2 rounded-lg pointer-events-none z-50 text-xs"
            style={{
              left: hoverInfo.x,
              top: hoverInfo.y,
              transform: 'translate(0px, -100%)',
            }}
          >
            <div className="font-medium text-white drop-shadow">{hoverInfo.name}</div>
            <div className="text-white/80 drop-shadow">
              {hoverInfo.value} {hoverInfo.value === 1 ? 'person' : 'people'}
            </div>
          </div>
        )}
        {hoveredCity && (
          <div
            className="fixed glass-strong px-3 py-2 rounded-lg text-xs z-50 pointer-events-none"
            style={{
              left: hoveredCity.x,
              top: hoveredCity.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-medium text-white drop-shadow">{hoveredCity.city}</div>
            <div className="text-white/80 drop-shadow">{hoveredCity.value} people</div>
          </div>
        )}
      </MapGL>

      {/* Zoom Controls - Enhanced & Mobile Responsive */}
      <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 sm:gap-3 z-10">
        <button
          onClick={() => setViewState((s) => ({ ...s, zoom: Math.min(8, s.zoom * 1.2) }))}
          className="p-2 sm:p-3 cursor-pointer glass-light rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-110 hover:bg-white/20 group shadow-lg"
          title="Zoom In"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow group-hover:text-purple-300 transition-colors" />
        </button>
        <button
          onClick={() => setViewState((s) => ({ ...s, zoom: Math.max(1, s.zoom / 1.2) }))}
          className="p-2 sm:p-3 cursor-pointer glass-light rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-110 hover:bg-white/20 group shadow-lg"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow group-hover:text-purple-300 transition-colors" />
        </button>
      </div>

      {/* Legend - Enhanced & Mobile Responsive */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 glass-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 z-10 max-w-[200px] sm:max-w-xs shadow-2xl">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="text-xs sm:text-sm font-bold text-white drop-shadow leading-tight">
            {selectedState 
              ? `${selectedState} Cities` 
              : selectedCountry && selectedCountry !== 'United States'
                ? `${selectedCountry} Cities`
                : selectedCountry === 'United States'
                  ? 'USA States'
                  : 'Classmates by Country'
            }
          </div>
        </div>
        <div className="text-[10px] sm:text-xs text-white/80 drop-shadow mb-2 sm:mb-4 ml-7 sm:ml-10">
          {selectedState || (selectedCountry && selectedCountry !== 'United States')
            ? 'Institution + 50mi radius' 
            : 'From your institution'
          }
        </div>
        {showSkeleton ? renderLegendSkeleton() : <Legend colorScale={colorScale} />}
      </div>

      {/* Back Button - Enhanced & Mobile Responsive */}
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
          className="absolute top-2 sm:top-4 right-12 sm:right-16 px-3 sm:px-5 py-2 sm:py-2.5 glass-light rounded-lg sm:rounded-xl transition-all duration-300 z-10 text-white cursor-pointer text-xs sm:text-sm font-semibold drop-shadow hover:bg-white/20 hover:scale-105 flex items-center gap-1.5 sm:gap-2 shadow-lg"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Back to </span>{selectedState ? 'USA' : 'World'}
        </button>
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute top-2 sm:top-4 p-2 sm:p-3 glass-light rounded-lg sm:rounded-xl transition-all duration-300 z-10 text-white right-2 sm:right-4 cursor-pointer hover:bg-white/20 hover:scale-105 shadow-lg group"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? 
          <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow group-hover:text-purple-300 transition-colors" /> : 
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow group-hover:text-purple-300 transition-colors" />
        }
      </button>
    </div>
  );
};

