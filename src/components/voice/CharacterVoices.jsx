import { Plus, User, Check } from 'lucide-react'
import { Button, Badge } from '../common'

export function CharacterVoices({
  characters,
  selectedCharacter,
  onSelectCharacter,
  onAddCharacter,
}) {
  return (
    <div className="border-b border-studio-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-studio-border">
        <h3 className="font-medium text-sm text-white/70">Characters</h3>
        <Button variant="ghost" size="sm" onClick={onAddCharacter}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-h-40 overflow-auto">
        {/* All voices option */}
        <button
          onClick={() => onSelectCharacter(null)}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 text-left
            border-b border-studio-border/50 transition-colors
            ${selectedCharacter === null
              ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary'
              : 'hover:bg-white/5'}
          `}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-white/50" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Standalone Voice</div>
            <div className="text-xs text-white/40">Not linked to character</div>
          </div>
          {selectedCharacter === null && <Check className="w-4 h-4 text-accent-primary" />}
        </button>

        {/* Character list */}
        {characters.map((character) => {
          const isSelected = selectedCharacter?.id === character.id

          return (
            <button
              key={character.id}
              onClick={() => onSelectCharacter(character)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                border-b border-studio-border/50 transition-colors
                ${isSelected
                  ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary'
                  : 'hover:bg-white/5'}
              `}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 flex items-center justify-center overflow-hidden">
                {character.referenceImages?.length > 0 ? (
                  <img
                    src={character.referenceImages[0]}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {character.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{character.name}</div>
                {character.role && (
                  <div className="text-xs text-white/40 truncate">{character.role}</div>
                )}
              </div>

              {/* Voice assignment indicator */}
              {character.voiceId && (
                <Badge variant="default" className="text-xs">
                  Voice set
                </Badge>
              )}

              {isSelected && <Check className="w-4 h-4 text-accent-primary" />}
            </button>
          )
        })}

        {characters.length === 0 && (
          <div className="px-4 py-6 text-center text-white/40">
            <User className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No characters yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
