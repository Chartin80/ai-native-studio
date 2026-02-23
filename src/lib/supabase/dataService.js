/**
 * Data Service - Abstraction layer for storage
 * Uses Supabase when available, falls back to IndexedDB
 */

import { supabase, isSupabaseConfigured } from './client'
import * as localDb from '../db'

class DataService {
  // ==================== Projects ====================

  async createProject(project) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: project.id,
          name: project.name,
          script: project.script || '',
          characters: project.characters || [],
          locations: project.locations || [],
          scenes: project.scenes || [],
          assembly: project.assembly || { timeline: [] },
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        })
        .select()
        .single()

      if (error) throw error
      return this.normalizeProject(data)
    }
    return localDb.createProject(project)
  }

  async getProject(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return this.normalizeProject(data)
    }
    return localDb.getProject(id)
  }

  async getAllProjects() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data.map(p => this.normalizeProject(p))
    }
    return localDb.getAllProjects()
  }

  async updateProject(project) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          script: project.script,
          characters: project.characters,
          locations: project.locations,
          scenes: project.scenes,
          assembly: project.assembly,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .select()
        .single()

      if (error) throw error
      return this.normalizeProject(data)
    }
    return localDb.updateProject(project)
  }

  async deleteProject(id) {
    if (isSupabaseConfigured()) {
      // Delete associated assets first
      await supabase.from('assets').delete().eq('project_id', id)
      await supabase.from('generations').delete().eq('project_id', id)

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      return
    }
    return localDb.deleteProject(id)
  }

  // Normalize Supabase snake_case to camelCase
  normalizeProject(data) {
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      script: data.script || '',
      characters: data.characters || [],
      locations: data.locations || [],
      scenes: data.scenes || [],
      assembly: data.assembly || { timeline: [] },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  // ==================== Assets ====================

  async saveAsset(asset) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('assets')
        .upsert({
          id: asset.id,
          project_id: asset.projectId,
          type: asset.type,
          url: asset.url,
          metadata: asset.metadata || {},
          created_at: asset.createdAt || new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return this.normalizeAsset(data)
    }
    return localDb.saveAsset(asset)
  }

  async getAsset(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return this.normalizeAsset(data)
    }
    return localDb.getAsset(id)
  }

  async getAssetsByProject(projectId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(a => this.normalizeAsset(a))
    }
    return localDb.getAssetsByProject(projectId)
  }

  async deleteAsset(id) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) throw error
      return
    }
    return localDb.deleteAsset(id)
  }

  normalizeAsset(data) {
    if (!data) return null
    return {
      id: data.id,
      projectId: data.project_id,
      type: data.type,
      url: data.url,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    }
  }

  // ==================== Generations ====================

  async saveGeneration(generation) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('generations')
        .upsert({
          id: generation.id,
          project_id: generation.projectId,
          shot_id: generation.shotId,
          type: generation.type,
          prompt: generation.prompt,
          model: generation.model,
          provider: generation.provider,
          status: generation.status,
          output_url: generation.outputUrl,
          metadata: generation.metadata || {},
          created_at: generation.createdAt || new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return this.normalizeGeneration(data)
    }
    return localDb.saveGeneration(generation)
  }

  async getGenerationsByProject(projectId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(g => this.normalizeGeneration(g))
    }
    return localDb.getGenerationsByProject(projectId)
  }

  async getGenerationsByShot(shotId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('shot_id', shotId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(g => this.normalizeGeneration(g))
    }
    return localDb.getGenerationsByShot(shotId)
  }

  normalizeGeneration(data) {
    if (!data) return null
    return {
      id: data.id,
      projectId: data.project_id,
      shotId: data.shot_id,
      type: data.type,
      prompt: data.prompt,
      model: data.model,
      provider: data.provider,
      status: data.status,
      outputUrl: data.output_url,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    }
  }

  // ==================== Utility ====================

  isCloudEnabled() {
    return isSupabaseConfigured()
  }
}

export const dataService = new DataService()
