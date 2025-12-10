'use client';

import * as React from 'react';
import { Map as MapGL, Source, Layer, Marker, type LayerProps, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Maximize2, Minimize2, ChevronLeft, MapPin } from 'lucide-react';
import center from '@turf/center';
import { STATE_NAME_TO_ABBREV } from '@/lib/constants/location';
import type { PropertyValueSpecification } from 'maplibre-gl';
import { Legend } from './Legend';
import * as d3 from 'd3';
import { getCustomBuckets } from '@/lib/utils';

interface LocationData {
  [location: string]: number;
}

interface CityCoordinates {
  [city: string]: [number, number];
}

interface LocationResponse {
  locations: LocationData;
  coordinates: CityCoordinates;
}

function isLocationResponse(data: unknown): data is LocationResponse {
  return data !== null && typeof data === 'object' && 'locations' in data && 'coordinates' in data;
}

const stateGeoUrl = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
const countriesGeoUrl = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

// Dark map style from Stadia Maps
const MAP_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

// Coral accent color scheme
const colorSchemes: { [key: number]: string[] } = {
  2: ['#FDA4AF', '#F97066'],
  3: ['#FECDD3', '#FDA4AF', '#F97066'],
  4: ['#FECDD3', '#FDA4AF', '#FB7185', '#F97066'],
  5: ['#FFE4E6', '#FECDD3', '#FDA4AF', '#FB7185', '#F97066'],
};

const layerStyle = (colorExpression: PropertyValueSpecification<string>): LayerProps => ({
  id: 'states-fill',
  type: 'fill',
  paint: {
    'fill-color': colorExpression,
    'fill-opacity': 0.75,
    'fill-outline-color': 'rgba(255,255,255,0.1)',
  },
});

