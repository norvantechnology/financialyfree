'use client';

export interface StaticSnapshotBannerProps {
  datasetNote?: string;
  sourceNote?: string;
  datasetName?: string;
  sourceNotes?: string;
}

export function StaticSnapshotBanner(_props?: StaticSnapshotBannerProps) {
  // Suppress static banner from main body canvas  the topbar status indicator
  // already provides the discreet snapshot telemetry without cluttering mobile screens.
  return null;
}
