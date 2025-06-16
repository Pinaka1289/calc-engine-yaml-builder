"use client"

import { useState, useEffect } from "react"
import YamlEditor from "@/components/yaml-editor"
import ActionBuilder from "@/components/action-builder"
import FlowVisualizer from "@/components/flow-visualizer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Copy, FileWarning, Cloud, Loader2 } from "lucide-react"
import { stringifyYaml, validateYaml } from "@/lib/yaml-utils"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [activeTab, setActiveTab] = useState("action-builder")
  const [yamlContent, setYamlContent] = useState("")
  const [actions, setActions] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [isS3UploadDialogOpen, setIsS3UploadDialogOpen] = useState(false)
  const [s3FileName, setS3FileName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Update YAML content when actions change
  useEffect(() => {
    if (actions.length > 0) {
      const yaml = stringifyYaml({ actions })
      setYamlContent(yaml)
    }
  }, [actions])

  // Update actions when YAML content changes
  /**
   * @param {string} content
   */
  const handleYamlChange = (content) => {
    setYamlContent(content)
    try {
      const { errors, data } = validateYaml(content)
      setValidationErrors(errors)

      if (data && data.actions) {
        setActions(data.actions)
      }
    } catch (error) {
      console.error("Failed to parse YAML:", error)
    }
  }

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      handleYamlChange(content)
      toast({
        title: "File uploaded",
        description: "YAML file has been loaded successfully.",
      })
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "workflow.yaml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent)
    toast({
      title: "Copied to clipboard",
      description: "YAML content has been copied to clipboard.",
    })
  }

  const handleS3Upload = () => {
    if (!yamlContent.trim()) {
      toast({
        title: "No content to upload",
        description: "Please create some actions before uploading to S3.",
        variant: "destructive",
      })
      return
    }

    // Generate default filename based on current timestamp
    const defaultFileName = `workflow-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.yaml`
    setS3FileName(defaultFileName)
    setIsS3UploadDialogOpen(true)
  }

  const handleS3UploadConfirm = async () => {
    if (!s3FileName.trim()) {
      toast({
        title: "Filename required",
        description: "Please enter a filename for the S3 upload.",
        variant: "destructive",
      })
      return
    }

    // Ensure filename has .yaml extension
    const fileName = s3FileName.endsWith(".yaml") || s3FileName.endsWith(".yml") ? s3FileName : `${s3FileName}.yaml`

    setIsUploading(true)

    try {
      // Simulate S3 upload - In a real implementation, you would:
      // 1. Configure AWS SDK with credentials
      // 2. Create S3 client
      // 3. Upload file to specified bucket
      // 4. Handle authentication and permissions

      // For demonstration, we'll simulate the upload process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulated S3 upload logic would go here:
      /*
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      });

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: yamlContent,
        ContentType: 'application/x-yaml',
        ServerSideEncryption: 'AES256'
      };

      const result = await s3.upload(uploadParams).promise();
      */

      toast({
        title: "Upload successful",
        description: `YAML file "${fileName}" has been uploaded to S3 successfully.`,
      })

      setIsS3UploadDialogOpen(false)
      setS3FileName("")
    } catch (error) {
      console.error("S3 upload failed:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file to S3. Please check your configuration and try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleS3UploadCancel = () => {
    setIsS3UploadDialogOpen(false)
    setS3FileName("")
  }

  return (
    <main className="container mx-auto p-4">
      {/* Header with Title and Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">YAML Builder & Flow Visualizer</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Upload YAML
          </Button>
          <input id="file-upload" type="file" accept=".yaml,.yml" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button
            variant="outline"
            onClick={handleS3Upload}
            className="bg-orange-50 hover:bg-orange-100 border-orange-200"
          >
            <Cloud className="mr-2 h-4 w-4" /> Upload to S3
          </Button>
        </div>
      </div>

      {/* Validation Errors Row */}
      {validationErrors.length > 0 && (
        <div className="flex items-center justify-start mb-4">
          <div className="flex items-center text-red-500">
            <FileWarning className="mr-2 h-4 w-4" />
            <span>{validationErrors.length} validation errors</span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="action-builder">Action Builder</TabsTrigger>
          <TabsTrigger value="flow-visualizer">Flow Visualizer</TabsTrigger>
          <TabsTrigger value="yaml-editor">YAML Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="action-builder" className="h-[calc(100vh-200px)]">
          <ActionBuilder actions={actions} setActions={setActions} />
        </TabsContent>

        <TabsContent value="flow-visualizer" className="h-[calc(100vh-200px)]">
          <FlowVisualizer actions={actions} setActions={setActions} />
        </TabsContent>

        <TabsContent value="yaml-editor" className="h-[calc(100vh-200px)]">
          <YamlEditor value={yamlContent} onChange={handleYamlChange} errors={validationErrors} />
        </TabsContent>
      </Tabs>

      {/* S3 Upload Dialog */}
      <Dialog open={isS3UploadDialogOpen} onOpenChange={setIsS3UploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Cloud className="h-5 w-5 mr-2 text-orange-500" />
              Upload to AWS S3
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s3-filename">File Name</Label>
              <Input
                id="s3-filename"
                value={s3FileName}
                onChange={(e) => setS3FileName(e.target.value)}
                placeholder="Enter filename (e.g., my-workflow.yaml)"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500">File will be saved with .yaml extension if not specified</p>
            </div>

            {/* File Preview */}
            <div className="space-y-2">
              <Label>Content Preview</Label>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {yamlContent.split("\n").slice(0, 10).join("\n")}
                {yamlContent.split("\n").length > 10 && "\n..."}
              </div>
              <p className="text-xs text-gray-500">
                {yamlContent.split("\n").length} lines, {new Blob([yamlContent]).size} bytes
              </p>
            </div>

            {/* Upload Configuration Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Upload Configuration</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Content-Type: application/x-yaml</li>
                <li>• Server-side encryption: AES256</li>
                <li>• File will be uploaded to configured S3 bucket</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleS3UploadCancel} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleS3UploadConfirm}
                disabled={isUploading || !s3FileName.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Upload to S3
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
