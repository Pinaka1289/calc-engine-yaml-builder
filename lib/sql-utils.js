/**
 * SQL formatting and validation utilities using sql-formatter package
 */
import { format } from "sql-formatter"

// SQL keywords for detection (keeping this for SQL detection logic)
const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "OUTER",
  "ON",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "TABLE",
  "ALTER",
  "DROP",
  "INDEX",
  "VIEW",
  "PROCEDURE",
  "FUNCTION",
  "TRIGGER",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "ORDER",
  "BY",
  "GROUP",
  "HAVING",
  "DISTINCT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "AS",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "WITH",
  "RECURSIVE",
  "LIMIT",
  "OFFSET",
  "TOP",
]

/**
 * Detects if a string contains SQL syntax
 * @param {string} text - The text to analyze
 * @returns {boolean} - True if SQL syntax is detected
 */
export function detectSQLSyntax(text) {
  if (!text || typeof text !== "string") return false

  const upperText = text.toUpperCase()

  // Check for common SQL patterns
  const sqlPatterns = [
    /\bSELECT\s+.*\s+FROM\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+.*\s+SET\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+(TABLE|VIEW|INDEX)\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+(TABLE|VIEW|INDEX)\b/i,
    /\bWHERE\s+.*=/i,
    /\bJOIN\s+.*\s+ON\b/i,
  ]

  // Check if any SQL pattern matches
  const hasPattern = sqlPatterns.some((pattern) => pattern.test(text))

  // Check for SQL keywords (at least 2 keywords for better accuracy)
  const keywordCount = SQL_KEYWORDS.filter((keyword) => upperText.includes(keyword)).length

  return hasPattern || keywordCount >= 2
}

/**
 * Formats SQL text using sql-formatter package
 * @param {string} sql - The SQL text to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted SQL text
 */
export function formatSQL(sql, options = {}) {
  if (!sql || typeof sql !== "string") return sql

  try {
    const defaultOptions = {
      language: "sql",
      tabWidth: 2,
      useTabs: false,
      keywordCase: "upper",
      identifierCase: "preserve",
      functionCase: "upper",
      dataTypeCase: "upper",
      linesBetweenQueries: 2,
      denseOperators: false,
      newlineBeforeOpeningParenthesis: false,
      newlineBeforeClosingParenthesis: false,
      ...options,
    }

    return format(sql, defaultOptions)
  } catch (error) {
    console.warn("SQL formatting failed:", error.message)
    // Return original SQL if formatting fails
    return sql
  }
}

/**
 * Validates SQL syntax using sql-formatter's parsing capability
 * @param {string} sql - The SQL text to validate
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateSQL(sql) {
  const errors = []
  const warnings = []

  if (!sql || typeof sql !== "string") {
    return { isValid: true, errors, warnings }
  }

  // Try to format the SQL to check for syntax errors
  try {
    format(sql)
  } catch (error) {
    errors.push(`SQL syntax error: ${error.message}`)
  }

  const upperSQL = sql.toUpperCase()

  // Basic validation checks that sql-formatter doesn't cover

  // Check for unmatched parentheses
  const openParens = (sql.match(/\(/g) || []).length
  const closeParens = (sql.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push("Unmatched parentheses in SQL statement")
  }

  // Check for unmatched quotes
  const singleQuotes = (sql.match(/(?<!\\)'/g) || []).length
  const doubleQuotes = (sql.match(/(?<!\\)"/g) || []).length
  if (singleQuotes % 2 !== 0) {
    errors.push("Unmatched single quotes in SQL statement")
  }
  if (doubleQuotes % 2 !== 0) {
    errors.push("Unmatched double quotes in SQL statement")
  }

  // Check for SELECT without FROM (except for certain cases)
  if (upperSQL.includes("SELECT") && !upperSQL.includes("FROM")) {
    if (!upperSQL.match(/SELECT\s+(@@|GETDATE|CURRENT_|NOW)/i)) {
      warnings.push("SELECT statement without FROM clause")
    }
  }

  // Check for missing WHERE in UPDATE/DELETE
  if (upperSQL.includes("UPDATE") && upperSQL.includes("SET") && !upperSQL.includes("WHERE")) {
    warnings.push("UPDATE statement without WHERE clause - this will affect all rows")
  }
  if (upperSQL.includes("DELETE FROM") && !upperSQL.includes("WHERE")) {
    warnings.push("DELETE statement without WHERE clause - this will delete all rows")
  }

  // Check for proper JOIN syntax
  const joinMatches = upperSQL.match(/JOIN\s+\w+/g)
  if (joinMatches) {
    joinMatches.forEach((joinMatch) => {
      const afterJoin = upperSQL.substring(upperSQL.indexOf(joinMatch) + joinMatch.length)
      if (!afterJoin.includes("ON") && !afterJoin.includes("USING")) {
        warnings.push(`JOIN clause missing ON condition: ${joinMatch}`)
      }
    })
  }

  // Check for SQL injection patterns
  const injectionPatterns = [/;\s*(DROP|DELETE|UPDATE|INSERT)/i, /UNION\s+SELECT/i, /--\s*$/m, /\/\*.*\*\//]

  injectionPatterns.forEach((pattern) => {
    if (pattern.test(sql)) {
      warnings.push("Potential SQL injection pattern detected")
    }
  })

  // Check for deprecated syntax
  if (upperSQL.includes("*=") || upperSQL.includes("=*")) {
    warnings.push("Deprecated outer join syntax detected, use explicit JOIN syntax")
  }

  // Check for missing semicolon at end (for multi-statement scripts)
  if (sql.split(";").length > 1 && !sql.trim().endsWith(";")) {
    warnings.push("Consider ending SQL statements with semicolon")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Identifies SQL properties in action objects
 * @param {Object} action - The action object to analyze
 * @returns {string[]} - Array of property names that contain SQL
 */
