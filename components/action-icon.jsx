import { Database, Play, RefreshCw, Upload, GitMerge, Trash2, Copy, FilePlus, HelpCircle } from "lucide-react"
import { getActionColor } from "@/lib/action-definitions"

/**
 * @param {Object} props
 * @param {string} props.actionType
 * @param {string} [props.className]
 * @param {number} [props.size]
 */
export default function ActionIcon({ actionType, className = "", size = 16 }) {
  const color = getActionColor(actionType)

  const iconProps = {
    size,
    color,
    className,
  }

  switch (actionType) {
    case "Extract":
      return <Database {...iconProps} />
    case "Execute":
      return <Play {...iconProps} />
    case "Transform":
      return <RefreshCw {...iconProps} />
    case "Load":
      return <Upload {...iconProps} />
    case "Merge":
      return <GitMerge {...iconProps} />
    case "Purge":
      return <Trash2 {...iconProps} />
    case "S3Replicate":
      return <Copy {...iconProps} />
    case "Include":
      return <FilePlus {...iconProps} />
    default:
      return <HelpCircle {...iconProps} />
  }
}
