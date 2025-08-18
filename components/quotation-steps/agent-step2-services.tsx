"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle } from "lucide-react"
import type { QuotationData } from "@/components/quotation-wizard"

interface AgentStep2ServicesProps {
  services: any[]
  quotationData: QuotationData
  updateQuotationData: (updates: Partial<QuotationData>) => void
}

export default function AgentStep2Services({ services, quotationData, updateQuotationData }: AgentStep2ServicesProps) {
  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    const updatedServices = checked
      ? [...quotationData.selectedServices, serviceId]
      : quotationData.selectedServices.filter((id) => id !== serviceId)

    updateQuotationData({ selectedServices: updatedServices })
  }

  const totalAmount = quotationData.selectedServices.reduce((total, serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    return total + (service?.base_price || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Services</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select the services you need for your agent registration. These are specialized services for agents.
        </p>
      </div>

      {/* Agent Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Available Agent Services
          </CardTitle>
          <CardDescription>Choose from agent-specific registration services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={quotationData.selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                  />
                  <div>
                    <label
                      htmlFor={`service-${service.id}`}
                      className="text-sm font-medium cursor-pointer flex items-center"
                    >
                      {service.name}
                      {service.is_mandatory && <CheckCircle className="h-4 w-4 ml-1 text-green-500" />}
                    </label>
                    <p className="text-xs text-gray-500">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {service.is_mandatory && (
                    <Badge variant="secondary" className="text-xs">
                      Included
                    </Badge>
                  )}
                  <span className="text-sm font-medium">₹{service.base_price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {quotationData.selectedServices.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">Agent Registration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {quotationData.selectedServices.length} service{quotationData.selectedServices.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <span className="text-lg font-semibold text-blue-900">Total: ₹{totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              * Agent registration uses fixed pricing without regional or area multipliers.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Agent Registration Notice */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800">
              <strong>Simplified Process:</strong> Agent registrations follow a streamlined process with fixed pricing.
              No additional multipliers for region or plot area are applied.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