const hoverLayerStyle: LayerProps = {
  id: 'states-hover',
  type: 'line' as const,
  paint: {
    'line-color': '#F97066',
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
  const [hoveredCity, setHoveredCity] = React.useState<{ city: string; value: number; x: number; y: number } | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<{ name: string; value: number; x: number; y: number } | null>(null);

  const [_zoomedIn, setZoomedIn] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [cityCoordinates, setCityCoordinates] = React.useState<CityCoordinates>({});

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['locationData', selectedCountry, selectedState],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', STATE_NAME_TO_ABBREV[selectedState]);
      else if (selectedCountry) params.append('country', selectedCountry);
      const response = await fetch(`/api/locations?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch location data');
      return response.json();
    },
    enabled: true,
  });

  React.useEffect(() => {
    if (apiResponse && isLocationResponse(apiResponse)) setCityCoordinates(apiResponse.coordinates);
  }, [apiResponse]);

  const locationData: LocationData = React.useMemo(() => {
    if (!apiResponse) return {};
    if (isLocationResponse(apiResponse)) return apiResponse.locations;
    return apiResponse as LocationData;
  }, [apiResponse]);

  const [geoJson, setGeoJson] = React.useState<unknown>(null);
  const [countriesGeoJson, setCountriesGeoJson] = React.useState<unknown>(null);

  React.useEffect(() => {
    fetch(stateGeoUrl).then((res) => res.json()).then((data) => setGeoJson(data));
    fetch(countriesGeoUrl).then((res) => res.json()).then((data) => setCountriesGeoJson(data));
  }, []);

  const maxValue = Object.values(locationData || {}).reduce((max, value) => Math.max(max, value), 0) || 1;
  const thresholds = React.useMemo(() => getCustomBuckets(maxValue), [maxValue]);
  const colorRange = React.useMemo(() => colorSchemes[thresholds.length] || colorSchemes[5], [thresholds]);

  const colorScale = React.useMemo(
    () => d3.scaleThreshold<number, string>().domain(thresholds.slice(0, -1)).range(colorRange),
    [thresholds, colorRange]
  );

  const fillColorExpression = React.useMemo(() => {
    if (!locationData || Object.keys(locationData).length === 0 || selectedState || (selectedCountry && viewLevel === 'state')) {
      return 'rgba(255,255,255,0.03)' as PropertyValueSpecification<string>;
    }
    const pairs = Object.entries(locationData).map(([location, value]) => [location, colorScale(value)]).flat();
    if (pairs.length === 0) return 'rgba(255,255,255,0.03)' as PropertyValueSpecification<string>;
    return ['match', ['get', 'name'], ...pairs, 'rgba(255,255,255,0.03)'] as unknown as PropertyValueSpecification<string>;
  }, [locationData, selectedState, selectedCountry, viewLevel, colorScale]);

  const handleCountryClick = (feature: { properties?: { name?: string }; geometry: { coordinates: [number, number] } }) => {
    const clickedCountry = feature.properties?.name;
    if (!clickedCountry) return;
    const centroid = center(feature);
    const [lon, lat] = centroid.geometry.coordinates;

    if (clickedCountry === 'United States of America') {
      setSelectedCountry('United States');
      setViewLevel('country');
      setZoomedIn(true);
      mapRef.current?.flyTo({ center: [-97, 38], zoom: 3.5, pitch: 0, speed: 1.2, curve: 1.5, easing: (t: number) => t, essential: true });
    } else {
      setSelectedCountry(clickedCountry);
      setViewLevel('country');
      setZoomedIn(true);
      mapRef.current?.flyTo({ center: [lon, lat], zoom: 5, pitch: 0, speed: 1.2, curve: 1.5, easing: (t: number) => t, essential: true });
      onLocationSelect('', clickedCountry);
    }
  };

  const handleStateClick = (feature: { properties?: { name?: string }; geometry: { coordinates: [number, number] } }) => {
    const clickedState = feature.properties?.name;
    if (!clickedState) return;
    const stateAbbrev = STATE_NAME_TO_ABBREV[clickedState];
    if (!stateAbbrev) return;
    const centroid = center(feature);
    const [lon, lat] = centroid.geometry.coordinates;

    setSelectedState(clickedState);
    setViewLevel('state');
    setZoomedIn(true);
    mapRef.current?.flyTo({ center: [lon, lat], zoom: 6, pitch: 20, speed: 1.2, curve: 1.5, easing: (t: number) => t, essential: true });
    onLocationSelect('', stateAbbrev);
  };

  const handleMouseMove = React.useCallback(
    (event: { features?: Array<{ id?: number; properties?: { name?: string } }>; point: { x: number; y: number } }) => {
      const feature = event.features?.[0];
      if (feature && mapRef.current) {
        const name = feature.properties?.name || 'Unknown';
        const value = locationData?.[name] || 0;
        const rect = mapRef.current.getMap().getCanvas().getBoundingClientRect();
        setHoveredStateId(feature.id as number);
        setHoverInfo({ name, value, x: rect.left + event.point.x, y: rect.top + event.point.y });
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
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleBack = () => {
    if (selectedState) {
      setSelectedState(null);
      setViewLevel('country');
      onLocationSelect('', '');
      mapRef.current?.flyTo({ center: [-97, 38], zoom: 3.5, speed: 1.2, pitch: 0, curve: 1.5, easing: (t: number) => t, essential: true });
    } else if (selectedCountry) {
      setSelectedCountry(null);
      setViewLevel('world');
      setZoomedIn(false);
      onLocationSelect('', '');
      mapRef.current?.flyTo({ center: [0, 20], zoom: 1.5, speed: 1.2, pitch: 0, curve: 1.5, easing: (t: number) => t, essential: true });
    }
  };

  const showSkeleton = !mapLoaded || isLoading;

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0a0a0f]">
      <MapGL
        {...viewState}
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        cursor={hoveredStateId !== null ? 'pointer' : 'grab'}
        onMove={(evt) => setViewState((prev) => ({ ...evt.viewState, transitionDuration: prev.transitionDuration }))}
        interactiveLayerIds={viewLevel === 'world' ? ['countries-fill'] : viewLevel === 'country' ? ['states-fill'] : []}
        onLoad={() => setMapLoaded(true)}
        onClick={(event) => {
          const feature = event.features?.[0];
          if (feature) {
            if (viewLevel === 'world') handleCountryClick(feature);
            else if (viewLevel === 'country' && !selectedState) handleStateClick(feature);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredStateId(null); setHoverInfo(null); }}
      >
        {/* World view */}
        {countriesGeoJson && viewLevel === 'world' && (
          <Source id="countries" type="geojson" data={countriesGeoJson}>
            <Layer {...layerStyle(fillColorExpression)} id="countries-fill" />
            {hoveredStateId !== null && <Layer {...hoverLayerStyle} filter={['==', '$id', hoveredStateId]} />}
          </Source>
        )}

        {/* Country view (USA) */}
        {geoJson && viewLevel === 'country' && selectedCountry === 'United States' && !selectedState && (
          <Source id="states" type="geojson" data={geoJson}>
            <Layer {...layerStyle(fillColorExpression)} />
            {hoveredStateId !== null && <Layer {...hoverLayerStyle} filter={['==', '$id', hoveredStateId]} />}
          </Source>
        )}

        {/* City bubbles */}
        {(selectedState || (selectedCountry && selectedCountry !== 'United States')) &&
          locationData &&
          Object.entries(locationData).map(([city, value]) => {
            const coords = cityCoordinates[city];
            if (!coords) return null;
            const normalizedValue = Math.sqrt(value) / Math.sqrt(maxValue);
            const bubbleSize = Math.min(50, 18 + normalizedValue * 36);
            const isHovered = hoveredCity?.city === city;

            return (
              <Marker key={city} longitude={coords[0]} latitude={coords[1]}>
                <div
                  onClick={() => onLocationSelect(city, selectedState ? STATE_NAME_TO_ABBREV[selectedState] : selectedCountry || '')}
                  onMouseEnter={(e) => setHoveredCity({ city, value, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHoveredCity({ city, value, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                    backgroundColor: colorScale(value),
                    borderRadius: '50%',
                    opacity: isHovered ? 1 : 0.8,
                    border: isHovered ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.3)',
                    transform: `translate(-50%, -50%) scale(${isHovered ? 1.15 : 1})`,
                    zIndex: isHovered ? 200 : 100,
                    boxShadow: isHovered ? '0 0 20px rgba(249, 112, 102, 0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                />
              </Marker>
            );
          })}

        {/* Tooltips */}
        {hoverInfo && !selectedState && (
          <div
            className="fixed px-3 py-2 rounded-lg pointer-events-none z-50 bg-black/90 backdrop-blur-sm border border-white/10"
            style={{ left: hoverInfo.x + 12, top: hoverInfo.y - 10 }}
          >
            <div className="font-medium text-white text-sm">{hoverInfo.name}</div>
            <div className="text-white/60 text-xs">{hoverInfo.value} {hoverInfo.value === 1 ? 'person' : 'people'}</div>
          </div>
        )}
        {hoveredCity && (
          <div
            className="fixed px-3 py-2 rounded-lg z-50 pointer-events-none bg-black/90 backdrop-blur-sm border border-white/10"
            style={{ left: hoveredCity.x + 12, top: hoveredCity.y - 10 }}
          >
            <div className="font-medium text-white text-sm">{hoveredCity.city}</div>
            <div className="text-white/60 text-xs">{hoveredCity.value} people</div>
          </div>
        )}
      </MapGL>

      {/* Legend */}
      <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-black/80 backdrop-blur-md rounded-xl p-3 md:p-4 z-10 max-w-[180px] md:max-w-[220px] border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div>
            <div className="text-xs md:text-sm font-semibold text-white leading-tight">
              {selectedState || (selectedCountry && selectedCountry !== 'United States' ? selectedCountry : selectedCountry === 'United States' ? 'USA' : 'World')}
            </div>
            <div className="text-[10px] md:text-xs text-white/50">
              {selectedState || (selectedCountry && selectedCountry !== 'United States') ? 'Cities' : 'Alumni by region'}
            </div>
          </div>
        </div>
        {showSkeleton ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <Legend colorScale={colorScale} />
        )}
      </div>

      {/* Controls */}
      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={() => setViewState((s) => ({ ...s, zoom: Math.min(8, s.zoom * 1.2) }))}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewState((s) => ({ ...s, zoom: Math.max(1, s.zoom / 1.2) }))}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all z-10"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Back button */}
      {(selectedState || selectedCountry) && (
        <button
          onClick={handleBack}
          className="absolute top-3 right-14 md:top-4 md:right-16 px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition-all z-10 text-xs md:text-sm font-medium flex items-center gap-1.5"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{selectedState ? 'USA' : 'World'}</span>
        </button>
      )}
    </div>
  );
};
