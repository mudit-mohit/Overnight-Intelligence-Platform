'use client';

import React, { useState } from 'react';
import { SiteLocation, Event } from '@/data/simulatedEvents';
import { cn } from '@/lib/utils';

interface SiteMapProps {
  locations: SiteLocation[];
  events: Event[];
  selectedEvent?: Event | null;
  onEventSelect?: (event: Event) => void;
  onLocationSelect?: (location: SiteLocation) => void;
}

export default function SiteMap({ locations, events, selectedEvent, onEventSelect, onLocationSelect }: SiteMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getLocationTypeColor = (type: string, restricted: boolean) => {
    if (restricted) return '#dc2626';
    switch (type) {
      case 'gate': return '#22c55e';
      case 'storage_yard': return '#a855f7';
      case 'access_point': return '#06b6d4';
      case 'work_zone': return '#f97316';
      case 'perimeter': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <svg viewBox="0 0 650 600" className="w-full h-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#27272a" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Site boundary */}
        <rect x="20" y="20" width="610" height="560" fill="none" stroke="#3f3f46" strokeWidth="2" rx="10" />

        {/* Zone divisions */}
        <line x1="325" y1="20" x2="325" y2="580" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="20" y1="300" x2="630" y2="300" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />

        {/* Connections between locations */}
        {locations.map((loc, i) => {
          const nearbyLocations = locations.filter(other => {
            const dist = Math.sqrt(Math.pow(other.x - loc.x, 2) + Math.pow(other.y - loc.y, 2));
            return dist < 200 && other.id !== loc.id;
          });
          return nearbyLocations.map(other => (
            <line
              key={`${loc.id}-${other.id}`}
              x1={loc.x}
              y1={loc.y}
              x2={other.x}
              y2={other.y}
              stroke="#3f3f46"
              strokeWidth="1"
              opacity="0.3"
            />
          ));
        })}

        {/* Drone patrol routes */}
        <path
          d="M 100 200 L 200 350 L 300 300 L 150 450"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.5"
        />
        <path
          d="M 500 150 L 450 380 L 400 480 L 500 320"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.5"
        />

        {/* Locations */}
        {locations.map((location) => (
          <g
            key={location.id}
            onClick={() => onLocationSelect?.(location)}
            onMouseEnter={() => setHoveredLocation(location.id)}
            onMouseLeave={() => setHoveredLocation(null)}
            className="cursor-pointer"
          >
            {/* Location marker */}
            <circle
              cx={location.x}
              cy={location.y}
              r={12}
              fill={getLocationTypeColor(location.type, location.restricted)}
              opacity={hoveredLocation === location.id ? 1 : 0.7}
              stroke={hoveredLocation === location.id ? '#fff' : 'none'}
              strokeWidth="2"
            />
            {location.restricted && (
              <circle
                cx={location.x}
                cy={location.y}
                r={16}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
            )}
            {/* Location label */}
            <text
              x={location.x}
              y={location.y + 28}
              fill="#e4e4e7"
              fontSize="10"
              textAnchor="middle"
              className={hoveredLocation === location.id ? 'font-bold' : ''}
            >
              {location.name}
            </text>
          </g>
        ))}

        {/* Events */}
        {events.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          const pulseRadius = isSelected ? 20 : 15;
          return (
            <g
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                onEventSelect?.(event);
              }}
              className="cursor-pointer"
            >
              {/* Pulsing effect for selected event */}
              {isSelected && (
                <circle
                  cx={event.location.x}
                  cy={event.location.y}
                  r={pulseRadius}
                  fill={getEventColor(event.severity)}
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values="15;25;15"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0.1;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Event marker */}
              <circle
                cx={event.location.x}
                cy={event.location.y}
                r={8}
                fill={getEventColor(event.severity)}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 3 : 0}
              />
              {/* Event timestamp label */}
              <text
                x={event.location.x}
                y={event.location.y - 15}
                fill="#e4e4e7"
                fontSize="9"
                textAnchor="middle"
              >
                {event.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-zinc-800/90 p-3 rounded-lg border border-zinc-700">
        <h4 className="text-xs font-semibold text-zinc-300 mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-zinc-400">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-zinc-400">Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-400">Low Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-zinc-400">Gate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-zinc-400">Storage Yard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-red-500 border-dashed" />
            <span className="text-xs text-zinc-400">Restricted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500" />
            <span className="text-xs text-zinc-400">Drone Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
