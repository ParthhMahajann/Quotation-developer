import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateQuotationPDF } from "@/lib/pdf-generator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch quotation with all related data
    const { data: quotation, error } = await supabase
      .from("quotations")
      .select(`
        *,
        users!inner(id, email, full_name),
        developer_types(name),
        regions(name),
        quotation_services(
          *,
          services(
            name,
            service_categories(name)
          )
        ),
        quotation_approvals(
          *,
          approver:users!quotation_approvals_approver_user_id_fkey(full_name, email)
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Check if user has access to this quotation
    if (quotation.user_id !== user.id) {
      // Check if user has admin/manager role
      const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!userProfile || !["admin", "manager"].includes(userProfile.role)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Generate PDF
    const pdfBuffer = await generateQuotationPDF(quotation)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.quotation_number}.pdf"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