export function identifySQLProperties(action) {
  const sqlProperties = []

  if (!action || typeof action !== "object") return sqlProperties

  // Common property names that might contain SQL
  const potentialSQLProps = [
    "script",
    "query",
    "sql",
    "command",
    "statement",
    "procedure",
    "transformation",
    "transformations",
    "condition",
    "filter",
    "select",
    "where",
    "join",
    "subquery",
  ]

  Object.entries(action).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 10) {
      // Check if property name suggests SQL content
      const keyLower = key.toLowerCase()
      const nameContainsSQL = potentialSQLProps.some((prop) => keyLower.includes(prop))

      // Check if value contains SQL syntax
      const valueContainsSQL = detectSQLSyntax(value)

      if (nameContainsSQL || valueContainsSQL) {
        sqlProperties.push(key)
      }
    } else if (Array.isArray(value)) {
      // Check array elements for SQL
      const hasSQL = value.some((item) => typeof item === "string" && detectSQLSyntax(item))
      if (hasSQL) {
        sqlProperties.push(key)
      }
    }
  })

  return sqlProperties
}

/**
 * Auto-formats SQL properties in an action object
 * @param {Object} action - The action object to process
 * @param {Object} formatOptions - Formatting options for sql-formatter
 * @returns {Object} - Action object with formatted SQL properties
 */
export function autoFormatSQLInAction(action, formatOptions = {}) {
  if (!action || typeof action !== "object") return action

  const formattedAction = { ...action }
  const sqlProperties = identifySQLProperties(action)

  sqlProperties.forEach((prop) => {
    const value = formattedAction[prop]

    if (typeof value === "string") {
      formattedAction[prop] = formatSQL(value, formatOptions)
    } else if (Array.isArray(value)) {
      formattedAction[prop] = value.map((item) =>
        typeof item === "string" && detectSQLSyntax(item) ? formatSQL(item, formatOptions) : item,
      )
    }
  })

  return formattedAction
}

/**
 * Validates all SQL properties in an action object
 * @param {Object} action - The action object to validate
 * @returns {{ isValid: boolean, errors: string[], warnings: string[], sqlProperties: string[] }}
 */
export function validateSQLInAction(action) {
  const allErrors = []
  const allWarnings = []
  const sqlProperties = identifySQLProperties(action)

  sqlProperties.forEach((prop) => {
    const value = action[prop]

    if (typeof value === "string") {
      const validation = validateSQL(value)
      validation.errors.forEach((error) => allErrors.push(`${prop}: ${error}`))
      validation.warnings.forEach((warning) => allWarnings.push(`${prop}: ${warning}`))
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "string" && detectSQLSyntax(item)) {
          const validation = validateSQL(item)
          validation.errors.forEach((error) => allErrors.push(`${prop}[${index}]: ${error}`))
          validation.warnings.forEach((warning) => allWarnings.push(`${prop}[${index}]: ${warning}`))
        }
      })
    }
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    sqlProperties,
  }
}

/**
 * Get available SQL formatting options
 * @returns {Object} - Available formatting options with descriptions
 */
export function getSQLFormattingOptions() {
  return {
    language: {
      description: "SQL dialect",
      options: ["sql", "mysql", "postgresql", "sqlite", "bigquery", "snowflake", "spark"],
      default: "sql",
    },
    tabWidth: {
      description: "Number of spaces for indentation",
      type: "number",
      default: 2,
      min: 1,
      max: 8,
    },
    useTabs: {
      description: "Use tabs instead of spaces",
      type: "boolean",
      default: false,
    },
    keywordCase: {
      description: "Case for SQL keywords",
      options: ["preserve", "upper", "lower"],
      default: "upper",
    },
    identifierCase: {
      description: "Case for identifiers (table/column names)",
      options: ["preserve", "upper", "lower"],
      default: "preserve",
    },
    functionCase: {
      description: "Case for function names",
      options: ["preserve", "upper", "lower"],
      default: "upper",
    },
    dataTypeCase: {
      description: "Case for data types",
      options: ["preserve", "upper", "lower"],
      default: "upper",
    },
    linesBetweenQueries: {
      description: "Number of lines between queries",
      type: "number",
      default: 2,
      min: 0,
      max: 5,
    },
    denseOperators: {
      description: "Remove spaces around operators",
      type: "boolean",
      default: false,
    },
    newlineBeforeOpeningParenthesis: {
      description: "Add newline before opening parenthesis",
      type: "boolean",
      default: false,
    },
    newlineBeforeClosingParenthesis: {
      description: "Add newline before closing parenthesis",
      type: "boolean",
      default: false,
    },
  }
}
