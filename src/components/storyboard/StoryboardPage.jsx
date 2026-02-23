/**
 * StoryboardPage - Visual storyboard layout for shot planning
 * Placeholder for now
 */

import { LayoutGrid } from 'lucide-react'
import { Panel, PanelHeader, PanelContent } from '../layout'
import { EmptyState } from '../common'

export function StoryboardPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <Panel className="flex-1">
        <PanelHeader title="Storyboard" />
        <PanelContent className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={LayoutGrid}
            title="Storyboard Coming Soon"
            description="Visual storyboard layout for planning your shots and sequences."
          />
        </PanelContent>
      </Panel>
    </div>
  )
}
