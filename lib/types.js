// Action type definitions as constants
export const ACTION_NAMES = {
  EXTRACT: "Extract",
  EXECUTE: "Execute",
  TRANSFORM: "Transform",
  LOAD: "Load",
  MERGE: "Merge",
  PURGE: "Purge",
  S3_REPLICATE: "S3Replicate",
  INCLUDE: "Include",
}

// JSDoc type definitions for better IDE support
/**
 * @typedef {Object} BaseAction
 * @property {string} action - The action type
 * @property {string} name - The action name
 * @property {string} dataframe - The dataframe name
 */

/**
 * @typedef {Object} ExtractAction
 * @property {"Extract"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string} location
 * @property {string} [tableName]
 * @property {string} [databaseName]
 */

/**
 * @typedef {Object} ExecuteAction
 * @property {"Execute"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string} script
 * @property {string} [output]
 */

/**
 * @typedef {Object} TransformAction
 * @property {"Transform"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string[]} transformations
 */

/**
 * @typedef {Object} LoadAction
 * @property {"Load"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string} destination
 */

/**
 * @typedef {Object} MergeAction
 * @property {"Merge"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string[]} sources
 */

/**
 * @typedef {Object} PurgeAction
 * @property {"Purge"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string} target
 */

/**
 * @typedef {Object} S3ReplicateAction
 * @property {"S3Replicate"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string} source
 * @property {string} destination
 */

/**
 * @typedef {Object} IncludeAction
 * @property {"Include"} action
 * @property {string} name
 * @property {string} dataframe
 * @property {string} path
 */

/**
 * @typedef {ExtractAction|ExecuteAction|TransformAction|LoadAction|MergeAction|PurgeAction|S3ReplicateAction|IncludeAction} ActionType
 */

/**
 * @typedef {Object} YamlData
 * @property {ActionType[]} actions
 */

/**
 * @typedef {Object} ActionDefinition
 * @property {string} name
 * @property {string} color
 * @property {string} icon
 * @property {string[]} mandatoryProps
 * @property {string[]} optionalProps
 */

/**
 * @typedef {Object} FlowNode
 * @property {string} id
 * @property {string} type
 * @property {Object} data
 * @property {ActionType} data.action
 * @property {Object} position
 * @property {number} position.x
 * @property {number} position.y
 */

/**
 * @typedef {Object} FlowEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {boolean} animated
 */
