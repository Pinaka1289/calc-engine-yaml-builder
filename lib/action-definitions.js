import { ACTION_NAMES } from "./types.js"

/**
 * @type {import('./types.js').ActionDefinition[]}
 */
export const actionDefinitions = [
  {
    name: ACTION_NAMES.EXTRACT,
    color: "#4CAF50", // Green
    icon: "database",
    mandatoryProps: ["action", "name", "dataframe", "location"],
    optionalProps: ["tableName", "databaseName"],
  },
  {
    name: ACTION_NAMES.EXECUTE,
    color: "#2196F3", // Blue
    icon: "play",
    mandatoryProps: ["action", "name", "dataframe", "script"],
    optionalProps: ["output"],
  },
  {
    name: ACTION_NAMES.TRANSFORM,
    color: "#FF9800", // Orange
    icon: "refresh-cw",
    mandatoryProps: ["action", "name", "dataframe", "transformations"],
    optionalProps: ["options"],
  },
  {
    name: ACTION_NAMES.LOAD,
    color: "#9C27B0", // Purple
    icon: "upload",
    mandatoryProps: ["action", "name", "dataframe", "destination"],
    optionalProps: ["format", "options"],
  },
  {
    name: ACTION_NAMES.MERGE,
    color: "#F44336", // Red
    icon: "git-merge",
    mandatoryProps: ["action", "name", "dataframe", "sources"],
    optionalProps: ["strategy", "options"],
  },
  {
    name: ACTION_NAMES.PURGE,
    color: "#795548", // Brown
    icon: "trash-2",
    mandatoryProps: ["action", "name", "dataframe", "target"],
    optionalProps: ["options"],
  },
  {
    name: ACTION_NAMES.S3_REPLICATE,
    color: "#607D8B", // Blue Grey
    icon: "copy",
    mandatoryProps: ["action", "name", "dataframe", "source", "destination"],
    optionalProps: ["options"],
  },
  {
    name: ACTION_NAMES.INCLUDE,
    color: "#009688", // Teal
    icon: "file-plus",
    mandatoryProps: ["action", "name", "dataframe", "path"],
    optionalProps: ["options"],
  },
]

/**
 * @param {string} actionName
 * @returns {import('./types.js').ActionDefinition | undefined}
 */
export function getActionDefinition(actionName) {
  return actionDefinitions.find((def) => def.name === actionName)
}

/**
 * @param {string} actionName
 * @returns {string}
 */
export function getActionIcon(actionName) {
  const definition = getActionDefinition(actionName)
  return definition ? definition.icon : "help-circle"
}

/**
 * @param {string} actionName
 * @returns {string}
 */
export function getActionColor(actionName) {
  const definition = getActionDefinition(actionName)
  return definition ? definition.color : "#999999"
}

/**
 * @param {string} actionName
 * @returns {string[]}
 */
export function getMandatoryProps(actionName) {
  const definition = getActionDefinition(actionName)
  return definition ? definition.mandatoryProps : []
}

/**
 * @param {string} actionName
 * @returns {string[]}
 */
export function getOptionalProps(actionName) {
  const definition = getActionDefinition(actionName)
  return definition ? definition.optionalProps : []
}
