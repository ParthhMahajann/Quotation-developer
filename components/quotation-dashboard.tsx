"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Calendar,
  User,
  Building,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { formatCurrency } from "@/lib/pricing-engine"

interface QuotationDashboardProps {
  quotations: any[]
  totalCount: number
  currentPage: number
  pageSize: number
  searchParams: { search?: string; status?: string; page?: string }
  userRole: string
}

export default function QuotationDashboard({
  quotations,
  totalCount,
  currentPage,
  pageSize,
  searchParams,
  userRole,
}: QuotationDashboardProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.status || "all")

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (statusFilter !== "all") params.set("status", statusFilter)
    params.set("page", "1")
    router.push(`/dashboard?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchParams.search) params.set("search", searchParams.search)
    if (searchParams.status && searchParams.status !== "all") params.set("status", searchParams.status)
    params.set("page", page.toString())
    router.push(`/dashboard?${params.toString()}`)
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

  const getServicesSummary = (quotationServices: any[]) => {
    if (!quotationServices || quotationServices.length === 0) return "No services"

    const categories = new Set(quotationServices.map((qs) => qs.services?.service_categories?.name).filter(Boolean))

    return categories.size > 0
      ? `${quotationServices.length} services (${Array.from(categories).join(", ")})`
      : `${quotationServices.length} services`
  }

  const getTotalValue = (quotationServices: any[]) => {
    if (!quotationServices || quotationServices.length === 0) return 0
    return quotationServices.reduce((total, qs) => total + (qs.final_price || 0), 0)
  }

  const handleViewQuotation = (quotationId: string) => {
    router.push(`/dashboard/quotation/${quotationId}`)
  }

  const handleEditQuotation = (quotationId: string) => {
    router.push(`/dashboard/quotation/${quotationId}/edit`)
  }

  const handleDownloadQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/pdf`)

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quotation-${quotationId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
      // You might want to show a toast notification here
      alert("Failed to download PDF. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            Search & Filter
          </CardTitle>
          <CardDescription>Find quotations by project name, developer name, or quotation number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Quotations</CardTitle>
              <CardDescription>
                {totalCount} total quotation{totalCount !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No quotations found</h3>
              <p className="text-sm mb-4">
                {searchParams.search || searchParams.status
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first quotation"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">
                        <Button variant="ghost" className="h-auto p-0 font-medium">
                          Quotation #
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" className="h-auto p-0 font-medium">
                          Developer/Project
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>
                        <Button variant="ghost" className="h-auto p-0 font-medium">
                          Total Value
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button variant="ghost" className="h-auto p-0 font-medium">
                          Created
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quotation) => (
                      <TableRow key={quotation.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm font-mono">{quotation.quotation_number}</span>
                            <span className="text-xs text-gray-500">{quotation.developer_types?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="font-medium">{quotation.developer_name}</span>
                            </div>
                            {quotation.project_name && (
                              <span className="text-sm text-gray-600">{quotation.project_name}</span>
                            )}
                            {quotation.regions && (
                              <span className="text-xs text-gray-500">{quotation.regions.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{getServicesSummary(quotation.quotation_services)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {formatCurrency(getTotalValue(quotation.quotation_services))}
                          </div>
                          {quotation.total_discount_percentage > 0 && (
                            <div className="text-xs text-red-600">
                              -{quotation.total_discount_percentage.toFixed(1)}% discount
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(quotation.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {quotation.users?.full_name || quotation.users?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewQuotation(quotation.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditQuotation(quotation.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadQuotation(quotation.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of{" "}
                    {totalCount} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="text-gray-400">...</span>
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {quotations.filter((q) => new Date(q.created_at).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold">{quotations.filter((q) => q.status === "pending_approval").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(quotations.reduce((total, q) => total + getTotalValue(q.quotation_services), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
