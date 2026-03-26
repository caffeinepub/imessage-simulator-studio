declare module "@dnd-kit/core" {
  export interface DragEndEvent {
    active: { id: string | number };
    over: { id: string | number } | null;
    [key: string]: any;
  }
  export function DndContext(...args: any[]): any;
  export function useSensor(...args: any[]): any;
  export function useSensors(...args: any[]): any;
  export function PointerSensor(...args: any[]): any;
  export function KeyboardSensor(...args: any[]): any;
  export const closestCenter: any;
  export const DragOverlay: any;
  export type UniqueIdentifier = string | number;
}
declare module "@dnd-kit/sortable" {
  export function SortableContext(...args: any[]): any;
  export function useSortable(...args: any[]): any;
  export function arrayMove(arr: any[], from: number, to: number): any[];
  export const verticalListSortingStrategy: any;
  export const sortableKeyboardCoordinates: any;
}
declare module "@dnd-kit/utilities" {
  export const CSS: any;
}
