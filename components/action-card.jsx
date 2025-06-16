"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, GripVertical } from "lucide-react"
import { getActionColor } from "@/lib/action-definitions"
import ActionIcon from "@/components/action-icon"

/**
 * @param {Object} props
 * @param {import('../lib/types.js').ActionType} props.action
 * @param {function(): void} props.onEdit
 * @param {function(): void} props.onDelete
 * @param {boolean} [props.isDragging]
 * @param {boolean} [props.dragHandle]
 */
export default function ActionCard({ action, onEdit, onDelete, isDragging = false, dragHandle = false }) {
  const color = getActionColor(action.action)

  // Get lighter version of the color for icon background
  const getIconBackgroundColor = (color) => {
    const colorMap = {
      "#3b82f6": "#dbeafe", // blue-500 -> blue-100
      "#10b981": "#d1fae5", // emerald-500 -> emerald-100
      "#f59e0b": "#fef3c7", // amber-500 -> amber-100
      "#ef4444": "#fee2e2", // red-500 -> red-100
      "#8b5cf6": "#ede9fe", // violet-500 -> violet-100
      "#06b6d4": "#cffafe", // cyan-500 -> cyan-100
    }
    return colorMap[color] || "#f3f4f6" // default to gray-100
  }

  const iconBgColor = getIconBackgroundColor(color)

  return (
    <Card
      className={`border-l-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? "shadow-lg rotate-1 scale-105" : ""
      }`}
      style={{ borderLeftColor: color }}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Drag Handle */}
          {dragHandle && (
            <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </div>
          )}

          {/* Icon with colored background */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: iconBgColor }}
          >
            <ActionIcon actionType={action.action} className="w-6 h-6" style={{ color: color }} />
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{action.name}</h3>
            <p className="text-gray-500 text-sm mt-1">Action: {action.action.toLowerCase()}</p>

            {/* Additional properties - condensed view */}
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Dataframe:</span> {action.dataframe}
              </div>
              {Object.entries(action).map(([key, value]) => {
                if (key === "action" || key === "name" || key === "dataframe") return null

                const displayValue =
                  typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : JSON.stringify(value)

                return (
                  <div key={key} className="text-xs text-gray-600">
                    <span className="font-medium">{key}:</span>{" "}
                    <span className="truncate inline-block max-w-[200px]" title={displayValue}>
                      {displayValue.length > 30 ? displayValue.substring(0, 30) + "..." : displayValue}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
