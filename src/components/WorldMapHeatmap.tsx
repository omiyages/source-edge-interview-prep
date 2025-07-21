
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CountryData {
  name: string;
  value: number;
  coordinates: [number, number];
}

interface WorldMapHeatmapProps {
  data: Array<{ name: string; value: number; }>;
}

export const WorldMapHeatmap: React.FC<WorldMapHeatmapProps> = ({ data }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  // Country coordinates mapping
  const countryCoordinates: Record<string, [number, number]> = {
    'Japan': [138.2529, 36.2048],
    'United States': [-95.7129, 37.0902],
    'United Kingdom': [-3.4360, 55.3781],
    'Canada': [-106.3468, 56.1304],
    'Australia': [133.7751, -25.2744],
    'Germany': [10.4515, 51.1657],
    'France': [2.2137, 46.2276],
    'South Korea': [127.7669, 35.9078],
    'Singapore': [103.8198, 1.3521],
    'Philippines': [121.7740, 12.8797],
    'India': [78.9629, 20.5937],
    'Brazil': [-51.9253, -14.2350],
  };

  const countryData: CountryData[] = data.map(item => ({
    ...item,
    coordinates: countryCoordinates[item.name] || [0, 0]
  })).filter(item => item.coordinates[0] !== 0 || item.coordinates[1] !== 0);

  const maxValue = Math.max(...countryData.map(d => d.value));

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        zoom: 1.5,
        center: [20, 20],
      });

      map.current.on('load', () => {
        // Add markers for each country
        countryData.forEach((country) => {
          const size = Math.max(10, (country.value / maxValue) * 50);
          const opacity = Math.max(0.4, country.value / maxValue);

          // Create a marker element
          const marker = document.createElement('div');
          marker.className = 'bubble-marker';
          marker.style.width = `${size}px`;
          marker.style.height = `${size}px`;
          marker.style.backgroundColor = `rgba(59, 130, 246, ${opacity})`;
          marker.style.borderRadius = '50%';
          marker.style.border = '2px solid #fff';
          marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          marker.style.cursor = 'pointer';
          marker.style.display = 'flex';
          marker.style.alignItems = 'center';
          marker.style.justifyContent = 'center';
          marker.style.color = 'white';
          marker.style.fontSize = '10px';
          marker.style.fontWeight = 'bold';
          marker.textContent = country.value.toString();

          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${country.name}</h3>
                <p class="text-sm">${country.value} candidates</p>
              </div>
            `);

          // Add marker to map
          new mapboxgl.Marker(marker)
            .setLngLat(country.coordinates)
            .setPopup(popup)
            .addTo(map.current!);
        });
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      initializeMap(mapboxToken.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  if (showTokenInput) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To display the world map, please enter your Mapbox public token. 
            You can get one from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a>
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleTokenSubmit} className="space-y-3">
          <div>
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="text"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiaWQiOiJhYmMxMjMifQ..."
              className="font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={!mapboxToken.trim()}
          >
            Load Map
          </button>
        </form>

        {/* Fallback table view */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Country Distribution (Table View)</h4>
          <div className="space-y-2">
            {countryData.map((country, index) => (
              <div key={country.name} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="font-medium">{country.name}</span>
                <span className="text-sm text-muted-foreground">{country.value} candidates</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowTokenInput(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Change Mapbox Token
      </button>
      <div ref={mapContainer} className="w-full h-[400px] rounded-lg border" />
      <div className="text-xs text-muted-foreground">
        Bubble size represents candidate count. Click bubbles for details.
      </div>
    </div>
  );
};
