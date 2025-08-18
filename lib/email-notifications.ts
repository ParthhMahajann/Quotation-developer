// Email notification system for approval workflow
// In production, integrate with services like SendGrid, Mailgun, or AWS SES

interface ApprovalNotificationData {
  quotationId: string
  quotationNumber: string
  action: "approved" | "rejected"
  approverName: string
  creatorEmail: string
  creatorName: string
  comments?: string
  totalAmount: number
  discountPercentage: number
}

export async function sendApprovalNotification(data: ApprovalNotificationData) {
  // This is a placeholder implementation
  // In production, you would integrate with an actual email service

  const emailContent = generateApprovalEmailContent(data)

  console.log(`[EMAIL NOTIFICATION] Sending ${data.action} notification to ${data.creatorEmail}`)
  console.log("Email Content:", emailContent)

  // TODO: Integrate with actual email service
  // Example with SendGrid:
  // await sendGrid.send({
  //   to: data.creatorEmail,
  //   from: 'noreply@reraconsultancy.com',
  //   subject: emailContent.subject,
  //   html: emailContent.html,
  // })

  return Promise.resolve()
}

function generateApprovalEmailContent(data: ApprovalNotificationData) {
  const isApproved = data.action === "approved"
  const subject = `Quotation ${data.quotationNumber} ${isApproved ? "Approved" : "Rejected"}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isApproved ? "#10b981" : "#ef4444"}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        .approved { background: #dcfce7; color: #166534; }
        .rejected { background: #fecaca; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        
        <div class="content">
          <p>Dear ${data.creatorName},</p>
          
          <p>Your quotation has been <strong>${data.action}</strong> by ${data.approverName}.</p>
          
          <div class="details">
            <h3>Quotation Details:</h3>
            <p><strong>Quotation Number:</strong> ${data.quotationNumber}</p>
            <p><strong>Total Amount:</strong> ₹${data.totalAmount.toLocaleString()}</p>
            <p><strong>Discount Applied:</strong> ${data.discountPercentage.toFixed(1)}%</p>
            <p><strong>Status:</strong> <span class="status ${data.action}">${data.action.toUpperCase()}</span></p>
            <p><strong>Approved By:</strong> ${data.approverName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${
            data.comments
              ? `
          <div class="details">
            <h3>Comments:</h3>
            <p>${data.comments}</p>
          </div>
          `
              : ""
          }
          
          <p>
            ${
              isApproved
                ? "You can now download the approved quotation PDF and send it to your client."
                : "Please review the comments and make necessary adjustments before resubmitting."
            }
          </p>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/quotation/${data.quotationId}" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Quotation
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p>RERA Consultancy Services</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

export async function sendApprovalRequestNotification(data: {
  quotationId: string
  quotationNumber: string
  creatorName: string
  approverEmails: string[]
  totalAmount: number
  discountPercentage: number
  requiredApprovalLevel: string
}) {
  // Send notification to approvers when quotation needs approval
  console.log(`[EMAIL NOTIFICATION] Sending approval request to approvers:`, data.approverEmails)

  const subject = `Approval Required: Quotation ${data.quotationNumber}`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Approval Required</h1>
        </div>
        
        <div class="content">
          <div class="urgent">
            <strong>Action Required:</strong> A quotation requires your approval due to discount threshold.
          </div>
          
          <div class="details">
            <h3>Quotation Details:</h3>
            <p><strong>Quotation Number:</strong> ${data.quotationNumber}</p>
            <p><strong>Created By:</strong> ${data.creatorName}</p>
            <p><strong>Total Amount:</strong> ₹${data.totalAmount.toLocaleString()}</p>
            <p><strong>Discount Applied:</strong> ${data.discountPercentage.toFixed(1)}%</p>
            <p><strong>Required Approval Level:</strong> ${data.requiredApprovalLevel.replace("_", " ").toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/approvals" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Review & Approve
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p>RERA Consultancy Services</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  // TODO: Send to all approver emails
  return Promise.resolve()
}
