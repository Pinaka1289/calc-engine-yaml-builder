import { memo } from "react"
import { Handle, Position } from "reactflow"
import { Play, Square } from "lucide-react"

/**
 * @param {Object} props
 * @param {Object} props.data
 * @param {"start" | "end"} props.data.type
 * @param {string} props.data.label
 * @param {boolean} props.isConnectable
 */
function StartEndNode({ data, isConnectable }) {
  const { type, label } = data
  const isStart = type === "start"

  const bgColor = isStart ? "bg-green-100" : "bg-red-100"
  const borderColor = isStart ? "border-green-500" : "border-red-500"
  const textColor = isStart ? "text-green-700" : "text-red-700"
  const iconColor = isStart ? "text-green-600" : "text-red-600"

  return (
    <div className={`px-6 py-4 shadow-lg rounded-full ${bgColor} border-2 ${borderColor} min-w-[100px]`}>
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-3 h-3"
          style={{ background: "#ef4444" }}
        />
      )}

      <div className="flex items-center justify-center">
        {isStart ? (
          <Play className={`mr-2 ${iconColor}`} size={20} fill="currentColor" />
        ) : (
          <Square className={`mr-2 ${iconColor}`} size={20} fill="currentColor" />
        )}
        <div className={`text-sm font-bold ${textColor}`}>{label}</div>
      </div>

      {isStart && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-3 h-3"
          style={{ background: "#10b981" }}
        />
      )}
    </div>
  )
}

export default memo(StartEndNode)
