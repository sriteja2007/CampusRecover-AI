/**
 * Email Notification Service
 *
 * Generates and dispatches notifications formatted for campus users
 * with tracking, delivery logging, and templates.
 */

export interface EmailPayload {
  to: string
  subject: string
  template: "match_found" | "claim_submitted" | "claim_approved" | "security_handover" | "fraud_alert"
  data: Record<string, any>
}

export const EmailService = {
  /**
   * Dispatches an email notification (production mock + webhook extensible)
   */
  async sendEmail(payload: EmailPayload): Promise<{
    success: boolean
    messageId: string
  }> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Log dispatch in console for dev audit
    console.info(
      `[EmailService] Dispatching ${payload.template} to ${payload.to}`,
      {
        subject: payload.subject,
        data: payload.data,
        messageId,
      },
    )

    // In production with SendGrid/Resend/AWS SES:
    // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(payload) })

    return {
      success: true,
      messageId,
    }
  },

  /**
   * Helper to dispatch match found notification email
   */
  async notifyMatchFound(
    userEmail: string,
    userName: string,
    itemTitle: string,
    score: number,
    matchUrl: string,
  ) {
    return this.sendEmail({
      to: userEmail,
      subject: `AI Match Found: ${itemTitle} (${score}% Match)`,
      template: "match_found",
      data: {
        userName,
        itemTitle,
        score,
        matchUrl,
        sentAt: new Date().toLocaleTimeString(),
      },
    })
  },

  /**
   * Helper to dispatch claim approval email
   */
  async notifyClaimApproved(
    userEmail: string,
    userName: string,
    itemTitle: string,
    pickupLocation: string,
  ) {
    return this.sendEmail({
      to: userEmail,
      subject: `Claim Approved: Pickup Ready for ${itemTitle}`,
      template: "claim_approved",
      data: {
        userName,
        itemTitle,
        pickupLocation,
        action: "Bring your Student ID or QR Code to the designated office.",
      },
    })
  },
}
