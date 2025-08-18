"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calculator, FileText } from "lucide-react"
import type { QuotationData } from "@/components/quotation-wizard"

interface Step2ProjectConfigProps {
  regions: any[]
  plotAreaRanges: any[]
  quotationData: QuotationData
  updateQuotationData: (updates: Partial<QuotationData>) => void
}

export default function Step2ProjectConfig({
  regions,
  plotAreaRanges,
  quotationData,
  updateQuotationData,
}: Step2ProjectConfigProps) {
  const [plotAreaRange, setPlotAreaRange] = useState<any>(null)

  // Auto-detect plot area range when plot area changes
  useEffect(() => {
    if (quotationData.plotArea) {
      const range = plotAreaRanges.find(
        (range) =>
          quotationData.plotArea! >= range.min_area &&
          (range.max_area === null || quotationData.plotArea! <= range.max_area),
      )
      if (range) {
        setPlotAreaRange(range)
        updateQuotationData({ plotAreaRangeId: range.id })
      }
    }
  }, [quotationData.plotArea, plotAreaRanges, updateQuotationData])

  const handleInputChange = (field: keyof QuotationData, value: any) => {
    updateQuotationData({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide project details and location information. This data will be used for pricing calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Region Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              Project Region
            </CardTitle>
            <CardDescription>Select the geographical region</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={quotationData.regionId?.toString() || ""}
              onValueChange={(value) => handleInputChange("regionId", Number.parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{region.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {region.multiplier === 1.0
                          ? "Base"
                          : region.multiplier > 1.0
                            ? `+${((region.multiplier - 1) * 100).toFixed(0)}%`
                            : `-${((1 - region.multiplier) * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Plot Area */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Calculator className="h-4 w-4 mr-2 text-blue-600" />
              Plot Area
            </CardTitle>
            <CardDescription>Enter plot area in square feet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Enter plot area"
                value={quotationData.plotArea || ""}
                onChange={(e) => handleInputChange("plotArea", Number.parseInt(e.target.value) || null)}
                className="w-full"
              />
              {plotAreaRange && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                  <span className="text-sm text-green-800">Range: {plotAreaRange.range_label}</span>
                  <Badge variant="secondary">
                    {plotAreaRange.multiplier === 1.0
                      ? "Base"
                      : plotAreaRange.multiplier > 1.0
                        ? `+${((plotAreaRange.multiplier - 1) * 100).toFixed(0)}%`
                        : `-${((1 - plotAreaRange.multiplier) * 100).toFixed(0)}%`}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Developer Information
          </CardTitle>
          <CardDescription>Provide developer and project details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developerName">Developer Name *</Label>
              <Input
                id="developerName"
                placeholder="Enter developer name"
                value={quotationData.developerName}
                onChange={(e) => handleInputChange("developerName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Enter project name (optional)"
                value={quotationData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectLocation">Project Location</Label>
            <Input
              id="projectLocation"
              placeholder="Enter detailed project location"
              value={quotationData.projectLocation}
              onChange={(e) => handleInputChange("projectLocation", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reraNumber">RERA Number</Label>
              <Input
                id="reraNumber"
                placeholder="Enter RERA number (optional)"
                value={quotationData.reraNumber}
                onChange={(e) => handleInputChange("reraNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validityDays">Quotation Validity (Days)</Label>
              <Input
                id="validityDays"
                type="number"
                value={quotationData.validityDays}
                onChange={(e) => handleInputChange("validityDays", Number.parseInt(e.target.value) || 30)}
              />
            </div>
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
        </CardContent>
      </Card>
    </div>
  )
}
