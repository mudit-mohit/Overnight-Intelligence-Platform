'use client';

import React, { useState, useEffect } from 'react';
import { Event, dronePatrolRoutes } from '@/data/simulatedEvents';

interface DronePatrolSimulationProps {
  events: Event[];
  onPatrolComplete?: (patrolId: string, findings: string) => void;
}

export default function DronePatrolSimulation({ events, onPatrolComplete }: DronePatrolSimulationProps) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [patrolProgress, setPatrolProgress] = useState(0);
  const [findings, setFindings] = useState<string[]>([]);

  const route = dronePatrolRoutes.find(r => r.id === selectedRoute);

  const startPatrol = (routeId: string) => {
    setSelectedRoute(routeId);
    setIsPatrolling(true);
    setCurrentWaypoint(0);
    setPatrolProgress(0);
    setFindings([]);
  };

  useEffect(() => {
    if (!isPatrolling || !route) return;

    const interval = setInterval(() => {
      setPatrolProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          setIsPatrolling(false);
          // Generate findings based on events in the patrol area
          const routeEvents = events.filter(e => {
            const waypoint = route.waypoints[0];
            const dist = Math.sqrt(
              Math.pow(e.location.x - waypoint.x, 2) + 
              Math.pow(e.location.y - waypoint.y, 2)
            );
            return dist < 200;
          });
          
          if (routeEvents.length > 0) {
            const newFindings = routeEvents.map(e => 
              `Checked ${e.location.name}: ${e.type} at ${e.timestamp.toLocaleTimeString()}`
            );
            setFindings(newFindings);
            onPatrolComplete?.(route.id, newFindings.join('; '));
          } else {
            setFindings(['No anomalies detected in patrol area']);
            onPatrolComplete?.(route.id, 'No anomalies detected');
          }
          return 100;
        }
        
        // Update waypoint
        const waypointIndex = Math.floor((newProgress / 100) * route.waypoints.length);
        setCurrentWaypoint(Math.min(waypointIndex, route.waypoints.length - 1));
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPatrolling, route, events, onPatrolComplete]);

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">Drone Patrol Simulation</h3>
      
      {!selectedRoute ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Select a patrol route to dispatch a drone:</p>
          {dronePatrolRoutes.map(route => (
            <button
              key={route.id}
              onClick={() => startPatrol(route.id)}
              disabled={isPatrolling}
              className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-left transition-colors disabled:opacity-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-zinc-200">{route.name}</div>
                  <div className="text-xs text-zinc-400">Duration: {route.duration} min</div>
                </div>
                <div className="text-zinc-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-200">{route?.name}</div>
              <div className="text-xs text-zinc-400">
                Waypoint {currentWaypoint + 1} of {route?.waypoints.length}
              </div>
            </div>
            {isPatrolling ? (
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm">Patrolling</span>
              </div>
            ) : (
              <div className="text-sm text-zinc-400">Complete</div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${patrolProgress}%` }}
            />
          </div>

          {/* Mini map visualization */}
          <div className="relative h-32 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
            <svg viewBox="0 0 600 200" className="w-full h-full">
              {route?.waypoints.map((wp, i) => (
                <g key={i}>
                  <circle
                    cx={wp.x / 1.2}
                    cy={wp.y / 3}
                    r={i <= currentWaypoint ? 6 : 4}
                    fill={i <= currentWaypoint ? '#22c55e' : '#3f3f46'}
                  />
                  {i < route.waypoints.length - 1 && (
                    <line
                      x1={wp.x / 1.2}
                      y1={wp.y / 3}
                      x2={route.waypoints[i + 1].x / 1.2}
                      y2={route.waypoints[i + 1].y / 3}
                      stroke={i < currentWaypoint ? '#22c55e' : '#3f3f46'}
                      strokeWidth={2}
                    />
                  )}
                </g>
              ))}
              {/* Drone icon */}
              {isPatrolling && route && (
                <g>
                  <circle
                    cx={route.waypoints[currentWaypoint].x / 1.2}
                    cy={route.waypoints[currentWaypoint].y / 3}
                    r={10}
                    fill="#22c55e"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      values="10;15;10"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.1;0.3"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )}
            </svg>
          </div>

          {/* Findings */}
          {!isPatrolling && findings.length > 0 && (
            <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
              <div className="text-sm font-medium text-zinc-200 mb-2">Patrol Findings:</div>
              <ul className="space-y-1">
                {findings.map((finding, i) => (
                  <li key={i} className="text-xs text-zinc-400">• {finding}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedRoute(null);
              setFindings([]);
            }}
            className="w-full p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
          >
            Select Different Route
          </button>
        </div>
      )}
    </div>
  );
}
