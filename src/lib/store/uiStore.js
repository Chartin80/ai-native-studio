/**
 * UI Store - Zustand store for UI state
 */

import { create } from 'zustand'

export const useUIStore = create((set, get) => ({
  // Sidebar state
  sidebarOpen: true,
  sidebarTab: 'scenes', // 'scenes' | 'characters' | 'locations'

  // Modal state
  activeModal: null,
  modalData: null,

  // Panel state
  leftPanelWidth: 280,
  rightPanelWidth: 320,

  // View state
  viewMode: 'grid', // 'grid' | 'list'
  previewMode: 'fit', // 'fit' | 'fill' | 'original'

  // Selection state
  selectedItems: [],

  // Notification state
  notifications: [],

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  // Modal actions
  openModal: (modalName, data = null) =>
    set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Panel actions
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),

  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setPreviewMode: (mode) => set({ previewMode: mode }),

  // Selection actions
  setSelectedItems: (items) => set({ selectedItems: items }),
  toggleItemSelection: (itemId) =>
    set((state) => ({
      selectedItems: state.selectedItems.includes(itemId)
        ? state.selectedItems.filter((id) => id !== itemId)
        : [...state.selectedItems, itemId],
    })),
  clearSelection: () => set({ selectedItems: [] }),

  // Notification actions
  addNotification: (notification) => {
    const id = Date.now().toString()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    }

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))

    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, newNotification.duration)
    }

    return id
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}))
