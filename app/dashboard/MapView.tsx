'use client';
import { useEffect, useRef } from 'react';
import type { Complaint } from '@/lib/complaints';
import { getStatusColor, getStatusLabel } from '@/lib/complaints';

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
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (mapRef.current) return; // Already initialized

    const L = require('leaflet');

    // Initialize map centered on India
    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    // Dark OpenStreetMap tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when complaints change
  useEffect(() => {
    if (!mapRef.current) return;
    const L = require('leaflet');

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    complaints.forEach((c) => {
      if (!c.location.lat || !c.location.lng) return;
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

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 200px;">
          <div style="font-size: 11px; color: #8ba8c4; margin-bottom: 4px;">${c.id}</div>
          <div style="font-weight: 600; font-size: 14px; color: #e8f4fd; margin-bottom: 6px;">
            ${c.location.city}, ${c.location.state}
          </div>
          <div style="font-size: 12px; color: ${color}; font-weight: 600; margin-bottom: 8px;">
            ● ${getStatusLabel(c.status)}
          </div>
          <div style="font-size: 13px; color: #8ba8c4; line-height: 1.5;">
            ${c.description.slice(0, 80)}...
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #4a6480;">
            AI Confidence: ${c.aiVerification.confidence}%
          </div>
        </div>
      `);

      marker.on('click', () => onSelect(c));
      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
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
