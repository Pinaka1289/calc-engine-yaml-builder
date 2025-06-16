"use client"

import { useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Plus, FileText, Zap, Save, RefreshCw, Eye, EyeOff, Code, Trash2 } from "lucide-react"
import { actionDefinitions } from "@/lib/action-definitions"
import { ACTION_NAMES } from "@/lib/types"
import { validateYaml } from "@/lib/yaml-utils"

/**
 * @typedef {Object} ActionTemplate
 * @property {string} name
 * @property {string} template
 */

/**
 * @type {ActionTemplate[]}
 */
const actionTemplates = [
  {
    name: ACTION_NAMES.EXTRACT,
    template: `  - action: Extract
    name: "new extract action"
    dataframe: "df_name"
    location: "path/to/data"
    tableName: "table_name"
    databaseName: "database_name"`,
  },
  {
    name: ACTION_NAMES.EXECUTE,
    template: `  - action: Execute
    name: "new execute action"
    dataframe: "df_name"
    script: "script.py"
    output: "output_location"`,
  },
  {
    name: ACTION_NAMES.TRANSFORM,
    template: `  - action: Transform
    name: "new transform action"
    dataframe: "df_name"
    transformations:
      - "transformation_1"
      - "transformation_2"`,
  },
  {
    name: ACTION_NAMES.LOAD,
    template: `  - action: Load
    name: "new load action"
    dataframe: "df_name"
    destination: "destination_path"`,
  },
  {
    name: ACTION_NAMES.MERGE,
    template: `  - action: Merge
    name: "new merge action"
    dataframe: "df_name"
    sources:
      - "source_1"
      - "source_2"`,
  },
  {
    name: ACTION_NAMES.PURGE,
    template: `  - action: Purge
    name: "new purge action"
    dataframe: "df_name"
    target: "target_location"`,
  },
  {
    name: ACTION_NAMES.S3_REPLICATE,
    template: `  - action: S3Replicate
    name: "new s3replicate action"
    dataframe: "df_name"
    source: "s3://source-bucket/path"
    destination: "s3://dest-bucket/path"`,
  },
  {
    name: ACTION_NAMES.INCLUDE,
    template: `  - action: Include
    name: "new include action"
    dataframe: "df_name"
    path: "path/to/include"`,
  },
]

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {function(string): void} props.onChange
 * @param {string[]} props.errors
 */
