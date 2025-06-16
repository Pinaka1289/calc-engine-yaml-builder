"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { actionDefinitions, getMandatoryProps, getOptionalProps } from "@/lib/action-definitions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Database } from "lucide-react"
import SQLEditor from "@/components/sql-editor"
import { identifySQLProperties, validateSQLInAction, autoFormatSQLInAction } from "@/lib/sql-utils"

/**
 * @param {Object} props
 * @param {import('../lib/types.js').ActionType | null} props.initialAction
 * @param {function(import('../lib/types.js').ActionType): void} props.onSave
 * @param {function(): void} props.onCancel
 */
export default function ActionForm({ initialAction, onSave, onCancel }) {
  const [actionType, setActionType] = useState(initialAction?.action || "Extract")
  const [formData, setFormData] = useState({
    action: initialAction?.action || "Extract",
    name: initialAction?.name || "",
    dataframe: initialAction?.dataframe || "",
    ...initialAction,
  })
  const [selectedOptionalProps, setSelectedOptionalProps] = useState([])
  const [customProps, setCustomProps] = useState([])
  const [yamlText, setYamlText] = useState("")
  const [activeTab, setActiveTab] = useState("form")
  const [sqlValidation, setSqlValidation] = useState({ isValid: true, errors: [], warnings: [], sqlProperties: [] })

  // Initialize optional props from initial action
  useEffect(() => {
    if (initialAction) {
      const optionalProps = getOptionalProps(initialAction.action)
      const selected = optionalProps.filter((prop) => initialAction[prop] !== undefined)
      setSelectedOptionalProps(selected)

      // Find custom props (not in mandatory or optional lists)
      const mandatoryProps = getMandatoryProps(initialAction.action)
      const allDefinedProps = [...mandatoryProps, ...optionalProps]
      const custom = []

      Object.entries(initialAction).forEach(([key, value]) => {
        if (!allDefinedProps.includes(key) && key !== "action") {
          custom.push({
            key,
            value: typeof value === "string" ? value : JSON.stringify(value),
          })
        }
      })

      setCustomProps(custom)

      // Generate YAML text
      const yamlObj = { ...initialAction }
      setYamlText(JSON.stringify(yamlObj, null, 2))
    }
  }, [initialAction])

  // Update form when action type changes
  useEffect(() => {
    if (actionType) {
      const mandatoryProps = getMandatoryProps(actionType)
      const newFormData = {
        action: actionType,
        name: formData.name || "",
        dataframe: formData.dataframe || "",
      }

      // Add default values for mandatory props
      mandatoryProps.forEach((prop) => {
        if (prop !== "action" && prop !== "name" && prop !== "dataframe") {
          newFormData[prop] = formData[prop] || ""
        }
      })

      // Add selected optional props
      selectedOptionalProps.forEach((prop) => {
        newFormData[prop] = formData[prop] || ""
      })

      setFormData(newFormData)
    }
  }, [actionType, selectedOptionalProps])

  // Validate SQL when form data changes
  useEffect(() => {
    const validation = validateSQLInAction(formData)
    setSqlValidation(validation)
  }, [formData])

  /**
   * @param {string} key
   * @param {any} value
   */
  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * @param {string} prop
   * @param {boolean} checked
   */
  const handleOptionalPropToggle = (prop, checked) => {
    if (checked) {
      setSelectedOptionalProps((prev) => [...prev, prop])
    } else {
      setSelectedOptionalProps((prev) => prev.filter((p) => p !== prop))
      setFormData((prev) => {
        const newData = { ...prev }
        delete newData[prop]
        return newData
      })
    }
  }

  const handleAddCustomProp = () => {
    setCustomProps((prev) => [...prev, { key: "", value: "" }])
  }

  /**
   * @param {number} index
   * @param {"key" | "value"} field
   * @param {string} value
   */
  const handleCustomPropChange = (index, field, value) => {
    setCustomProps((prev) => {
      const newProps = [...prev]
      newProps[index][field] = value
      return newProps
    })
  }

  /**
   * @param {number} index
   */
  const handleRemoveCustomProp = (index) => {
    setCustomProps((prev) => prev.filter((_, i) => i !== index))
  }

  /**
   * @param {string} text
   */
  const handleYamlChange = (text) => {
    setYamlText(text)
    try {
      const parsed = JSON.parse(text)
      if (parsed.action) {
        setActionType(parsed.action)
        setFormData(parsed)
      }
    } catch (error) {
      console.error("Invalid JSON:", error)
    }
  }

  const handleAutoFormatSQL = () => {
    const formattedAction = autoFormatSQLInAction(formData)
    setFormData(formattedAction)
  }

  /**
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault()

    // Add custom props to form data
    const finalData = { ...formData }
    customProps.forEach(({ key, value }) => {
      if (key && value) {
        try {
          // Try to parse as JSON if possible
          finalData[key] = JSON.parse(value)
        } catch {
          // Otherwise use as string
          finalData[key] = value
        }
      }
    })

    // Auto-format SQL before saving
    const formattedData = autoFormatSQLInAction(finalData)
    onSave(formattedData)
  }

  const mandatoryProps = getMandatoryProps(actionType)
  const optionalProps = getOptionalProps(actionType)
  const sqlProperties = identifySQLProperties(formData)

  /**
   * Renders input field with SQL detection
   * @param {string} prop
   * @param {any} value
   * @param {boolean} isRequired
   */
  const renderInputField = (prop, value, isRequired = false) => {
    const isArrayProp = prop === "transformations" || prop === "sources"
    const isSQLProperty = sqlProperties.includes(prop)

    if (isSQLProperty && !isArrayProp) {
      return (
        <SQLEditor
          value={value || ""}
          onChange={(newValue) => handleInputChange(prop, newValue)}
          label={prop}
          placeholder={`Enter ${prop}`}
          autoFormat={true}
        />
      )
    }

    if (isArrayProp) {
      return (
        <div className="space-y-2">
          <Label htmlFor={prop}>{prop}</Label>
          <Textarea
            id={prop}
            value={Array.isArray(value) ? value.join("\n") : value || ""}
            onChange={(e) => handleInputChange(prop, e.target.value.split("\n"))}
            placeholder={`Enter ${prop} (one per line)`}
          />
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={prop}>{prop}</Label>
        <Input
          id={prop}
          value={value || ""}
          onChange={(e) => handleInputChange(prop, e.target.value)}
          placeholder={`Enter ${prop}`}
          required={isRequired}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* SQL Validation Alert */}
      {sqlProperties.length > 0 && (
        <Alert className={sqlValidation.isValid ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">SQL Properties Detected:</span> {sqlProperties.join(", ")}
                {!sqlValidation.isValid && (
                  <div className="text-red-600 mt-1">
                    {sqlValidation.errors.length} error(s), {sqlValidation.warnings.length} warning(s)
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleAutoFormatSQL}>
                Format All SQL
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="yaml">YAML</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select value={actionType} onValueChange={(value) => setActionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {actionDefinitions.map((def) => (
                    <SelectItem key={def.name} value={def.name}>
                      {def.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mandatory Properties */}
            <div className="space-y-4">
              <h3 className="font-medium">Mandatory Properties</h3>
              {mandatoryProps.map((prop) => {
                if (prop === "action") return null
                return <div key={prop}>{renderInputField(prop, formData[prop], true)}</div>
              })}
            </div>

            {/* Optional Properties */}
            {optionalProps.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Optional Properties</h3>
                <div className="grid grid-cols-2 gap-2">
                  {optionalProps.map((prop) => (
                    <div key={prop} className="flex items-center space-x-2">
                      <Checkbox
                        id={`check-${prop}`}
                        checked={selectedOptionalProps.includes(prop)}
                        onCheckedChange={(checked) => handleOptionalPropToggle(prop, checked === true)}
                      />
                      <Label htmlFor={`check-${prop}`}>{prop}</Label>
                    </div>
                  ))}
                </div>

                {selectedOptionalProps.map((prop) => (
                  <div key={prop}>{renderInputField(prop, formData[prop])}</div>
                ))}
              </div>
            )}

            {/* Custom Properties */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Custom Properties</h3>
                <Button type="button" variant="outline" onClick={handleAddCustomProp}>
                  Add Property
                </Button>
              </div>

              {customProps.map((prop, index) => (
                <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2">
                  <Input
                    value={prop.key}
                    onChange={(e) => handleCustomPropChange(index, "key", e.target.value)}
                    placeholder="Property name"
                  />
                  <Input
                    value={prop.value}
                    onChange={(e) => handleCustomPropChange(index, "value", e.target.value)}
                    placeholder="Property value"
                  />
                  <Button type="button" variant="ghost" onClick={() => handleRemoveCustomProp(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="yaml">
          <div className="space-y-4">
            <Textarea
              value={yamlText}
              onChange={(e) => handleYamlChange(e.target.value)}
              className="min-h-[300px] font-mono"
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(yamlText)
                    const formattedData = autoFormatSQLInAction(parsed)
                    onSave(formattedData)
                  } catch (error) {
                    console.error("Invalid JSON:", error)
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
