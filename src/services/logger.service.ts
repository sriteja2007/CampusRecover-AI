export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: any
  userId?: string
  url?: string
}

class LoggerService {
  private isDev = import.meta.env.DEV
  private currentUserId?: string

  public setUserId(userId?: string) {
    this.currentUserId = userId
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userId: this.currentUserId,
      url: typeof window !== "undefined" ? window.location.pathname : undefined,
    }
  }

  private output(entry: LogEntry) {
    const prefix = `[${entry.timestamp}] [${entry.level}] ${
      entry.context ? `[${entry.context}] ` : ""
    }${entry.message}`

    if (this.isDev) {
      switch (entry.level) {
        case "DEBUG":
          console.debug(`%c${prefix}`, "color: #94a3b8", entry.data || "")
          break
        case "INFO":
          console.info(`%c${prefix}`, "color: #0ea5e9", entry.data || "")
          break
        case "WARN":
          console.warn(`%c${prefix}`, "color: #f59e0b", entry.data || "")
          break
        case "ERROR":
          console.error(`%c${prefix}`, "color: #ef4444", entry.data || "")
          break
      }
    } else if (entry.level !== "DEBUG") {
      // Production telemetry dispatch (can be connected to Sentry, Datadog, or Firestore)
      if (entry.level === "ERROR") {
        try {
          // Store critical errors in memory/localStorage for diagnostics
          const savedErrors = JSON.parse(
            localStorage.getItem("cr_error_logs") || "[]",
          )
          savedErrors.unshift(entry)
          localStorage.setItem(
            "cr_error_logs",
            JSON.stringify(savedErrors.slice(0, 50)),
          )
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  }

  public debug(message: string, context?: string, data?: any) {
    this.output(this.formatEntry("DEBUG", message, context, data))
  }

  public info(message: string, context?: string, data?: any) {
    this.output(this.formatEntry("INFO", message, context, data))
  }

  public warn(message: string, context?: string, data?: any) {
    this.output(this.formatEntry("WARN", message, context, data))
  }

  public error(message: string, context?: string, errorOrData?: any) {
    let errorData = errorOrData
    if (errorOrData instanceof Error) {
      errorData = {
        name: errorOrData.name,
        message: errorOrData.message,
        stack: errorOrData.stack,
      }
    }
    this.output(this.formatEntry("ERROR", message, context, errorData))
  }
}

export const Logger = new LoggerService()
export default Logger
