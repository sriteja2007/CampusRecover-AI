/**
 * Background Processing & Queue System
 *
 * Manages asynchronous AI tasks (visual analysis, embedding extraction,
 * pairing scans, and duplicate checks) without blocking user interactions.
 */

import { FirestoreService } from "./firebase/firestore.service"
import { COLLECTIONS } from "../config/constants"

export type JobType = "ai_analysis" | "pair_matching" | "duplicate_check"
export type JobStatus = "queued" | "processing" | "completed" | "failed"

export interface ProcessingJob {
  id?: string
  type: JobType
  itemId: string
  itemType: "lost" | "found"
  payload: Record<string, any>
  status: JobStatus
  progress: number
  result?: any
  error?: string
  attempts: number
  maxAttempts: number
  createdAt: any
  updatedAt: any
}

type JobHandler = (job: ProcessingJob) => Promise<any>

class AIQueueManager {
  private queue: ProcessingJob[] = []
  private isProcessing = false
  private handlers: Map<JobType, JobHandler> = new Map()
  private subscribers: Set<(jobs: ProcessingJob[]) => void> = new Set()

  constructor() {
    // Start consumer loop
    if (typeof window !== "undefined") {
      setInterval(() => this.processNext(), 1500)
    }
  }

  /**
   * Register handler for job types
   */
  registerHandler(type: JobType, handler: JobHandler) {
    this.handlers.set(type, handler)
  }

  /**
   * Enqueue a new background task
   */
  async enqueue(
    type: JobType,
    itemId: string,
    itemType: "lost" | "found",
    payload: Record<string, any> = {},
  ): Promise<string> {
    const job: ProcessingJob = {
      type,
      itemId,
      itemType,
      payload,
      status: "queued",
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save job to Firestore for persistent tracking
    try {
      const docId = await FirestoreService.createDocument(
        COLLECTIONS.MATCHING_QUEUE,
        job,
      )
      job.id = docId
    } catch {
      job.id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    }

    this.queue.push(job)
    this.notifySubscribers()
    this.processNext()

    return job.id!
  }

  /**
   * Subscribe to live queue state for UI progress bars
   */
  subscribe(callback: (jobs: ProcessingJob[]) => void): () => void {
    this.subscribers.add(callback)
    callback([...this.queue])
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers() {
    const current = [...this.queue]
    this.subscribers.forEach((cb) => cb(current))
  }

  /**
   * Process next queued job
   */
  private async processNext() {
    if (this.isProcessing) return

    const nextJob = this.queue.find((j) => j.status === "queued")
    if (!nextJob) return

    this.isProcessing = true
    nextJob.status = "processing"
    nextJob.progress = 25
    nextJob.attempts++
    nextJob.updatedAt = new Date().toISOString()
    this.notifySubscribers()

    const handler = this.handlers.get(nextJob.type)

    try {
      if (handler) {
        nextJob.progress = 50
        const result = await handler(nextJob)
        nextJob.result = result
        nextJob.status = "completed"
        nextJob.progress = 100
      } else {
        // Default simulated processing if no explicit handler bound
        await new Promise((r) => setTimeout(r, 1200))
        nextJob.status = "completed"
        nextJob.progress = 100
      }

      // Update in Firestore
      if (nextJob.id && !nextJob.id.startsWith("local-")) {
        await FirestoreService.updateDocument(
          COLLECTIONS.MATCHING_QUEUE,
          nextJob.id,
          {
            status: "completed",
            progress: 100,
            result: nextJob.result || null,
          },
        ).catch(() => {})
      }
    } catch (err: any) {
      console.error(`Job ${nextJob.id} failed:`, err)
      if (nextJob.attempts < nextJob.maxAttempts) {
        nextJob.status = "queued" // Retry on next cycle
      } else {
        nextJob.status = "failed"
        nextJob.error = err.message || "Unknown processing error"
      }

      if (nextJob.id && !nextJob.id.startsWith("local-")) {
        await FirestoreService.updateDocument(
          COLLECTIONS.MATCHING_QUEUE,
          nextJob.id,
          {
            status: nextJob.status,
            error: nextJob.error || null,
            attempts: nextJob.attempts,
          },
        ).catch(() => {})
      }
    } finally {
      this.isProcessing = false
      this.notifySubscribers()

      // Clean up completed jobs from memory after 15 seconds
      setTimeout(() => {
        this.queue = this.queue.filter(
          (j) =>
            j.id !== nextJob.id ||
            (j.status !== "completed" && j.status !== "failed"),
        )
        this.notifySubscribers()
      }, 15000)
    }
  }

  /**
   * Get active jobs count
   */
  getActiveJobsCount(): number {
    return this.queue.filter(
      (j) => j.status === "queued" || j.status === "processing",
    ).length
  }
}

export const QueueService = new AIQueueManager()
