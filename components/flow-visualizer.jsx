"use client"

import { useEffect, useState } from "react"
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, MarkerType, MiniMap } from "reactflow"
import "reactflow/dist/style.css"
import { findRelationships } from "@/lib/yaml-utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ActionNode from "@/components/action-node"
import StartEndNode from "@/components/start-end-node"
import ActionForm from "@/components/action-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, MoreVertical, Layout, Grid, Workflow, GitBranch, Layers, Zap } from "lucide-react"

// Register custom node types
const nodeTypes = {
  actionNode: ActionNode,
  startEndNode: StartEndNode,
}

// Layout algorithms
const LAYOUT_TYPES = {
  HIERARCHICAL: "hierarchical",
  GRID: "grid",
  CIRCULAR: "circular",
  FORCE: "force",
  TIMELINE: "timeline",
  SWIMLANE: "swimlane",
}

// Visual styles
const VISUAL_STYLES = {
  DEFAULT: "default",
  COMPACT: "compact",
  DETAILED: "detailed",
  MINIMAL: "minimal",
}

/**
 * @param {Object} props
 * @param {import('../lib/types.js').ActionType[]} props.actions
 * @param {function(import('../lib/types.js').ActionType[]): void} [props.setActions]
 */
export default function FlowVisualizer({ actions, setActions }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [actionCounts, setActionCounts] = useState({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [editIndex, setEditIndex] = useState(null)
  const [insertPosition, setInsertPosition] = useState(null)
  const [layoutType, setLayoutType] = useState(LAYOUT_TYPES.HIERARCHICAL)
  const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES.DEFAULT)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showBackground, setShowBackground] = useState(true)

  // Calculate action counts
  useEffect(() => {
    const counts = {}
    actions.forEach((action) => {
      counts[action.action] = (counts[action.action] || 0) + 1
    })
    setActionCounts(counts)
  }, [actions])

  // Layout calculation functions
  const calculateHierarchicalLayout = (actions) => {
    const relationships = findRelationships(actions)
    const positions = []

    // Simple hierarchical layout - top to bottom
    actions.forEach((action, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      positions.push({
        x: col * 300 + 150,
        y: row * 150 + 100,
      })
    })

    return positions
  }

  const calculateGridLayout = (actions) => {
    const positions = []
    const cols = Math.ceil(Math.sqrt(actions.length))

    actions.forEach((action, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      positions.push({
        x: col * 250 + 100,
        y: row * 200 + 100,
      })
    })

    return positions
  }

  const calculateCircularLayout = (actions) => {
    const positions = []
    const centerX = 400
    const centerY = 300
    const radius = Math.max(150, actions.length * 30)

    actions.forEach((action, index) => {
      const angle = (index / actions.length) * 2 * Math.PI
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    })

    return positions
  }

  const calculateTimelineLayout = (actions) => {
    const positions = []

    actions.forEach((action, index) => {
      positions.push({
        x: index * 200 + 150,
        y: 200,
      })
    })

    return positions
  }

  const calculateSwimlaneLayout = (actions) => {
    const positions = []
    const actionTypes = [...new Set(actions.map((a) => a.action))]
    const laneHeight = 200

    actions.forEach((action, index) => {
      const laneIndex = actionTypes.indexOf(action.action)
      const actionsInLane = actions.filter((a) => a.action === action.action)
      const positionInLane = actionsInLane.findIndex((a) => a === action)

      positions.push({
        x: positionInLane * 250 + 150,
        y: laneIndex * laneHeight + 100,
      })
    })

    return positions
  }

  const calculateForceLayout = (actions) => {
    // Simple force-directed layout simulation
    const positions = []
    const relationships = findRelationships(actions)

    // Initialize random positions
    actions.forEach((action, index) => {
      positions.push({
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 100,
      })
    })

    // Simple force simulation (simplified)
    for (let iteration = 0; iteration < 50; iteration++) {
      // Repulsion between all nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x
          const dy = positions[i].y - positions[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 200) {
            const force = (200 - distance) * 0.1
            const angle = Math.atan2(dy, dx)
            positions[i].x += Math.cos(angle) * force
            positions[i].y += Math.sin(angle) * force
            positions[j].x -= Math.cos(angle) * force
            positions[j].y -= Math.sin(angle) * force
          }
        }
      }

      // Attraction for connected nodes
      relationships.forEach((rel) => {
        const sourceIndex = Number.parseInt(rel.source.split("-")[1])
        const targetIndex = Number.parseInt(rel.target.split("-")[1])

        if (sourceIndex < positions.length && targetIndex < positions.length) {
          const dx = positions[targetIndex].x - positions[sourceIndex].x
          const dy = positions[targetIndex].y - positions[sourceIndex].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 150) {
            const force = (distance - 150) * 0.05
            const angle = Math.atan2(dy, dx)
            positions[sourceIndex].x += Math.cos(angle) * force
            positions[sourceIndex].y += Math.sin(angle) * force
            positions[targetIndex].x -= Math.cos(angle) * force
            positions[targetIndex].y -= Math.sin(angle) * force
          }
        }
      })
    }

    return positions
  }

  const getNodePositions = (actions, layoutType) => {
    switch (layoutType) {
      case LAYOUT_TYPES.GRID:
        return calculateGridLayout(actions)
      case LAYOUT_TYPES.CIRCULAR:
        return calculateCircularLayout(actions)
      case LAYOUT_TYPES.FORCE:
        return calculateForceLayout(actions)
      case LAYOUT_TYPES.TIMELINE:
        return calculateTimelineLayout(actions)
      case LAYOUT_TYPES.SWIMLANE:
        return calculateSwimlaneLayout(actions)
      default:
        return calculateHierarchicalLayout(actions)
    }
  }

  const getNodeStyle = (visualStyle) => {
    switch (visualStyle) {
      case VISUAL_STYLES.COMPACT:
        return { minWidth: "120px", padding: "8px" }
      case VISUAL_STYLES.DETAILED:
        return { minWidth: "220px", padding: "16px" }
      case VISUAL_STYLES.MINIMAL:
        return { minWidth: "80px", padding: "4px" }
      default:
        return { minWidth: "180px", padding: "12px" }
    }
  }

  const getEdgeStyle = (visualStyle) => {
    switch (visualStyle) {
      case VISUAL_STYLES.COMPACT:
        return { strokeWidth: 1 }
      case VISUAL_STYLES.DETAILED:
        return { strokeWidth: 3 }
      case VISUAL_STYLES.MINIMAL:
        return { strokeWidth: 1, strokeDasharray: "5,5" }
      default:
        return { strokeWidth: 2 }
    }
  }

  // Handle edit action from flow visualizer
  const handleEditAction = (action, index) => {
    if (!setActions) return
    setCurrentAction(action)
    setEditIndex(index)
    setIsEditDialogOpen(true)
  }

  // Handle add action
  const handleAddAction = (position = null) => {
    if (!setActions) return
    setCurrentAction(null)
    setEditIndex(null)
    setInsertPosition(position)
    setIsAddDialogOpen(true)
  }

  // Handle delete action
  const handleDeleteAction = (index) => {
    if (!setActions) return
    const newActions = [...actions]
    newActions.splice(index, 1)
    setActions(newActions)
  }

  // Handle save action (edit)
  const handleSaveAction = (action) => {
    if (!setActions || editIndex === null) return
    const newActions = [...actions]
    newActions[editIndex] = action
    setActions(newActions)
    setIsEditDialogOpen(false)
    setCurrentAction(null)
    setEditIndex(null)
  }

  // Handle save new action (add)
  const handleSaveNewAction = (action) => {
    if (!setActions) return
    const newActions = [...actions]
    if (insertPosition !== null) {
      newActions.splice(insertPosition, 0, action)
    } else {
      newActions.push(action)
    }
    setActions(newActions)
    setIsAddDialogOpen(false)
    setCurrentAction(null)
    setInsertPosition(null)
  }

  // Handle cancel edit/add
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setCurrentAction(null)
    setEditIndex(null)
  }

  const handleCancelAdd = () => {
    setIsAddDialogOpen(false)
    setCurrentAction(null)
    setInsertPosition(null)
  }

  // Find start and end actions
  const findStartAndEndActions = (actions, relationships) => {
    const startActions = []
    const endActions = []

    if (actions.length > 0) {
      startActions.push(`action-0`)
    }

    if (actions.length > 1) {
      endActions.push(`action-${actions.length - 1}`)
    } else if (actions.length === 1) {
      endActions.push(`action-0`)
    }

    return { startActions, endActions }
  }

  // Generate nodes and edges from actions
  useEffect(() => {
    if (!actions.length) return

    const relationships = findRelationships(actions)
    const { startActions, endActions } = findStartAndEndActions(actions, relationships)
    const positions = getNodePositions(actions, layoutType)
    const nodeStyle = getNodeStyle(visualStyle)
    const edgeStyle = getEdgeStyle(visualStyle)

    // Create action nodes
    const actionNodes = actions.map((action, index) => ({
      id: `action-${index}`,
      type: "actionNode",
      data: {
        action,
        isStart: startActions.includes(`action-${index}`),
        isEnd: endActions.includes(`action-${index}`),
        onEdit: setActions ? handleEditAction : undefined,
        onDelete: setActions ? handleDeleteAction : undefined,
        onAddBefore: setActions ? () => handleAddAction(index) : undefined,
        onAddAfter: setActions ? () => handleAddAction(index + 1) : undefined,
        index,
        visualStyle,
        nodeStyle,
      },
      position: positions[index] || { x: 0, y: 0 },
      style: nodeStyle,
    }))

    // Create start/end nodes for certain layouts
    let startNode = null
    let endNode = null

    if (layoutType === LAYOUT_TYPES.HIERARCHICAL || layoutType === LAYOUT_TYPES.FORCE) {
      if (startActions.length > 0) {
        startNode = {
          id: "start-node",
          type: "startEndNode",
          data: { type: "start", label: "START" },
          position: { x: 50, y: 50 },
        }
      }

      if (endActions.length > 0) {
        const maxX = Math.max(...actionNodes.map((n) => n.position.x))
        const maxY = Math.max(...actionNodes.map((n) => n.position.y))
        endNode = {
          id: "end-node",
          type: "startEndNode",
          data: { type: "end", label: "END" },
          position: { x: maxX + 200, y: maxY + 100 },
        }
      }
    }

    // Combine all nodes
    const allNodes = [...(startNode ? [startNode] : []), ...actionNodes, ...(endNode ? [endNode] : [])]

    // Create edges
    const relationshipEdges = relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.source,
      target: rel.target,
      animated: visualStyle !== VISUAL_STYLES.MINIMAL,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6366f1", ...edgeStyle },
    }))

    // Start/end edges
    const startEdges = startNode
      ? startActions.map((actionId, index) => ({
          id: `start-edge-${index}`,
          source: "start-node",
          target: actionId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#10b981", ...edgeStyle },
        }))
      : []

    const endEdges = endNode
      ? endActions.map((actionId, index) => ({
          id: `end-edge-${index}`,
          source: actionId,
          target: "end-node",
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#ef4444", ...edgeStyle },
        }))
      : []

    const allEdges = [...relationshipEdges, ...startEdges, ...endEdges]

    setNodes(allNodes)
    setEdges(allEdges)
  }, [actions, setActions, layoutType, visualStyle, setNodes, setEdges])

  // Render swimlane backgrounds
  const renderSwimlaneBackgrounds = () => {
    if (layoutType !== LAYOUT_TYPES.SWIMLANE) return null

    const actionTypes = [...new Set(actions.map((a) => a.action))]
    const laneHeight = 200

    return (
      <div className="absolute inset-0 pointer-events-none">
        {actionTypes.map((actionType, index) => (
          <div
            key={actionType}
            className="absolute border-b border-gray-200 bg-gray-50/30"
            style={{
              top: index * laneHeight + 50,
              left: 0,
              right: 0,
              height: laneHeight,
            }}
          >
            <div className="absolute left-4 top-4 text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">
              {actionType}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header with Layout and Style Controls */}
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Flow Visualizer</h2>

          {/* Layout Selection */}
          <div className="flex items-center space-x-2">
            <Layout className="h-4 w-4 text-gray-500" />
            <Select value={layoutType} onValueChange={setLayoutType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LAYOUT_TYPES.HIERARCHICAL}>
                  <div className="flex items-center">
                    <Workflow className="mr-2 h-4 w-4" />
                    Hierarchical
                  </div>
                </SelectItem>
                <SelectItem value={LAYOUT_TYPES.GRID}>
                  <div className="flex items-center">
                    <Grid className="mr-2 h-4 w-4" />
                    Grid
                  </div>
                </SelectItem>
                <SelectItem value={LAYOUT_TYPES.CIRCULAR}>
                  <div className="flex items-center">
                    <GitBranch className="mr-2 h-4 w-4" />
                    Circular
                  </div>
                </SelectItem>
                <SelectItem value={LAYOUT_TYPES.TIMELINE}>
                  <div className="flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    Timeline
                  </div>
                </SelectItem>
                <SelectItem value={LAYOUT_TYPES.SWIMLANE}>
                  <div className="flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    Swimlane
                  </div>
                </SelectItem>
                <SelectItem value={LAYOUT_TYPES.FORCE}>
                  <div className="flex items-center">
                    <GitBranch className="mr-2 h-4 w-4" />
                    Force-Directed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visual Style Selection */}
          <div className="flex items-center space-x-2">
            <Select value={visualStyle} onValueChange={setVisualStyle}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VISUAL_STYLES.DEFAULT}>Default</SelectItem>
                <SelectItem value={VISUAL_STYLES.COMPACT}>Compact</SelectItem>
                <SelectItem value={VISUAL_STYLES.DETAILED}>Detailed</SelectItem>
                <SelectItem value={VISUAL_STYLES.MINIMAL}>Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline">Total: {actions.length}</Badge>
          {Object.entries(actionCounts).map(([action, count]) => (
            <Badge key={action} variant="secondary">
              {action}: {count}
            </Badge>
          ))}

          {setActions && (
            <>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Click any action to edit
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action
                    <MoreVertical className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAddAction(0)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add at Beginning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddAction()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add at End
                  </DropdownMenuItem>
                  {actions.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1 text-xs font-medium text-gray-500">Insert After:</div>
                      {actions.map((action, index) => (
                        <DropdownMenuItem key={index} onClick={() => handleAddAction(index + 1)}>
                          <Plus className="mr-2 h-4 w-4" />
                          After "{action.name}"
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Layout Description */}
      <div className="mb-2 px-4">
        <div className="text-sm text-gray-600">
          {layoutType === LAYOUT_TYPES.HIERARCHICAL && "Top-down hierarchical flow with start/end nodes"}
          {layoutType === LAYOUT_TYPES.GRID && "Organized grid layout for easy scanning"}
          {layoutType === LAYOUT_TYPES.CIRCULAR && "Circular arrangement showing cyclical relationships"}
          {layoutType === LAYOUT_TYPES.TIMELINE && "Linear timeline showing sequential flow"}
          {layoutType === LAYOUT_TYPES.SWIMLANE && "Grouped by action type in horizontal lanes"}
          {layoutType === LAYOUT_TYPES.FORCE && "Force-directed layout emphasizing relationships"}
        </div>
      </div>

      {/* Flow Diagram */}
      <Card className="flex-grow relative">
        <CardContent className="p-0 h-full relative">
          {renderSwimlaneBackgrounds()}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            {showBackground && <Background />}
            <Controls />
            {showMiniMap && (
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === "startEndNode") {
                    return n.data.type === "start" ? "#10b981" : "#ef4444"
                  }
                  return "#ddd"
                }}
                nodeColor={(n) => {
                  if (n.type === "startEndNode") {
                    return n.data.type === "start" ? "#d1fae5" : "#fee2e2"
                  }
                  return "#ffffff"
                }}
                maskColor="#f8fafc80"
              />
            )}
          </ReactFlow>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Action from Flow</DialogTitle>
          </DialogHeader>
          <ActionForm initialAction={currentAction} onSave={handleSaveAction} onCancel={handleCancelEdit} />
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add New Action
              {insertPosition !== null && (
                <span className="text-sm font-normal text-gray-500 ml-2">(Position: {insertPosition + 1})</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ActionForm initialAction={null} onSave={handleSaveNewAction} onCancel={handleCancelAdd} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
