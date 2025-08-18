"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calculator, Edit, AlertTriangle, CheckCircle, TrendingUp, Info } from "lucide-react"
import {
  PricingEngine,
  type QuotationPricing,
  formatCurrency,
  formatPercentage,
  getApprovalLevelColor,
  getApprovalLevelLabel,
} from "@/lib/pricing-engine"
import type { QuotationData } from "@/components/quotation-wizard"

interface Step4ReviewPricingProps {
  services: any[]
  quotationData: QuotationData
  updateQuotationData: (updates: Partial<QuotationData>) => void
  developerTypes: any[]
  regions: any[]
  plotAreaRanges: any[]
  serviceCategories: any[]
}

export default function Step4ReviewPricing({
  services,
  quotationData,
  updateQuotationData,
  developerTypes,
  regions,
  plotAreaRanges,
  serviceCategories,
}: Step4ReviewPricingProps) {
  const [pricingEngine] = useState(
    () => new PricingEngine(developerTypes, regions, plotAreaRanges, serviceCategories, services),
  )
  const [quotationPricing, setQuotationPricing] = useState<QuotationPricing | null>(null)
  const [editingService, setEditingService] = useState<number | null>(null)
  const [tempPrice, setTempPrice] = useState("")
  const [tempReason, setTempReason] = useState("")
  const [showPricingBreakdown, setShowPricingBreakdown] = useState<number | null>(null)

  useEffect(() => {
    if (quotationData.selectedServices.length > 0) {
      const existingPricing: { [serviceId: number]: { modifiedPrice: number; discountReason: string } } = {}

      // Convert existing service pricing to the format expected by pricing engine
      Object.entries(quotationData.servicePricing).forEach(([serviceId, pricing]) => {
        existingPricing[Number.parseInt(serviceId)] = {
          modifiedPrice: pricing.modifiedPrice,
          discountReason: pricing.discountReason,
        }
      })

      const pricing = pricingEngine.calculateQuotationPricing(
        quotationData.developerTypeId!,
        quotationData.regionId,
        quotationData.plotAreaRangeId,
        quotationData.selectedServices,
        existingPricing,
      )

      setQuotationPricing(pricing)

      // Update quotation data with calculated pricing
      const newServicePricing: {
        [serviceId: number]: { originalPrice: number; modifiedPrice: number; discountReason: string }
      } = {}
      pricing.services.forEach((service) => {
        newServicePricing[service.serviceId] = {
          originalPrice: service.calculatedPrice,
          modifiedPrice: service.finalPrice,
          discountReason: service.discountReason,
        }
      })

      updateQuotationData({
        servicePricing: newServicePricing,
        totalDiscount: pricing.totalDiscountPercentage,
        finalTotal: pricing.roundedTotal,
      })
    }
  }, [
    quotationData.selectedServices,
    quotationData.developerTypeId,
    quotationData.regionId,
    quotationData.plotAreaRangeId,
  ])

  const handleEditPrice = (serviceId: number) => {
    const service = quotationPricing?.services.find((s) => s.serviceId === serviceId)
    if (service) {
      setTempPrice(service.finalPrice.toString())
      setTempReason(service.discountReason)
      setEditingService(serviceId)
    }
  }

  const handleSavePrice = () => {
    if (editingService && tempPrice && quotationPricing) {
      const newPrice = Number.parseFloat(tempPrice)
      const updatedPricing = pricingEngine.updateServicePrice(quotationPricing, editingService, newPrice, tempReason)

      setQuotationPricing(updatedPricing)

      // Update quotation data
      const newServicePricing: {
        [serviceId: number]: { originalPrice: number; modifiedPrice: number; discountReason: string }
      } = {}
      updatedPricing.services.forEach((service) => {
        newServicePricing[service.serviceId] = {
          originalPrice: service.calculatedPrice,
          modifiedPrice: service.finalPrice,
          discountReason: service.discountReason,
        }
      })

      updateQuotationData({
        servicePricing: newServicePricing,
        totalDiscount: updatedPricing.totalDiscountPercentage,
        finalTotal: updatedPricing.roundedTotal,
      })

      setEditingService(null)
      setTempPrice("")
      setTempReason("")
    }
  }

  const showBreakdown = (serviceId: number) => {
    setShowPricingBreakdown(serviceId)
  }

  if (!quotationPricing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Calculating pricing...</span>
      </div>
    )
  }

  const validation = pricingEngine.validatePricing(quotationPricing)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review & Pricing</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review the calculated pricing based on your selections. Prices are automatically calculated using developer
          type, region, plot area, and service complexity factors.
        </p>
      </div>

      {/* Pricing Factors Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <TrendingUp className="h-5 w-5 mr-2" />
            Pricing Factors Applied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Developer Type:</span>
              <div className="text-blue-900">
                {developerTypes.find((dt) => dt.id === quotationData.developerTypeId)?.name}
                <Badge variant="secondary" className="ml-1">
                  {formatPercentage(
                    (developerTypes.find((dt) => dt.id === quotationData.developerTypeId)?.multiplier - 1) * 100,
                  )}
                </Badge>
              </div>
            </div>
            {quotationData.regionId && (
              <div>
                <span className="text-blue-700 font-medium">Region:</span>
                <div className="text-blue-900">
                  {regions.find((r) => r.id === quotationData.regionId)?.name}
                  <Badge variant="secondary" className="ml-1">
                    {formatPercentage((regions.find((r) => r.id === quotationData.regionId)?.multiplier - 1) * 100)}
                  </Badge>
                </div>
              </div>
            )}
            {quotationData.plotAreaRangeId && (
              <div>
                <span className="text-blue-700 font-medium">Plot Area:</span>
                <div className="text-blue-900">
                  {plotAreaRanges.find((par) => par.id === quotationData.plotAreaRangeId)?.range_label}
                  <Badge variant="secondary" className="ml-1">
                    {formatPercentage(
                      (plotAreaRanges.find((par) => par.id === quotationData.plotAreaRangeId)?.multiplier - 1) * 100,
                    )}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-600" />
            Service Pricing Breakdown
          </CardTitle>
          <CardDescription>Detailed pricing for each selected service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quotationPricing.services.map((servicePricing) => (
              <div key={servicePricing.serviceId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{servicePricing.serviceName}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">Base: {formatCurrency(servicePricing.basePrice)}</span>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-xs text-gray-600">
                        Calculated: {formatCurrency(servicePricing.calculatedPrice)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showBreakdown(servicePricing.serviceId)}
                        className="h-6 px-2 text-xs"
                      >
                        <Info className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                    {servicePricing.discountReason && (
                      <p className="text-xs text-blue-600 mt-1">Reason: {servicePricing.discountReason}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {servicePricing.discountAmount > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">
                          {formatCurrency(servicePricing.calculatedPrice)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          -{servicePricing.discountPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(servicePricing.finalPrice)}</div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditPrice(servicePricing.serviceId)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Service Price</DialogTitle>
                          <DialogDescription>Modify the price for {servicePricing.serviceName}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="calculatedPrice">Calculated Price</Label>
                            <Input
                              id="calculatedPrice"
                              value={formatCurrency(servicePricing.calculatedPrice)}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPrice">New Price</Label>
                            <Input
                              id="newPrice"
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              placeholder="Enter new price"
                            />
                          </div>
                          <div>
                            <Label htmlFor="reason">Discount Reason</Label>
                            <Textarea
                              id="reason"
                              value={tempReason}
                              onChange={(e) => setTempReason(e.target.value)}
                              placeholder="Enter reason for price change (optional)"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setEditingService(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSavePrice}>Save Changes</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Pricing Breakdown Dialog */}
                {showPricingBreakdown === servicePricing.serviceId && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <h5 className="font-medium text-sm mb-2">Pricing Calculation Breakdown</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrency(servicePricing.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Developer Type (
                          {formatPercentage((servicePricing.pricingFactors.developerTypeMultiplier - 1) * 100)}):
                        </span>
                        <span>
                          {formatCurrency(
                            servicePricing.basePrice * servicePricing.pricingFactors.developerTypeMultiplier,
                          )}
                        </span>
                      </div>
                      {servicePricing.pricingFactors.regionalMultiplier !== 1 && (
                        <div className="flex justify-between">
                          <span>
                            Regional ({formatPercentage((servicePricing.pricingFactors.regionalMultiplier - 1) * 100)}):
                          </span>
                          <span>
                            {formatCurrency(
                              servicePricing.basePrice *
                                servicePricing.pricingFactors.developerTypeMultiplier *
                                servicePricing.pricingFactors.regionalMultiplier,
                            )}
                          </span>
                        </div>
                      )}
                      {servicePricing.pricingFactors.plotAreaMultiplier !== 1 && (
                        <div className="flex justify-between">
                          <span>
                            Plot Area ({formatPercentage((servicePricing.pricingFactors.plotAreaMultiplier - 1) * 100)}
                            ):
                          </span>
                          <span>
                            {formatCurrency(
                              servicePricing.basePrice *
                                servicePricing.pricingFactors.developerTypeMultiplier *
                                servicePricing.pricingFactors.regionalMultiplier *
                                servicePricing.pricingFactors.plotAreaMultiplier,
                            )}
                          </span>
                        </div>
                      )}
                      {servicePricing.pricingFactors.serviceComplexityFactor !== 1 && (
                        <div className="flex justify-between">
                          <span>
                            Complexity (
                            {formatPercentage((servicePricing.pricingFactors.serviceComplexityFactor - 1) * 100)}):
                          </span>
                          <span>{formatCurrency(servicePricing.calculatedPrice)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Calculated Price:</span>
                        <span>{formatCurrency(servicePricing.calculatedPrice)}</span>
                      </div>
                      {servicePricing.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(servicePricing.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>Final Price:</span>
                        <span>{formatCurrency(servicePricing.finalPrice)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPricingBreakdown(null)}
                      className="mt-2 h-6 px-2 text-xs"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal ({quotationPricing.services.length} services)</span>
              <span>{formatCurrency(quotationPricing.subtotal + quotationPricing.totalDiscountAmount)}</span>
            </div>
            {quotationPricing.totalDiscountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Total Discount ({quotationPricing.totalDiscountPercentage.toFixed(1)}%)</span>
                <span>-{formatCurrency(quotationPricing.totalDiscountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Final Total</span>
              <span>{formatCurrency(quotationPricing.finalTotal)}</span>
            </div>
            {quotationPricing.roundedTotal !== quotationPricing.finalTotal && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Rounded Total</span>
                <span>{formatCurrency(quotationPricing.roundedTotal)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {!validation.isValid && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Pricing Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Approval Status */}
      <Card
        className={quotationPricing.needsApproval ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}
      >
        <CardHeader>
          <CardTitle className="flex items-center">
            {quotationPricing.needsApproval ? (
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            )}
            Approval Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {quotationPricing.needsApproval
                  ? `This quotation requires approval due to ${quotationPricing.totalDiscountPercentage.toFixed(1)}% discount.`
                  : "This quotation can be generated immediately."}
              </p>
            </div>
            <Badge className={getApprovalLevelColor(quotationPricing.approvalLevel)}>
              {getApprovalLevelLabel(quotationPricing.approvalLevel)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
