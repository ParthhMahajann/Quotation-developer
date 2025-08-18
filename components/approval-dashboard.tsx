"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Building,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { formatCurrency, getApprovalLevelColor, getApprovalLevelLabel } from "@/lib/pricing-engine"

interface ApprovalDashboardProps {
  quotations: any[]
  totalCount: number
  currentPage: number
  pageSize: number
  searchParams: { status?: string; page?: string }
  userRole: string
  userProfile: { role: string; full_name?: string; email: string }
}

export default function ApprovalDashboard({
  quotations,
  totalCount,
  currentPage,
  pageSize,
  searchParams,
  userRole,
  userProfile,
}: ApprovalDashboardProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState(searchParams.status || "pending")
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null)
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected" | null>(null)
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    const params = new URLSearchParams()
    if (status !== "pending") params.set("status", status)
    params.set("page", "1")
    router.push(`/dashboard/approvals?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchParams.status && searchParams.status !== "pending") params.set("status", searchParams.status)
    params.set("page", page.toString())
    router.push(`/dashboard/approvals?${params.toString()}`)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_approval
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getRequiredApprovalLevel = (discountPercentage: number) => {
    if (discountPercentage >= 30) return "director"
    if (discountPercentage >= 20) return "senior_manager"
    if (discountPercentage >= 10) return "manager"
    return "auto_approved"
  }

  const canApprove = (quotation: any) => {
    const requiredLevel = getRequiredApprovalLevel(quotation.total_discount_percentage)
    const roleHierarchy = {
      manager: 1,
      senior_manager: 2,
      director: 3,
      admin: 4,
    }
    const requiredRoleLevel = roleHierarchy[requiredLevel as keyof typeof roleHierarchy] || 0
    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
    return userRoleLevel >= requiredRoleLevel
  }

  const handleApprovalSubmit = async () => {
    if (!selectedQuotation || !approvalAction) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quotations/${selectedQuotation.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: approvalAction,
          comments: comments.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process approval")
      }

      // Refresh the page to show updated data
      router.refresh()

      // Reset form
      setSelectedQuotation(null)
      setApprovalAction(null)
      setComments("")
    } catch (error) {
      console.error("Approval error:", error)
      alert(error instanceof Error ? error.message : "Failed to process approval")
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            Approval Queue
          </CardTitle>
          <CardDescription>Review quotations requiring approval based on discount thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Showing quotations requiring <strong className="ml-1">{userRole.replace("_", " ")}</strong> approval
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Quotations for Approval</CardTitle>
              <CardDescription>
                {totalCount} quotation{totalCount !== 1 ? "s" : ""} found
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
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No quotations found</h3>
              <p className="text-sm">
                {statusFilter === "pending"
                  ? "All quotations are up to date! No approvals needed."
                  : "No quotations match the selected status filter."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation Details</TableHead>
                      <TableHead>Developer/Project</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Amount & Discount</TableHead>
                      <TableHead>Approval Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quotation) => (
                      <TableRow key={quotation.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium font-mono text-sm">{quotation.quotation_number}</span>
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
                          <div className="flex flex-col">
                            <div className="font-semibold">
                              {formatCurrency(getTotalValue(quotation.quotation_services))}
                            </div>
                            {quotation.total_discount_percentage > 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                -{quotation.total_discount_percentage.toFixed(1)}% discount
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getApprovalLevelColor(
                              getRequiredApprovalLevel(quotation.total_discount_percentage),
                            )}
                          >
                            {getApprovalLevelLabel(getRequiredApprovalLevel(quotation.total_discount_percentage))}
                          </Badge>
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
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/quotation/${quotation.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {quotation.status === "pending_approval" && canApprove(quotation) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="default" size="sm" onClick={() => setSelectedQuotation(quotation)}>
                                    Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Review Quotation {quotation.quotation_number}</DialogTitle>
                                    <DialogDescription>
                                      Approve or reject this quotation with optional comments
                                    </DialogDescription>
                                  </DialogHeader>

                                  {selectedQuotation && (
                                    <div className="space-y-4">
                                      {/* Quotation Summary */}
                                      <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-2">Quotation Summary</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-600">Developer:</span>
                                            <span className="ml-2 font-medium">{selectedQuotation.developer_name}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Total Amount:</span>
                                            <span className="ml-2 font-medium">
                                              {formatCurrency(getTotalValue(selectedQuotation.quotation_services))}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Discount:</span>
                                            <span className="ml-2 font-medium text-red-600">
                                              {selectedQuotation.total_discount_percentage.toFixed(1)}%
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Required Level:</span>
                                            <span className="ml-2 font-medium">
                                              {getApprovalLevelLabel(
                                                getRequiredApprovalLevel(selectedQuotation.total_discount_percentage),
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Selection */}
                                      <div className="space-y-3">
                                        <Label>Approval Decision</Label>
                                        <div className="flex gap-4">
                                          <Button
                                            variant={approvalAction === "approved" ? "default" : "outline"}
                                            onClick={() => setApprovalAction("approved")}
                                            className="flex items-center"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                          </Button>
                                          <Button
                                            variant={approvalAction === "rejected" ? "destructive" : "outline"}
                                            onClick={() => setApprovalAction("rejected")}
                                            className="flex items-center"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Comments */}
                                      <div className="space-y-2">
                                        <Label htmlFor="comments">
                                          Comments{" "}
                                          {approvalAction === "rejected" && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Textarea
                                          id="comments"
                                          placeholder={
                                            approvalAction === "approved"
                                              ? "Optional: Add any notes about this approval..."
                                              : "Please provide reason for rejection..."
                                          }
                                          value={comments}
                                          onChange={(e) => setComments(e.target.value)}
                                          rows={3}
                                        />
                                      </div>

                                      {/* Submit */}
                                      <div className="flex justify-end gap-2 pt-4">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedQuotation(null)
                                            setApprovalAction(null)
                                            setComments("")
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={handleApprovalSubmit}
                                          disabled={
                                            !approvalAction ||
                                            isSubmitting ||
                                            (approvalAction === "rejected" && !comments.trim())
                                          }
                                        >
                                          {isSubmitting
                                            ? "Processing..."
                                            : `${approvalAction === "approved" ? "Approve" : "Reject"} Quotation`}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
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
              <Clock className="h-8 w-8 text-yellow-600" />
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
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold">
                  {
                    quotations.filter(
                      (q) =>
                        q.status === "approved" &&
                        new Date(q.approved_at || q.created_at).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Discount (30%+)</p>
                <p className="text-2xl font-bold">
                  {quotations.filter((q) => q.total_discount_percentage >= 30).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
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
