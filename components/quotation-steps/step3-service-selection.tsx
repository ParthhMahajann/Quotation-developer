"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Package, AlertCircle } from "lucide-react"
import type { QuotationData } from "@/components/quotation-wizard"

interface Step3ServiceSelectionProps {
  serviceCategories: any[]
  services: any[]
  quotationData: QuotationData
  updateQuotationData: (updates: Partial<QuotationData>) => void
}

export default function Step3ServiceSelection({
  serviceCategories,
  services,
  quotationData,
  updateQuotationData,
}: Step3ServiceSelectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    const updatedServices = checked
      ? [...quotationData.selectedServices, serviceId]
      : quotationData.selectedServices.filter((id) => id !== serviceId)

    updateQuotationData({ selectedServices: updatedServices })
  }

  const handleSelectAll = () => {
    const allServiceIds = services.map((service) => service.id)
    updateQuotationData({ selectedServices: allServiceIds })
  }

  const handleClearAll = () => {
    updateQuotationData({ selectedServices: [] })
  }

  const getServicesByCategory = (categoryId: number) => {
    return services.filter((service) => service.category_id === categoryId)
  }

  const getCategoryTotal = (categoryId: number) => {
    const categoryServices = getServicesByCategory(categoryId)
    return categoryServices
      .filter((service) => quotationData.selectedServices.includes(service.id))
      .reduce((total, service) => total + service.base_price, 0)
  }

  const grandTotal = quotationData.selectedServices.reduce((total, serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    return total + (service?.base_price || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Selection</h3>
          <p className="text-sm text-gray-600">
            Choose the services you need. Mandatory services are automatically included.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Service Categories */}
      <div className="space-y-4">
        {serviceCategories.map((category) => {
          const categoryServices = getServicesByCategory(category.id)
          const selectedInCategory = categoryServices.filter((service) =>
            quotationData.selectedServices.includes(service.id),
          ).length
          const isExpanded = expandedCategories.includes(category.id)
          const categoryTotal = getCategoryTotal(category.id)

          return (
            <Card key={category.id}>
              <Collapsible>
                <CollapsibleTrigger onClick={() => toggleCategory(category.id)} className="w-full">
                  <CardHeader className="hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        <div className="text-left">
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedInCategory > 0 && <Badge variant="secondary">{selectedInCategory} selected</Badge>}
                        {categoryTotal > 0 && (
                          <Badge className="bg-green-100 text-green-800">₹{categoryTotal.toLocaleString()}</Badge>
                        )}
                        <Badge variant="outline">{category.complexity_factor}x complexity</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {categoryServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={quotationData.selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                              disabled={service.is_mandatory}
                            />
                            <div>
                              <label
                                htmlFor={`service-${service.id}`}
                                className="text-sm font-medium cursor-pointer flex items-center"
                              >
                                {service.name}
                                {service.is_mandatory && <AlertCircle className="h-4 w-4 ml-1 text-orange-500" />}
                              </label>
                              <p className="text-xs text-gray-500">{service.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {service.is_mandatory && (
                              <Badge variant="secondary" className="text-xs">
                                Mandatory
                              </Badge>
                            )}
                            <span className="text-sm font-medium">₹{service.base_price.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      {quotationData.selectedServices.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">Selection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">{quotationData.selectedServices.length} services selected</span>
              <span className="text-lg font-semibold text-blue-900">Base Total: ₹{grandTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              * Final pricing will be calculated based on developer type, region, and plot area in the next step.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
