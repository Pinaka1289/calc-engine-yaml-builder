import yaml from "js-yaml"
import { actionDefinitions } from "./action-definitions.js"

/**
 * @param {string} content
 * @returns {import('./types.js').YamlData}
 */
export function parseYaml(content) {
  try {
    const parsed = yaml.load(content)
    return parsed
  } catch (error) {
    console.error("Error parsing YAML:", error)
    throw error
  }
}

/**
 * @param {import('./types.js').YamlData} data
 * @returns {string}
 */
export function stringifyYaml(data) {
  try {
    return yaml.dump(data, { lineWidth: -1 })
  } catch (error) {
    console.error("Error stringifying YAML:", error)
    throw error
  }
}

/**
 * @param {string} content
 * @returns {{ errors: string[], data: import('./types.js').YamlData | null }}
 */
export function validateYaml(content) {
  const errors = []
  let data = null

  try {
    data = yaml.load(content)

    // Check if actions property exists and is an array
    if (!data || !data.actions || !Array.isArray(data.actions)) {
      errors.push("YAML must contain an 'actions' array")
      return { errors, data: null }
    }

    // Validate each action
    data.actions.forEach((action, index) => {
      if (!action.action) {
        errors.push(`Action at index ${index} is missing the 'action' property`)
        return
      }

      const actionType = action.action
      const definition = actionDefinitions.find((def) => def.name === actionType)

      if (!definition) {
        errors.push(`Unknown action type '${actionType}' at index ${index}`)
        return
      }

      // Check mandatory properties
      definition.mandatoryProps.forEach((prop) => {
        if (prop !== "action" && !action[prop]) {
          errors.push(`Action '${actionType}' at index ${index} is missing mandatory property '${prop}'`)
        }
      })
    })
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`YAML parsing error: ${error.message}`)
    } else {
      errors.push("Unknown YAML parsing error")
    }
    return { errors, data: null }
  }

  return { errors, data }
}

/**
 * @param {import('./types.js').ActionType[]} actions
 * @returns {{ source: string, target: string }[]}
 */
export function findRelationships(actions) {
  const relationships = []

  // Create a map of dataframe names to action indices
  const dataframeMap = {}

  actions.forEach((action, index) => {
    if (action.dataframe) {
      if (!dataframeMap[action.dataframe]) {
        dataframeMap[action.dataframe] = []
      }
      dataframeMap[action.dataframe].push(index)
    }
  })

  // Find relationships by checking if dataframe values are used in other actions
  actions.forEach((sourceAction, sourceIndex) => {
    const sourceDataframe = sourceAction.dataframe

    actions.forEach((targetAction, targetIndex) => {
      if (sourceIndex === targetIndex) return

      // Special case for Load actions: don't create circular relationships
      // when a dataframe value is referenced inside a Load action's dataframe value
      if (targetAction.action === "Load" && targetAction.dataframe === sourceDataframe) {
        return
      }

      // Check if the target action uses the source dataframe in any property
      const usesDataframe = Object.entries(targetAction).some(([key, value]) => {
        if (key === "action" || key === "name") return false

        if (typeof value === "string") {
          return value.includes(sourceDataframe)
        } else if (Array.isArray(value)) {
          return value.some((item) => typeof item === "string" && item.includes(sourceDataframe))
        }

        return false
      })

      if (usesDataframe) {
        relationships.push({
          source: `action-${sourceIndex}`,
          target: `action-${targetIndex}`,
        })
      }
    })
  })

  return relationships
}
