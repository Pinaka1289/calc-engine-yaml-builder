"use client"

import { memo } from "react"
import { Handle, Position } from "reactflow"
import { getActionColor } from "@/lib/action-definitions"
import ActionIcon from "@/components/action-icon"
import { Crown, Target, Edit } from "lucide-react"

/**
 * @param {Object} props
 * @param {Object} props.data
 * @param {import('../lib/types.js').ActionType} props.data.action
 * @param {boolean} [props.data.isStart]
 * @param {boolean} [props.data.isEnd]
 * @param {function(import('../lib/types.js').ActionType, number): void} [props.data.onEdit]
 * @param {number} [props.data.index]
 * @param {boolean} props.isConnectable
 */
function ActionNode({ data, isConnectable }) {
  const { action, isStart, isEnd, onEdit, index } = data
  const color = getActionColor(action.action)

  /**
   * @param {React.MouseEvent} e
   */
  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit && index !== undefined) {
      onEdit(action, index)
    }
  }

  return (
    <div className="relative group">
      {/* Start indicator */}
      {isStart && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white rounded-full p-1 z-10">
          <Crown size={12} />
        </div>
      )}

      {/* End indicator */}
      {isEnd && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10">
          <Target size={12} />
        </div>
      )}

      {/* Edit button - appears on hover */}
      {onEdit && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-md"
            title="Edit Action"
          >
            <Edit size={12} />
          </button>
        </div>
      )}

      <div
        className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[180px] cursor-pointer hover:shadow-lg transition-shadow ${
          isStart ? "ring-2 ring-green-200" : isEnd ? "ring-2 ring-red-200" : ""
        }`}
        style={{ borderColor: color }}
        onClick={handleEdit}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3" />

        <div className="flex items-center">
          <ActionIcon actionType={action.action} size={24} className="mr-3" />
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-800">{action.action}</div>
            <div className="text-xs text-gray-600 truncate" title={action.name}>
              {action.name}
            </div>
            <div className="text-xs text-blue-600 font-medium">df: {action.dataframe}</div>
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3" />
      </div>
    </div>
  )
}

export default memo(ActionNode)
