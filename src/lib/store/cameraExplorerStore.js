/**
 * Camera Explorer Store
 * Manages state for 3D reconstruction, camera navigation, and snapshot capture
 */

import { create } from 'zustand'
import { generateId } from '../utils'
import { DEFAULT_LENS } from '../camera/lensPresets'

export const useCameraExplorerStore = create((set, get) => ({
  // ============================================
  // Reconstruction State
  // ============================================
  reconstructionStatus: 'idle', // 'idle' | 'processing' | 'completed' | 'error'
  reconstructionError: null,
  plyUrl: null,
  sourceKeyframeId: null,
  sourceKeyframeUrl: null,

  // ============================================
  // Camera State
  // ============================================
  cameraPosition: { x: 0, y: 0, z: 5 },
  cameraRotation: { x: 0, y: 0, z: 0 }, // Euler angles
  selectedLens: DEFAULT_LENS,
  showGrid: false,
  showHUD: true,

  // ============================================
  // Snapshots
  // ============================================
  snapshots: [],
  selectedSnapshotId: null,

  // ============================================
  // Frame Generation State
  // ============================================
  generationStatus: 'idle', // 'idle' | 'generating' | 'completed' | 'error'
  generationError: null,
  generatedFrameUrl: null,

  // ============================================
  // Reconstruction Actions
  // ============================================

  setReconstructionProcessing: (keyframeId, keyframeUrl) => {
    set({
      reconstructionStatus: 'processing',
      reconstructionError: null,
      plyUrl: null,
      sourceKeyframeId: keyframeId,
      sourceKeyframeUrl: keyframeUrl,
      // Reset camera and snapshots for new reconstruction
      cameraPosition: { x: 0, y: 0, z: 5 },
      cameraRotation: { x: 0, y: 0, z: 0 },
      snapshots: [],
      selectedSnapshotId: null,
    })
  },

  setReconstructionCompleted: (plyUrl) => {
    set({
      reconstructionStatus: 'completed',
      reconstructionError: null,
      plyUrl,
    })
  },

  setReconstructionError: (error) => {
    set({
      reconstructionStatus: 'error',
      reconstructionError: error,
      plyUrl: null,
    })
  },

  resetReconstruction: () => {
    set({
      reconstructionStatus: 'idle',
      reconstructionError: null,
      plyUrl: null,
      sourceKeyframeId: null,
      sourceKeyframeUrl: null,
      snapshots: [],
      selectedSnapshotId: null,
    })
  },

  // ============================================
  // Camera Actions
  // ============================================

  updateCameraPosition: (position) => {
    set({ cameraPosition: position })
  },

  updateCameraRotation: (rotation) => {
    set({ cameraRotation: rotation })
  },

  setSelectedLens: (lens) => {
    set({ selectedLens: lens })
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }))
  },

  toggleHUD: () => {
    set((state) => ({ showHUD: !state.showHUD }))
  },

  resetCamera: () => {
    set({
      cameraPosition: { x: 0, y: 0, z: 5 },
      cameraRotation: { x: 0, y: 0, z: 0 },
      selectedLens: DEFAULT_LENS,
    })
  },

  // ============================================
  // Snapshot Actions
  // ============================================

  captureSnapshot: (thumbnailDataUrl, cameraState) => {
    const snapshot = {
      id: generateId(),
      thumbnailDataUrl,
      position: { ...cameraState.position },
      rotation: { ...cameraState.rotation },
      lens: get().selectedLens,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
      selectedSnapshotId: snapshot.id,
    }))

    return snapshot
  },

  selectSnapshot: (snapshotId) => {
    set({ selectedSnapshotId: snapshotId })
  },

  deleteSnapshot: (snapshotId) => {
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== snapshotId),
      selectedSnapshotId:
        state.selectedSnapshotId === snapshotId ? null : state.selectedSnapshotId,
    }))
  },

  clearSnapshots: () => {
    set({
      snapshots: [],
      selectedSnapshotId: null,
    })
  },

  getSelectedSnapshot: () => {
    const { snapshots, selectedSnapshotId } = get()
    return snapshots.find((s) => s.id === selectedSnapshotId) || null
  },

  // ============================================
  // Frame Generation Actions
  // ============================================

  setGenerationProcessing: () => {
    set({
      generationStatus: 'generating',
      generationError: null,
      generatedFrameUrl: null,
    })
  },

  setGenerationCompleted: (frameUrl) => {
    set({
      generationStatus: 'completed',
      generationError: null,
      generatedFrameUrl: frameUrl,
    })
  },

  setGenerationError: (error) => {
    set({
      generationStatus: 'error',
      generationError: error,
    })
  },

  resetGeneration: () => {
    set({
      generationStatus: 'idle',
      generationError: null,
      generatedFrameUrl: null,
    })
  },

  // ============================================
  // Full Reset
  // ============================================

  clearAll: () => {
    set({
      reconstructionStatus: 'idle',
      reconstructionError: null,
      plyUrl: null,
      sourceKeyframeId: null,
      sourceKeyframeUrl: null,
      cameraPosition: { x: 0, y: 0, z: 5 },
      cameraRotation: { x: 0, y: 0, z: 0 },
      selectedLens: DEFAULT_LENS,
      showGrid: false,
      showHUD: true,
      snapshots: [],
      selectedSnapshotId: null,
      generationStatus: 'idle',
      generationError: null,
      generatedFrameUrl: null,
    })
  },
}))
