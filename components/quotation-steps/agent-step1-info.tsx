"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Phone, Mail, Building } from "lucide-react"
import type { QuotationData } from "@/components/quotation-wizard"

interface AgentStep1InfoProps {
  quotationData: QuotationData
  updateQuotationData: (updates: Partial<QuotationData>) => void
}

export default function AgentStep1Info({ quotationData, updateQuotationData }: AgentStep1InfoProps) {
  const handleInputChange = (field: keyof QuotationData, value: any) => {
    updateQuotationData({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide your agent details for registration. All fields are required for agent registration.
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Basic contact and identification details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developerName">Full Name *</Label>
              <Input
                id="developerName"
                placeholder="Enter your full name"
                value={quotationData.developerName}
                onChange={(e) => handleInputChange("developerName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <div className="relative">
                <Phone className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="mobileNumber"
                  placeholder="Enter mobile number"
                  value={quotationData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={quotationData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            Business Information
          </CardTitle>
          <CardDescription>Agent type and business classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Agent Type *</Label>
            <Select value={quotationData.agentType} onValueChange={(value) => handleInputChange("agentType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="proprietary">Proprietary</SelectItem>
                <SelectItem value="private_ltd">Private Limited</SelectItem>
                <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Registration Validity (Days)</Label>
              <Input
                id="validityDays"
                type="number"
                value={quotationData.validityDays}
                onChange={(e) => handleInputChange("validityDays", Number.parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Schedule</Label>
              <Select
                value={quotationData.paymentSchedule}
                onValueChange={(value) => handleInputChange("paymentSchedule", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50%">50% Payment Schedule</SelectItem>
                  <SelectItem value="70%">70% Payment Schedule</SelectItem>
                  <SelectItem value="100%">100% Payment Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Notice */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Agent Registration Process:</strong> This simplified process is designed specifically for agent
              registrations. You'll select relevant services in the next step and generate your registration quotation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
