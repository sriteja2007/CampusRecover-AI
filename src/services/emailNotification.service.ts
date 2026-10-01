/**
 * Simple Email Notification Service
 * Sends notification emails when a match is found/confirmed or contact is exchanged.
 * Provides resilient fallback logging so missing email credentials never crash the app.
 */

export interface MatchEmailPayload {
  toEmail: string
  toName: string
  matchedItemName: string
  itemReference: string
  counterpartName: string
  counterpartEmail: string
  counterpartMobile?: string
  confidence: number
  reason: string
  isFinder: boolean
}

export const EmailNotificationService = {
  /**
   * Dispatches match & contact exchange notification email
   */
  async sendMatchEmail(payload: MatchEmailPayload): Promise<boolean> {
    const roleLabel = payload.isFinder ? "Lost Item Owner" : "Finder"
    const subject = `[CampusRecover AI] Match Identified for ${payload.matchedItemName} (${payload.itemReference})`

    const messageBody = `
Hello ${payload.toName},

CampusRecover AI has identified a potential match (${payload.confidence}% confidence) for your item:
- Item: ${payload.matchedItemName}
- Reference: ${payload.itemReference}
- AI Reason: ${payload.reason}

Contact the ${roleLabel} using the information below:
- Name: ${payload.counterpartName}
- Email: ${payload.counterpartEmail}
- Mobile: ${payload.counterpartMobile || "Not provided"}

Next Steps & Safe Handover:
1. Coordinate a convenient meeting at a designated campus location (Campus Security Desk, Library Front Desk, or Student Center).
2. Use the in-app Handover Verification tool with the 6-Digit OTP or Dynamic QR token to verify custody transfer.
3. Once verified, the item will automatically be marked as RECOVERED.

Best regards,
The CampusRecover AI Team
`

    // Log formatted email in console for college demonstration inspection
    console.log(
      `%c[CampusRecover AI - Email Dispatch] To: ${payload.toEmail}`,
      "color: #2563eb; font-weight: bold;",
      {
        subject,
        to: payload.toEmail,
        body: messageBody,
      },
    )

    // If an external email API or webhook is configured in ENV, forward here
    const endpoint = (import.meta as any).env?.VITE_EMAIL_API_ENDPOINT
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: payload.toEmail,
            subject,
            text: messageBody,
          }),
        })
      } catch (err) {
        console.warn(
          "External email webhook dispatch error (safe fallback):",
          err,
        )
      }
    }

    return true
  },
}
