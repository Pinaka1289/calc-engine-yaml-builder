"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle, AlertTriangle, AlertCircle, Code, Wand2, Settings } from "lucide-react"
import { formatSQL, validateSQL, detectSQLSyntax, getSQLFormattingOptions } from "@/lib/sql-utils"

/**
 * @param {Object} props
 * @param {string} props.value - The SQL text value
 * @param {function(string): void} props.onChange - Callback when SQL changes
 * @param {string} [props.label] - Label for the SQL editor
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.autoFormat] - Whether to auto-format on blur
 */
export default function SQLEditor({ value, onChange, label = "SQL", placeholder = "Enter SQL...", autoFormat = true }) {
  const [sqlText, setSqlText] = useState(value || "")
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] })
  const [isSQL, setIsSQL] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [formatOptions, setFormatOptions] = useState({
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
  })

  // Update local state when prop changes
  useEffect(() => {
    setSqlText(value || "")
  }, [value])

  // Validate SQL when text changes
  useEffect(() => {
    const detected = detectSQLSyntax(sqlText)
    setIsSQL(detected)

    if (detected && sqlText.trim()) {
      const result = validateSQL(sqlText)
      setValidation(result)
    } else {
      setValidation({ isValid: true, errors: [], warnings: [] })
    }
  }, [sqlText])

  const handleTextChange = (newValue) => {
    setSqlText(newValue)
    onChange(newValue)
  }

  const handleAutoFormat = () => {
    if (isSQL && sqlText.trim()) {
      const formatted = formatSQL(sqlText, formatOptions)
      setSqlText(formatted)
      onChange(formatted)
    }
  }

  const handleBlur = () => {
    if (autoFormat && isSQL && sqlText.trim()) {
      handleAutoFormat()
    }
  }

  const handleFormatOptionChange = (key, value) => {
    setFormatOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const availableOptions = getSQLFormattingOptions()

  if (!isSQL && sqlText.trim()) {
    // Regular text area for non-SQL content
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <Textarea
          value={sqlText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] font-mono"
        />
      </div>
    )
  }

  if (!isSQL) {
    // Regular text area for empty content
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <Textarea
          value={sqlText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px]"
        />
      </div>
    )
  }

  // SQL Editor with validation and formatting
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            <Code className="h-3 w-3 mr-1" />
            SQL Detected
          </Badge>
          {validation.isValid ? (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {validation.errors.length} Error{validation.errors.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {validation.warnings.length > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {validation.warnings.length} Warning{validation.warnings.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">SQL Editor (powered by sql-formatter)</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAutoFormat}>
              <Wand2 className="h-4 w-4 mr-1" />
              Format SQL
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="editor">
              <Textarea
                value={sqlText}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="min-h-[200px] font-mono text-sm"
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                }}
              />
              <div className="mt-2 text-xs text-gray-500">
                Auto-formatting enabled • Press Tab or click away to format • Powered by sql-formatter
              </div>
            </TabsContent>

            <TabsContent value="validation">
              <div className="space-y-3">
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">SQL Errors:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">SQL Warnings:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.isValid && validation.warnings.length === 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>SQL syntax is valid and properly formatted using sql-formatter.</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">SQL Formatting Options</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label>SQL Dialect</Label>
                    <Select
                      value={formatOptions.language}
                      onValueChange={(value) => handleFormatOptionChange("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOptions.language.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tab Width */}
                  <div className="space-y-2">
                    <Label>Tab Width</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={formatOptions.tabWidth}
                      onChange={(e) => handleFormatOptionChange("tabWidth", Number.parseInt(e.target.value))}
                    />
                  </div>

                  {/* Keyword Case */}
                  <div className="space-y-2">
                    <Label>Keyword Case</Label>
                    <Select
                      value={formatOptions.keywordCase}
                      onValueChange={(value) => handleFormatOptionChange("keywordCase", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOptions.keywordCase.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Function Case */}
                  <div className="space-y-2">
                    <Label>Function Case</Label>
                    <Select
                      value={formatOptions.functionCase}
                      onValueChange={(value) => handleFormatOptionChange("functionCase", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOptions.functionCase.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lines Between Queries */}
                  <div className="space-y-2">
                    <Label>Lines Between Queries</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={formatOptions.linesBetweenQueries}
                      onChange={(e) => handleFormatOptionChange("linesBetweenQueries", Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Boolean Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useTabs"
                      checked={formatOptions.useTabs}
                      onCheckedChange={(checked) => handleFormatOptionChange("useTabs", checked)}
                    />
                    <Label htmlFor="useTabs">Use tabs instead of spaces</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="denseOperators"
                      checked={formatOptions.denseOperators}
                      onCheckedChange={(checked) => handleFormatOptionChange("denseOperators", checked)}
                    />
                    <Label htmlFor="denseOperators">Dense operators (remove spaces around operators)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newlineBeforeOpeningParenthesis"
                      checked={formatOptions.newlineBeforeOpeningParenthesis}
                      onCheckedChange={(checked) =>
                        handleFormatOptionChange("newlineBeforeOpeningParenthesis", checked)
                      }
                    />
                    <Label htmlFor="newlineBeforeOpeningParenthesis">Newline before opening parenthesis</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newlineBeforeClosingParenthesis"
                      checked={formatOptions.newlineBeforeClosingParenthesis}
                      onCheckedChange={(checked) =>
                        handleFormatOptionChange("newlineBeforeClosingParenthesis", checked)
                      }
                    />
                    <Label htmlFor="newlineBeforeClosingParenthesis">Newline before closing parenthesis</Label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleAutoFormat} className="w-full">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Apply Formatting Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
