import { formatCurrency } from "./pricing-engine"

interface QuotationData {
  id: string
  quotation_number: string
  developer_name: string
  project_name?: string
  project_location?: string
  plot_area?: number
  rera_number?: string
  validity_days: number
  payment_schedule: string
  status: string
  total_amount: number
  total_discount_amount: number
  total_discount_percentage: number
  created_at: string
  developer_types: { name: string }
  regions: { name: string }
  users: { full_name?: string; email: string }
  quotation_services: Array<{
    id: string
    original_price: number
    final_price: number
    discount_percentage: number
    services: {
      name: string
      service_categories: { name: string }
    }
  }>
  quotation_approvals?: Array<{
    approval_status: string
    approval_date?: string
    comments?: string
    approver: { full_name?: string; email: string }
  }>
}

export async function generateQuotationPDF(quotation: QuotationData): Promise<Buffer> {
  // For now, we'll generate a simple HTML-based PDF
  // In production, you might want to use libraries like puppeteer or jsPDF
  const htmlContent = generateQuotationHTML(quotation)

  // This is a simplified implementation
  // In a real application, you would use a proper PDF generation library
  const pdfBuffer = Buffer.from(htmlContent, "utf-8")

  return pdfBuffer
}

function generateQuotationHTML(quotation: QuotationData): string {
  const isAgentQuotation = quotation.developer_types.name === "Agent Registration"
  const validUntil = new Date(quotation.created_at)
  validUntil.setDate(validUntil.getDate() + quotation.validity_days)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation ${quotation.quotation_number}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .company-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
        }
        .quotation-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
        }
        .quotation-number {
            font-size: 18px;
            color: #2563eb;
            font-weight: bold;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .info-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .info-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .info-label {
            font-weight: 500;
            color: #4b5563;
        }
        .info-value {
            color: #1f2937;
        }
        .services-section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .services-table th,
        .services-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .services-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        .services-table tr:hover {
            background-color: #f9fafb;
        }
        .price-summary {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .price-row.total {
            border-top: 2px solid #0ea5e9;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #0c4a6e;
        }
        .discount-row {
            color: #dc2626;
            font-weight: 500;
        }
        .terms-section {
            margin: 30px 0;
            background: #fefefe;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        .terms-list {
            list-style-type: decimal;
            padding-left: 20px;
        }
        .terms-list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-approved { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-rejected { background: #fecaca; color: #991b1b; }
        @media print {
            body { margin: 0; padding: 15px; }
            .info-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">RERA Consultancy Services</div>
        <div class="company-tagline">Professional Real Estate Regulatory Authority Solutions</div>
        <div class="quotation-title">
            ${isAgentQuotation ? "Agent Registration" : "Service"} Quotation
        </div>
        <div class="quotation-number">${quotation.quotation_number}</div>
        <span class="status-badge status-${quotation.status.replace("_", "-")}">${quotation.status.replace("_", " ")}</span>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <div class="info-title">${isAgentQuotation ? "Agent" : "Developer"} Information</div>
            <div class="info-item">
                <span class="info-label">${isAgentQuotation ? "Agent" : "Developer"} Name:</span>
                <span class="info-value">${quotation.developer_name}</span>
            </div>
            ${
              quotation.project_name
                ? `
            <div class="info-item">
                <span class="info-label">Project Name:</span>
                <span class="info-value">${quotation.project_name}</span>
            </div>
            `
                : ""
            }
            ${
              quotation.project_location
                ? `
            <div class="info-item">
                <span class="info-label">Location:</span>
                <span class="info-value">${quotation.project_location}</span>
            </div>
            `
                : ""
            }
            <div class="info-item">
                <span class="info-label">Region:</span>
                <span class="info-value">${quotation.regions.name}</span>
            </div>
            ${
              quotation.plot_area
                ? `
            <div class="info-item">
                <span class="info-label">Plot Area:</span>
                <span class="info-value">${quotation.plot_area} sq ft</span>
            </div>
            `
                : ""
            }
            ${
              quotation.rera_number
                ? `
            <div class="info-item">
                <span class="info-label">RERA Number:</span>
                <span class="info-value">${quotation.rera_number}</span>
            </div>
            `
                : ""
            }
        </div>

        <div class="info-section">
            <div class="info-title">Quotation Details</div>
            <div class="info-item">
                <span class="info-label">Date:</span>
                <span class="info-value">${new Date(quotation.created_at).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Valid Until:</span>
                <span class="info-value">${validUntil.toLocaleDateString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Payment Schedule:</span>
                <span class="info-value">${quotation.payment_schedule}% Advance</span>
            </div>
            <div class="info-item">
                <span class="info-label">Developer Type:</span>
                <span class="info-value">${quotation.developer_types.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Prepared By:</span>
                <span class="info-value">${quotation.users.full_name || quotation.users.email}</span>
            </div>
        </div>
    </div>

    <div class="services-section">
        <div class="section-title">Services Breakdown</div>
        <table class="services-table">
            <thead>
                <tr>
                    <th>Service Category</th>
                    <th>Service Name</th>
                    <th>Original Price</th>
                    ${quotation.total_discount_percentage > 0 ? "<th>Discount</th><th>Final Price</th>" : "<th>Price</th>"}
                </tr>
            </thead>
            <tbody>
                ${quotation.quotation_services
                  .map(
                    (service) => `
                <tr>
                    <td>${service.services.service_categories.name}</td>
                    <td>${service.services.name}</td>
                    <td>${formatCurrency(service.original_price)}</td>
                    ${
                      quotation.total_discount_percentage > 0
                        ? `
                    <td>${service.discount_percentage > 0 ? `${service.discount_percentage.toFixed(1)}%` : "-"}</td>
                    <td><strong>${formatCurrency(service.final_price)}</strong></td>
                    `
                        : `
                    <td><strong>${formatCurrency(service.final_price)}</strong></td>
                    `
                    }
                </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    </div>

    <div class="price-summary">
        <div class="price-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(quotation.total_amount + quotation.total_discount_amount)}</span>
        </div>
        ${
          quotation.total_discount_amount > 0
            ? `
        <div class="price-row discount-row">
            <span>Discount (${quotation.total_discount_percentage.toFixed(1)}%):</span>
            <span>-${formatCurrency(quotation.total_discount_amount)}</span>
        </div>
        `
            : ""
        }
        <div class="price-row total">
            <span>Total Amount:</span>
            <span>${formatCurrency(quotation.total_amount)}</span>
        </div>
    </div>

    ${
      quotation.quotation_approvals && quotation.quotation_approvals.length > 0
        ? `
    <div class="services-section">
        <div class="section-title">Approval History</div>
        ${quotation.quotation_approvals
          .map(
            (approval) => `
        <div class="info-item">
            <span class="info-label">${approval.approval_status} by ${approval.approver.full_name || approval.approver.email}:</span>
            <span class="info-value">${approval.approval_date ? new Date(approval.approval_date).toLocaleDateString() : "Pending"}</span>
        </div>
        ${approval.comments ? `<div style="margin-left: 20px; font-style: italic; color: #6b7280;">${approval.comments}</div>` : ""}
        `,
          )
          .join("")}
    </div>
    `
        : ""
    }

    <div class="terms-section">
        <div class="section-title">Terms & Conditions</div>
        <ol class="terms-list">
            <li>This quotation is valid for ${quotation.validity_days} days from the date of issue.</li>
            <li>Payment terms: ${quotation.payment_schedule}% advance payment required to commence work.</li>
            <li>All government fees, stamp duties, and statutory charges are additional and will be charged as per actuals.</li>
            <li>The scope of work is limited to the services mentioned in this quotation only.</li>
            <li>Any additional services required will be charged separately as per our standard rates.</li>
            <li>All disputes are subject to Mumbai jurisdiction only.</li>
            <li>This quotation supersedes all previous quotations for the same project.</li>
            ${
              isAgentQuotation
                ? `
            <li>Agent registration services include complete documentation and liaison with RERA authorities.</li>
            <li>Processing time may vary based on RERA authority response and document completeness.</li>
            `
                : `
            <li>Project registration timelines depend on RERA authority processing and document completeness.</li>
            <li>Regular updates will be provided throughout the service delivery process.</li>
            `
            }
        </ol>
    </div>

    <div class="footer">
        <p><strong>RERA Consultancy Services</strong></p>
        <p>Professional Real Estate Regulatory Authority Solutions</p>
        <p>Email: info@reraconsultancy.com | Phone: +91 98765 43210</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
</body>
</html>
  `
}
