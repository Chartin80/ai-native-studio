import { getModels, getDefaultModel } from '@/lib/models'
import { Select } from './Select'

export function ModelSelector({
  category,
  value,
  onChange,
  label,
  className = '',
}) {
  const models = getModels(category)
  const defaultModel = getDefaultModel(category)

  const options = models.map((model) => ({
    value: model.id,
    label: model.name,
    description: model.description,
  }))

  const currentValue = value || defaultModel?.id

  return (
    <Select
      label={label}
      options={options}
      value={currentValue}
      onChange={onChange}
      className={className}
    />
  )
}
