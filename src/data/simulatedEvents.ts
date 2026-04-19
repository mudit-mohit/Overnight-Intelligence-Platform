export interface SiteLocation {
  id: string;
  name: string;
  type: 'gate' | 'storage_yard' | 'access_point' | 'work_zone' | 'perimeter';
  x: number;
  y: number;
  restricted: boolean;
}

export interface Event {
  id: string;
  type: 'fence_alert' | 'vehicle_path' | 'badge_swipe' | 'drone_patrol' | 'motion_detected';
  timestamp: Date;
  location: SiteLocation;
  severity: 'low' | 'medium' | 'high';
  description: string;
  details?: any;
  relatedEventIds?: string[];
  confidence: number;
  aiAssessment?: {
    classification: string;
    riskLevel: 'harmless' | 'uncertain' | 'escalation';
    reasoning: string;
    requiresFollowUp: boolean;
    suggestedAction?: string;
  };
  humanReview?: {
    status: 'pending' | 'approved' | 'overridden' | 'needs_investigation';
    reviewer?: string;
    notes?: string;
    timestamp?: Date;
  };
}

export const siteLocations: SiteLocation[] = [
  { id: 'gate-1', name: 'Gate 1', type: 'gate', x: 100, y: 200, restricted: false },
  { id: 'gate-2', name: 'Gate 2', type: 'gate', x: 300, y: 200, restricted: false },
  { id: 'gate-3', name: 'Gate 3', type: 'gate', x: 500, y: 150, restricted: false },
  { id: 'storage-a', name: 'Storage Yard A', type: 'storage_yard', x: 200, y: 350, restricted: true },
  { id: 'storage-b', name: 'Storage Yard B', type: 'storage_yard', x: 450, y: 380, restricted: true },
  { id: 'access-1', name: 'Access Point 1', type: 'access_point', x: 150, y: 450, restricted: false },
  { id: 'access-2', name: 'Access Point 2', type: 'access_point', x: 400, y: 480, restricted: true },
  { id: 'work-zone-1', name: 'Work Zone 1', type: 'work_zone', x: 250, y: 300, restricted: false },
  { id: 'work-zone-2', name: 'Work Zone 2', type: 'work_zone', x: 500, y: 320, restricted: true },
  { id: 'perimeter-n', name: 'Perimeter North', type: 'perimeter', x: 300, y: 50, restricted: false },
  { id: 'perimeter-s', name: 'Perimeter South', type: 'perimeter', x: 300, y: 550, restricted: false },
  { id: 'perimeter-e', name: 'Perimeter East', type: 'perimeter', x: 600, y: 300, restricted: false },
  { id: 'perimeter-w', name: 'Perimeter West', type: 'perimeter', x: 50, y: 300, restricted: false },
];

export const overnightEvents: Event[] = [
  {
    id: 'evt-001',
    type: 'fence_alert',
    timestamp: new Date('2026-04-17T01:23:00'),
    location: siteLocations.find(l => l.id === 'gate-3')!,
    severity: 'medium',
    description: 'Fence vibration detected near Gate 3',
    details: { duration: '2.3s', intensity: 'moderate' },
    confidence: 0.65,
  },
  {
    id: 'evt-002',
    type: 'vehicle_path',
    timestamp: new Date('2026-04-17T01:45:00'),
    location: siteLocations.find(l => l.id === 'storage-b')!,
    severity: 'high',
    description: 'Unauthorized vehicle detected near Storage Yard B',
    details: { vehicleType: 'unknown', path: 'approaching from east' },
    confidence: 0.78,
  },
  {
    id: 'evt-003',
    type: 'badge_swipe',
    timestamp: new Date('2026-04-17T02:15:00'),
    location: siteLocations.find(l => l.id === 'access-2')!,
    severity: 'medium',
    description: 'Failed badge swipe at Access Point 2',
    details: { badgeId: 'masked', attempts: 1 },
    confidence: 0.95,
  },
  {
    id: 'evt-004',
    type: 'badge_swipe',
    timestamp: new Date('2026-04-17T02:17:00'),
    location: siteLocations.find(l => l.id === 'access-2')!,
    severity: 'medium',
    description: 'Failed badge swipe at Access Point 2',
    details: { badgeId: 'masked', attempts: 2 },
    confidence: 0.95,
  },
  {
    id: 'evt-005',
    type: 'badge_swipe',
    timestamp: new Date('2026-04-17T02:19:00'),
    location: siteLocations.find(l => l.id === 'access-2')!,
    severity: 'high',
    description: 'Failed badge swipe at Access Point 2',
    details: { badgeId: 'masked', attempts: 3 },
    confidence: 0.95,
    relatedEventIds: ['evt-003', 'evt-004'],
  },
  {
    id: 'evt-006',
    type: 'drone_patrol',
    timestamp: new Date('2026-04-17T03:30:00'),
    location: siteLocations.find(l => l.id === 'storage-b')!,
    severity: 'low',
    description: 'Drone patrol completed over Storage Yard B',
    details: { route: 'standard-b', duration: '12min', findings: 'no anomalies' },
    confidence: 0.98,
    relatedEventIds: ['evt-002'],
  },
  {
    id: 'evt-007',
    type: 'motion_detected',
    timestamp: new Date('2026-04-17T04:10:00'),
    location: siteLocations.find(l => l.id === 'work-zone-1')!,
    severity: 'low',
    description: 'Motion detected in Work Zone 1',
    details: { source: 'infrared', pattern: 'periodic' },
    confidence: 0.45,
  },
  {
    id: 'evt-008',
    type: 'fence_alert',
    timestamp: new Date('2026-04-17T05:00:00'),
    location: siteLocations.find(l => l.id === 'perimeter-n')!,
    severity: 'low',
    description: 'Minor fence vibration - likely wind',
    details: { duration: '0.5s', intensity: 'low', weather: 'windy' },
    confidence: 0.85,
  },
];

export const dronePatrolRoutes = [
  {
    id: 'route-1',
    name: 'Standard Route A',
    waypoints: [
      { x: 100, y: 200 },
      { x: 200, y: 350 },
      { x: 300, y: 300 },
      { x: 150, y: 450 },
    ],
    duration: 15,
  },
  {
    id: 'route-2',
    name: 'Standard Route B',
    waypoints: [
      { x: 500, y: 150 },
      { x: 450, y: 380 },
      { x: 400, y: 480 },
      { x: 500, y: 320 },
    ],
    duration: 12,
  },
];
