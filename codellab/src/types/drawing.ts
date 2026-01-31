/**
 * High-Performance Collaborative Drawing Types
 * 
 * Dual-channel architecture:
 * - Ephemeral: Stroke previews via Yjs awareness (not persisted)
 * - Committed: Final shapes via Yjs document (persisted)
 */

// =====================================
// Point and Geometry Types
// =====================================

export interface Point {
    x: number
    y: number
    pressure?: number
}

export interface Bounds {
    x: number
    y: number
    width: number
    height: number
}

// =====================================
// Ephemeral Stroke Preview (Awareness)
// =====================================

/**
 * Live stroke preview transmitted via awareness channel.
 * Never persisted to database. Cleared on stroke completion.
 */
export interface StrokePreview {
    id: string
    userId: string
    points: Point[]
    color: string
    width: number
    timestamp: number
    lastUpdateTime?: number
}

// =====================================
// Committed Shape (Yjs Document)
// =====================================

export type ShapeType = 'stroke' | 'rectangle' | 'circle' | 'line' | 'text'

/**
 * Final, simplified shape committed to Yjs document.
 * Persisted to database. Used for undo/redo.
 */
export interface CommittedShape {
    id: string
    type: ShapeType
    userId: string
    geometry: {
        points: Point[]
        bounds: Bounds
    }
    style: {
        color: string
        width: number
        opacity: number
        fill?: string
    }
    createdAt: number
    version: number
}

// =====================================
// Awareness State Structure
// =====================================

export interface DrawingAwareness {
    user: {
        id: string
        name: string
        color: string
    }
    activeStrokes: StrokePreview[]
    cursor?: { x: number; y: number }
    lastActivity?: number
}

// =====================================
// Rendering and Performance
// =====================================

export interface RenderState {
    localStrokes: StrokePreview[]
    remoteStrokes: Map<string, StrokePreview[]>
    committedShapes: CommittedShape[]
    visibleBounds?: Bounds
}

export interface InterpolationState {
    lastPoints: Point[]
    velocity: { x: number; y: number }
    lastUpdateTime: number
}

// =====================================
// Events and Actions
// =====================================

export type DrawingEvent =
    | { type: 'STROKE_START'; stroke: StrokePreview }
    | { type: 'STROKE_UPDATE'; stroke: StrokePreview }
    | { type: 'STROKE_COMPLETE'; stroke: StrokePreview }
    | { type: 'SHAPE_COMMITTED'; shape: CommittedShape }
    | { type: 'SHAPE_DELETED'; shapeId: string }
    | { type: 'UNDO' }
    | { type: 'REDO' }

export interface DrawingAction {
    type: DrawingEvent['type']
    payload: any
    userId: string
    timestamp: number
}

// =====================================
// Configuration
// =====================================

export interface DrawingConfig {
    targetFPS: number
    awarenessThrottleMs: number
    simplificationTolerance: number
    minPointsToSimplify: number
    enableInterpolation: boolean
    enablePrediction: boolean
    predictionWeight: number
    maxStrokesInMemory: number
    viewportCulling: boolean
}

export const DEFAULT_DRAWING_CONFIG: DrawingConfig = {
    targetFPS: 120,
    awarenessThrottleMs: 16,
    simplificationTolerance: 2.0,
    minPointsToSimplify: 10,
    enableInterpolation: true,
    enablePrediction: true,
    predictionWeight: 0.3,
    maxStrokesInMemory: 1000,
    viewportCulling: true,
}
