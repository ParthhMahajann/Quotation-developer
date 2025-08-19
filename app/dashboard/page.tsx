import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Building2, LogOut, Plus } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"
import QuotationDashboard from "@/components/quotation-dashboard"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Connect Supabase to get started</h1>
      </div>
    )
  }

  // ✅ Await Supabase client and searchParams
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Pagination
  const page = Number.parseInt(params.page || "1")
  const pageSize = 10
  const offset = (page - 1) * pageSize

  // Quotations query
  let quotationsQuery = supabase
    .from("quotations")
    .select(
      `
      *,
      users!quotations_user_id_fkey(full_name, email),
      developer_types(name, multiplier),
      regions(name),
      quotation_services(
        id,
        final_price,
        services(name, service_categories(name))
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Apply search filter
  if (params.search) {
    quotationsQuery = quotationsQuery.or(
      `developer_name.ilike.%${params.search}%,project_name.ilike.%${params.search}%,quotation_number.ilike.%${params.search}%`
    )
  }

  // Apply status filter
  if (params.status && params.status !== "all") {
    quotationsQuery = quotationsQuery.eq("status", params.status)
  }

  const { data: quotations, error } = await quotationsQuery.range(offset, offset + pageSize - 1)

  // Count query
  let countQuery = supabase.from("quotations").select("*", { count: "exact", head: true }).eq("user_id", user.id)

  if (params.search) {
    countQuery = countQuery.or(
      `developer_name.ilike.%${params.search}%,project_name.ilike.%${params.search}%,quotation_number.ilike.%${params.search}%`
    )
  }

  if (params.status && params.status !== "all") {
    countQuery = countQuery.eq("status", params.status)
  }

  const { count: totalCount } = await countQuery

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">RERA Quotation System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userProfile?.full_name || user.email}</span>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Dashboard</h2>
            <p className="text-gray-600">Manage your RERA quotations and track their progress</p>
          </div>
          <Link href="/dashboard/quotation/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
          </Link>
        </div>

        <QuotationDashboard
          quotations={quotations || []}
          totalCount={totalCount || 0}
          currentPage={page}
          pageSize={pageSize}
          searchParams={params}
          userRole={userProfile?.role || "user"}
        />
      </main>
    </div>
  )
}
