import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { sendApprovalNotification } from "@/lib/email-notifications"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { action, comments } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user has approval permissions
    if (!["manager", "senior_manager", "director", "admin"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get quotation with current approval status
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        users!inner(id, email, full_name),
        quotation_approvals(*)
      `)
      .eq("id", params.id)
      .single()

    if (quotationError || !quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Check if quotation needs approval
    if (quotation.status !== "pending_approval") {
      return NextResponse.json({ error: "Quotation is not pending approval" }, { status: 400 })
    }

    // Determine required approval level based on discount
    const getRequiredApprovalLevel = (discountPercentage: number) => {
      if (discountPercentage >= 30) return "director"
      if (discountPercentage >= 20) return "senior_manager"
      if (discountPercentage >= 10) return "manager"
      return "auto_approved"
    }

    const requiredLevel = getRequiredApprovalLevel(quotation.total_discount_percentage)

    // Check if user has sufficient role for this approval level
    const roleHierarchy = {
      manager: 1,
      senior_manager: 2,
      director: 3,
      admin: 4,
    }

    const requiredRoleLevel = roleHierarchy[requiredLevel as keyof typeof roleHierarchy] || 0
    const userRoleLevel = roleHierarchy[userProfile.role as keyof typeof roleHierarchy] || 0

    if (userRoleLevel < requiredRoleLevel) {
      return NextResponse.json(
        {
          error: `Insufficient role. ${requiredLevel} approval required for ${quotation.total_discount_percentage.toFixed(1)}% discount`,
        },
        { status: 403 },
      )
    }

    // Create approval record
    const { error: approvalError } = await supabase.from("quotation_approvals").insert({
      quotation_id: params.id,
      approver_user_id: user.id,
      approval_status: action, // 'approved' or 'rejected'
      approval_date: new Date().toISOString(),
      comments: comments || null,
      approval_level_required: requiredLevel,
      original_amount: quotation.total_amount + quotation.total_discount_amount,
      discounted_amount: quotation.total_amount,
      discount_percentage: quotation.total_discount_percentage,
    })

    if (approvalError) {
      return NextResponse.json({ error: "Failed to create approval record" }, { status: 500 })
    }

    // Update quotation status
    const newStatus = action === "approved" ? "approved" : "rejected"
    const { error: updateError } = await supabase
      .from("quotations")
      .update({
        status: newStatus,
        approved_at: action === "approved" ? new Date().toISOString() : null,
        approved_by: action === "approved" ? user.id : null,
      })
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update quotation status" }, { status: 500 })
    }

    // Send notification to quotation creator
    try {
      await sendApprovalNotification({
        quotationId: params.id,
        quotationNumber: quotation.quotation_number,
        action,
        approverName: userProfile.full_name || userProfile.email,
        creatorEmail: quotation.users.email,
        creatorName: quotation.users.full_name || quotation.users.email,
        comments,
        totalAmount: quotation.total_amount,
        discountPercentage: quotation.total_discount_percentage,
      })
    } catch (emailError) {
      console.error("Failed to send approval notification:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Quotation ${action} successfully`,
      status: newStatus,
    })
  } catch (error) {
    console.error("Approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