export default function YamlEditor({ value, onChange, errors }) {
  const editorRef = useRef(null)
  const [isInsertDialogOpen, setIsInsertDialogOpen] = useState(false)
  const [selectedActionType, setSelectedActionType] = useState(ACTION_NAMES.EXTRACT)
  const [insertPosition, setInsertPosition] = useState("end")
  const [cursorPosition, setCursorPosition] = useState(null)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showMinimap, setShowMinimap] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidContent, setLastValidContent] = useState("")
  const [actionCount, setActionCount] = useState(0)

  /**
   * @param {any} editor
   * @param {any} monaco
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      })
    })

    // Set up YAML language features
    monaco.languages.registerDocumentFormattingEditProvider("yaml", {
      provideDocumentFormattingEdits: (model) => {
        return [
          {
            range: model.getFullModelRange(),
            text: model.getValue(),
          },
        ]
      },
    })

    // Add custom commands for quick insertion
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      setIsInsertDialogOpen(true)
    })

    // Add command for quick save/validate
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleValidateAndSave()
    })

    // Add command for formatting
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction("editor.action.formatDocument").run()
    })
  }

  // Set initial value if empty
  useEffect(() => {
    if (!value && editorRef.current) {
      const initialYaml = `actions:
  - action: Extract
    name: first Extract action
    dataframe: extra_1
    location: value
    tableName: abcd
    databaseName: efg
  - action: Execute
    name: execute custom action
    script: abcd.py
    dataframe: extra_2
    output: some_abc_outputlocation`

      onChange(initialYaml)
    }
  }, [value, onChange])

  // Count actions in current YAML
  useEffect(() => {
    try {
      const { data } = validateYaml(value)
      setActionCount(data?.actions?.length || 0)
    } catch {
      setActionCount(0)
    }
  }, [value])

  const handleValidateAndSave = () => {
    setIsValidating(true)
    try {
      const { errors, data } = validateYaml(value)
      if (errors.length === 0 && data) {
        setLastValidContent(value)
        // Trigger onChange to sync with other components
        onChange(value)
      }
    } catch (error) {
      console.error("Validation failed:", error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleInsertAction = () => {
    const template = actionTemplates.find((t) => t.name === selectedActionType)
    if (!template || !editorRef.current) return

    const editor = editorRef.current
    const model = editor.getModel()
    const currentValue = model.getValue()

    let newValue = ""

    if (insertPosition === "beginning") {
      // Insert at the beginning (after "actions:")
      const lines = currentValue.split("\n")
      const actionsLineIndex = lines.findIndex((line) => line.trim().startsWith("actions:"))

      if (actionsLineIndex !== -1) {
        lines.splice(actionsLineIndex + 1, 0, template.template)
        newValue = lines.join("\n")
      } else {
        // If no actions: line found, add it
        newValue = `actions:\n${template.template}\n${currentValue}`
      }
    } else if (insertPosition === "end") {
      // Insert at the end
      if (currentValue.trim()) {
        newValue = `${currentValue}\n${template.template}`
      } else {
        newValue = `actions:\n${template.template}`
      }
    } else if (insertPosition === "cursor" && cursorPosition) {
      // Insert at cursor position
      const lines = currentValue.split("\n")
      const insertLine = cursorPosition.line - 1 // Monaco uses 1-based line numbers

      // Insert the template at the cursor line
      lines.splice(insertLine, 0, template.template)
      newValue = lines.join("\n")

      // Move cursor to the inserted content
      setTimeout(() => {
        editor.setPosition({
          lineNumber: insertLine + 2, // Position after the inserted action
          column: 1,
        })
        editor.focus()
      }, 100)
    }

    onChange(newValue)
    setIsInsertDialogOpen(false)
  }

  /**
   * @param {string} actionType
   */
  const handleQuickInsert = (actionType) => {
    const template = actionTemplates.find((t) => t.name === actionType)
    if (!template || !editorRef.current) return

    const editor = editorRef.current
    const model = editor.getModel()
    const currentValue = model.getValue()

    let newValue = ""
    if (currentValue.trim()) {
      newValue = `${currentValue}\n${template.template}`
    } else {
      newValue = `actions:\n${template.template}`
    }

    onChange(newValue)
  }

  const handleDeleteActionAtCursor = () => {
    if (!editorRef.current || !cursorPosition) return

    const editor = editorRef.current
    const model = editor.getModel()
    const currentValue = model.getValue()
    const lines = currentValue.split("\n")
    const currentLine = cursorPosition.line - 1

    // Find the action block that contains the cursor
    let actionStartLine = -1
    let actionEndLine = -1

    // Look backwards for the start of an action (line starting with "  - action:")
    for (let i = currentLine; i >= 0; i--) {
      if (lines[i].trim().startsWith("- action:") || lines[i].trim().startsWith("action:")) {
        actionStartLine = i
        break
      }
    }

    if (actionStartLine === -1) return

    // Look forwards for the end of the action (next action or end of file)
    actionEndLine = lines.length - 1
    for (let i = actionStartLine + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith("- action:")) {
        actionEndLine = i - 1
        break
      }
    }

    // Remove the action block
    const newLines = [...lines.slice(0, actionStartLine), ...lines.slice(actionEndLine + 1)]

    const newValue = newLines.join("\n")
    onChange(newValue)

    // Position cursor at the deletion point
    setTimeout(() => {
      editor.setPosition({
        lineNumber: Math.min(actionStartLine + 1, newLines.length),
        column: 1,
      })
      editor.focus()
    }, 100)
  }

  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run()
    }
  }

  /**
   * @param {string} actionName
   * @returns {string}
   */
  const getActionColor = (actionName) => {
    const definition = actionDefinitions.find((def) => def.name === actionName)
    return definition?.color || "#999999"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Action Insertion Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsInsertDialogOpen(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            Insert Action
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteActionAtCursor}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete at Cursor
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" onClick={handleValidateAndSave} disabled={isValidating}>
            {isValidating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleFormatDocument}>
            <Code className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500">Ctrl+I • Ctrl+S • Ctrl+Shift+F</span>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline">Actions: {actionCount}</Badge>
          <Badge variant={errors.length > 0 ? "destructive" : "secondary"}>
            {errors.length > 0 ? `${errors.length} Errors` : "Valid"}
          </Badge>
        </div>
      </div>

      {/* Quick Insert Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-25 border-b">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Quick Insert:</span>
          {actionDefinitions.slice(0, 4).map((def) => (
            <Button
              key={def.name}
              variant="ghost"
              size="sm"
              onClick={() => handleQuickInsert(def.name)}
              className="text-xs px-2 py-1 h-7"
              style={{
                borderLeft: `3px solid ${def.color}`,
                borderRadius: "4px",
              }}
              title={`Quick insert ${def.name} action`}
            >
              {def.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setShowLineNumbers(!showLineNumbers)} className="text-xs">
            {showLineNumbers ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Lines
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowMinimap(!showMinimap)} className="text-xs">
            {showMinimap ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Map
          </Button>
        </div>
      </div>

      {/* Position Indicator */}
      {cursorPosition && (
        <div className="px-3 py-1 bg-blue-50 border-b text-xs text-blue-600">
          <FileText className="inline h-3 w-3 mr-1" />
          Line {cursorPosition.line}, Column {cursorPosition.column}
          <span className="ml-2 text-gray-500">
            • Click "Insert Action" to add at cursor • "Delete at Cursor" to remove action block
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-grow border rounded-md overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="yaml"
          value={value}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: showMinimap },
            lineNumbers: showLineNumbers ? "on" : "off",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "same",
            automaticLayout: true,
            fontSize: 14,
            lineHeight: 20,
            renderLineHighlight: "all",
            cursorStyle: "line",
            cursorBlinking: "blink",
            folding: true,
            foldingStrategy: "indentation",
            showFoldingControls: "always",
            bracketPairColorization: { enabled: true },
            guides: {
              indentation: true,
              highlightActiveIndentation: true,
            },
          }}
        />
      </div>

      {/* Insert Action Dialog */}
      <Dialog open={isInsertDialogOpen} onOpenChange={setIsInsertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-500" />
              Insert Action Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={selectedActionType} onValueChange={(value) => setSelectedActionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {actionDefinitions.map((def) => (
                    <SelectItem key={def.name} value={def.name}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: def.color }} />
                        {def.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Insert Position</label>
              <Select value={insertPosition} onValueChange={(value) => setInsertPosition(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginning">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Beginning (after actions:)
                    </div>
                  </SelectItem>
                  <SelectItem value="cursor">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      At Cursor Position {cursorPosition && `(Line ${cursorPosition.line})`}
                    </div>
                  </SelectItem>
                  <SelectItem value="end">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      End of File
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                {actionTemplates.find((t) => t.name === selectedActionType)?.template}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsInsertDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInsertAction}>
                <Plus className="h-4 w-4 mr-1" />
                Insert Action
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
