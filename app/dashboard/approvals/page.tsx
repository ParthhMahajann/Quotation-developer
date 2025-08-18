import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ApprovalDashboard from "@/components/approval-dashboard"

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Get user profile and check role
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single()

  if (profileError || !userProfile) {
    redirect("/dashboard")
  }

  // Check if user has approval permissions
  if (!["manager", "senior_manager", "director", "admin"].includes(userProfile.role)) {
    redirect("/dashboard")
  }

  // Get quotations pending approval that match user's role
  const roleHierarchy = {
    manager: ["manager"],
    senior_manager: ["manager", "senior_manager"],
    director: ["manager", "senior_manager", "director"],
    admin: ["manager", "senior_manager", "director"],
  }

  const allowedApprovalLevels = roleHierarchy[userProfile.role as keyof typeof roleHierarchy] || []

  // Build query
  let query = supabase.from("quotations").select(`
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

  // Filter by status
  const status = searchParams.status || "pending"
  if (status === "pending") {
    query = query.eq("status", "pending_approval")
  } else if (status === "approved") {
    query = query.eq("status", "approved")
  } else if (status === "rejected") {
    query = query.eq("status", "rejected")
  }

  // Add approval level filtering for pending approvals
  if (status === "pending") {
    // This is a simplified approach - in production you might want a more sophisticated query
    query = query.gte("total_discount_percentage", 10) // Only show quotations that need approval
  }

  // Pagination
  const page = Number.parseInt(searchParams.page || "1")
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const {
    data: quotations,
    error: quotationsError,
    count,
  } = await query.range(from, to).order("created_at", { ascending: false })

  if (quotationsError) {
    console.error("Error fetching quotations:", quotationsError)
    return <div>Error loading quotations</div>
  }

  // Filter quotations based on user's approval level (client-side filtering for now)
  const filteredQuotations = (quotations || []).filter((quotation) => {
    if (status !== "pending") return true

    const getRequiredApprovalLevel = (discountPercentage: number) => {
      if (discountPercentage >= 30) return "director"
      if (discountPercentage >= 20) return "senior_manager"
      if (discountPercentage >= 10) return "manager"
      return "auto_approved"
    }

    const requiredLevel = getRequiredApprovalLevel(quotation.total_discount_percentage)
    return allowedApprovalLevels.includes(requiredLevel)
  })

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Review and approve quotations that require {userProfile.role.replace("_", " ")} approval
        </p>
      </div>

      <ApprovalDashboard
        quotations={filteredQuotations}
        totalCount={count || 0}
        currentPage={page}
        pageSize={pageSize}
        searchParams={searchParams}
        userRole={userProfile.role}
        userProfile={userProfile}
      />
    </div>
  )
}
