'use client';
import { useEffect, useRef } from 'react';
import type { Complaint } from '@/lib/complaints';
import { getStatusLabel } from '@/lib/complaints';
import type * as LeafletType from 'leaflet';

interface MapViewProps {
  complaints: Complaint[];
  selected: Complaint | null;
  onSelect: (c: Complaint) => void;
}

const STATUS_COLORS: Record<string, string> = {
  filed: '#8ba8c4',
  acknowledged: '#00b4d8',
  investigating: '#ffd166',
  action_taken: '#f4845f',
  resolved: '#06d6a0',
};

export default function MapView({ complaints, selected, onSelect }: MapViewProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const markersRef = useRef<LeafletType.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (mapRef.current) return;

    let isMounted = true;
    import('leaflet').then((leafletModule) => {
      if (!isMounted || !containerRef.current) return;
      const L = leafletModule.default || leafletModule;

      const map = L.map(containerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      mapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when complaints change
  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      if (!mapRef.current) return;

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      complaints.forEach((c) => {
        if (!Number.isFinite(c.location.lat) || !Number.isFinite(c.location.lng)) return;
        const color = STATUS_COLORS[c.status] || '#8ba8c4';

        // Custom SVG marker
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 28px; height: 28px;
              background: ${color};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 12px ${color}80;
              display: flex; align-items: center; justify-content: center;
            ">
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([c.location.lat, c.location.lng], { icon });

        const popup = document.createElement('div');
        popup.style.fontFamily = 'sans-serif';
        popup.style.minWidth = '200px';

        const addPopupLine = (text: string, style: Partial<CSSStyleDeclaration>) => {
          const line = document.createElement('div');
          line.textContent = text;
          Object.assign(line.style, style);
          popup.appendChild(line);
        };

        addPopupLine(c.id, { fontSize: '11px', color: '#8ba8c4', marginBottom: '4px' });
        addPopupLine(`${c.location.city}, ${c.location.state}`, {
          fontWeight: '600', fontSize: '14px', color: '#e8f4fd', marginBottom: '6px',
        });
        addPopupLine(`● ${getStatusLabel(c.status)}`, {
          fontSize: '12px', color, fontWeight: '600', marginBottom: '8px',
        });
        addPopupLine(c.description.length > 80 ? `${c.description.slice(0, 80)}...` : c.description, {
          fontSize: '13px', color: '#8ba8c4', lineHeight: '1.5',
        });
        addPopupLine(`AI Confidence: ${c.aiVerification.confidence}%`, {
          marginTop: '10px', fontSize: '11px', color: '#4a6480',
        });

        marker.bindPopup(popup);

        marker.on('click', () => onSelect(c));
        marker.addTo(mapRef.current!);
        markersRef.current.push(marker);
      });
    });
  }, [complaints, onSelect]);

  // Pan to selected
  useEffect(() => {
    if (!mapRef.current || !selected) return;
    mapRef.current.flyTo([selected.location.lat, selected.location.lng], 13, {
      animate: true,
      duration: 1.2,
    });
  }, [selected]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        borderRadius: '16px',
      }}
    />
  );
}
