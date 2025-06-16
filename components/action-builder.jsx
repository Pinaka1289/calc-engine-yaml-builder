"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import ActionCard from "@/components/action-card"
import ActionForm from "@/components/action-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/**
 * @param {Object} props
 * @param {import('../lib/types.js').ActionType[]} props.actions
 * @param {function(import('../lib/types.js').ActionType[]): void} props.setActions
 */
export default function ActionBuilder({ actions, setActions }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [editIndex, setEditIndex] = useState(null)

  const handleAddAction = () => {
    setCurrentAction(null)
    setEditIndex(null)
    setIsDialogOpen(true)
  }

  /**
   * @param {import('../lib/types.js').ActionType} action
   * @param {number} index
   */
  const handleEditAction = (action, index) => {
    setCurrentAction(action)
    setEditIndex(index)
    setIsDialogOpen(true)
  }

  /**
   * @param {number} index
   */
  const handleDeleteAction = (index) => {
    const newActions = [...actions]
    newActions.splice(index, 1)
    setActions(newActions)
  }

  /**
   * @param {import('../lib/types.js').ActionType} action
   */
  const handleSaveAction = (action) => {
    const newActions = [...actions]

    if (editIndex !== null) {
      newActions[editIndex] = action
    } else {
      newActions.push(action)
    }

    setActions(newActions)
    setIsDialogOpen(false)
  }

  /**
   * @param {any} result
   */
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    // If dropped in the same position, do nothing
    if (sourceIndex === destinationIndex) return

    const newActions = [...actions]

    // Remove the item from the source position
    const [movedItem] = newActions.splice(sourceIndex, 1)

    // Insert the item at the destination position
    newActions.splice(destinationIndex, 0, movedItem)

    setActions(newActions)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6 px-6 pt-6">
        <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
        <Button onClick={handleAddAction} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Action
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="actions">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`flex-grow overflow-y-auto px-6 pb-6 transition-all duration-300 ${
                snapshot.isDraggingOver ? "bg-blue-50/50" : ""
              }`}
            >
              {actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">No actions yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Click "Add Action" to create your first workflow step
                      </p>
                    </div>
                    {snapshot.isDraggingOver && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                        <p className="text-blue-700 font-medium">Drop your action here!</p>
                        <p className="text-blue-600 text-sm mt-1">Actions can be reordered by dragging</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <Draggable key={`${action.name}-${index}`} draggableId={`${action.name}-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`transition-all duration-200 ${
                            snapshot.isDragging ? "z-50" : "hover:scale-[1.01]"
                          }`}
                        >
                          <ActionCard
                            action={action}
                            onEdit={() => handleEditAction(action, index)}
                            onDelete={() => handleDeleteAction(index)}
                            isDragging={snapshot.isDragging}
                            dragHandle={true}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {/* Drop indicator when dragging */}
                  {snapshot.isDraggingOver && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200 text-center">
                      <p className="text-blue-600 text-sm font-medium">Drop here to reorder</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Action" : "Add New Action"}</DialogTitle>
          </DialogHeader>
          <ActionForm initialAction={currentAction} onSave={handleSaveAction} onCancel={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
