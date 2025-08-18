import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Edit, User, Building, FileText } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/pricing-engine"

export default async function QuotationViewPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch quotation with all related data
  const { data: quotation, error } = await supabase
    .from("quotations")
    .select(`
      *,
      users!quotations_user_id_fkey(full_name, email),
      developer_types(name, multiplier),
      regions(name),
      plot_area_ranges(range_label),
      quotation_services(
        *,
        services(name, description, service_categories(name))
      ),
      quotation_approvals(
        *,
        users!quotation_approvals_approver_user_id_fkey(full_name, email)
      )
    `)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !quotation) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Approved", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
      sent: { label: "Sent", color: "bg-blue-100 text-blue-800" },
      expired: { label: "Expired", color: "bg-gray-100 text-gray-600" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const totalValue =
    quotation.quotation_services?.reduce((total: number, qs: any) => total + (qs.final_price || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-semibold text-gray-900">Quotation Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/dashboard/quotation/${quotation.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <form action={`/api/quotations/${quotation.id}/pdf`} method="GET">
                <Button size="sm" type="submit">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Quotation Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{quotation.quotation_number}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Created on {new Date(quotation.created_at).toLocaleDateString()} by{" "}
                    {quotation.users?.full_name || quotation.users?.email}
                  </CardDescription>
                </div>
                <div className="text-right">
                  {getStatusBadge(quotation.status)}
                  <div className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalValue)}</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Developer Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Developer Name:</span>
                      <span className="ml-2 font-medium">{quotation.developer_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Developer Type:</span>
                      <span className="ml-2">{quotation.developer_types?.name}</span>
                    </div>
                    {quotation.project_name && (
                      <div>
                        <span className="text-gray-500">Project Name:</span>
                        <span className="ml-2">{quotation.project_name}</span>
                      </div>
                    )}
                    {quotation.project_location && (
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2">{quotation.project_location}</span>
                      </div>
                    )}
                    {quotation.rera_number && (
                      <div>
                        <span className="text-gray-500">RERA Number:</span>
                        <span className="ml-2 font-mono">{quotation.rera_number}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Specifications</h4>
                  <div className="space-y-2 text-sm">
                    {quotation.regions && (
                      <div>
                        <span className="text-gray-500">Region:</span>
                        <span className="ml-2">{quotation.regions.name}</span>
                      </div>
                    )}
                    {quotation.plot_area && (
                      <div>
                        <span className="text-gray-500">Plot Area:</span>
                        <span className="ml-2">{quotation.plot_area} sq ft</span>
                      </div>
                    )}
                    {quotation.plot_area_ranges && (
                      <div>
                        <span className="text-gray-500">Area Range:</span>
                        <span className="ml-2">{quotation.plot_area_ranges.range_label}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Validity:</span>
                      <span className="ml-2">{quotation.validity_days} days</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Schedule:</span>
                      <span className="ml-2">{quotation.payment_schedule}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Services</CardTitle>
              <CardDescription>
                {quotation.quotation_services?.length || 0} service
                {(quotation.quotation_services?.length || 0) !== 1 ? "s" : ""} selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotation.quotation_services?.map((qs: any) => (
                  <div key={qs.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{qs.services?.name}</h4>
                      <p className="text-sm text-gray-600">{qs.services?.service_categories?.name}</p>
                      {qs.services?.description && (
                        <p className="text-xs text-gray-500 mt-1">{qs.services.description}</p>
                      )}
                      {qs.discount_reason && (
                        <p className="text-xs text-blue-600 mt-1">Discount reason: {qs.discount_reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {qs.original_price !== qs.final_price && (
                        <div className="text-sm text-gray-500 line-through">{formatCurrency(qs.original_price)}</div>
                      )}
                      <div className="font-semibold text-lg">{formatCurrency(qs.final_price)}</div>
                      {qs.discount_percentage > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          -{qs.discount_percentage.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.total_discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Total Discount ({quotation.total_discount_percentage?.toFixed(1)}%):</span>
                    <span>-{formatCurrency(quotation.total_discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Final Total:</span>
                  <span>{formatCurrency(quotation.final_total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          {quotation.quotation_approvals && quotation.quotation_approvals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quotation.quotation_approvals.map((approval: any) => (
                    <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium">
                            {approval.users?.full_name || approval.users?.email || "System"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {approval.approval_level_required.replace("_", " ").toUpperCase()} approval
                        </p>
                        {approval.comments && <p className="text-sm text-gray-500 mt-1">{approval.comments}</p>}
                      </div>
                      <div className="text-right">
                        {getStatusBadge(approval.approval_status)}
                        {approval.approval_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(approval.approval_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
