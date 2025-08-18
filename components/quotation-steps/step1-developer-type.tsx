"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building, Users } from "lucide-react"
import type { QuotationData } from "@/components/quotation-wizard"

interface Step1DeveloperTypeProps {
  developerTypes: any[]
  quotationData: QuotationData
  updateQuotationData: (updates: Partial<QuotationData>) => void
}

export default function Step1DeveloperType({
  developerTypes,
  quotationData,
  updateQuotationData,
}: Step1DeveloperTypeProps) {
  const handleDeveloperTypeChange = (value: string) => {
    const selectedType = developerTypes.find((type) => type.id.toString() === value)
    const isAgent = selectedType?.name === "Agent Registration"

    updateQuotationData({
      developerTypeId: Number.parseInt(value),
      isAgentRegistration: isAgent,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select Developer Type</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose the appropriate developer category. This will determine the pricing structure and available services.
        </p>
      </div>

      <RadioGroup
        value={quotationData.developerTypeId?.toString() || ""}
        onValueChange={handleDeveloperTypeChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {developerTypes.map((type) => (
          <div key={type.id} className="relative">
            <RadioGroupItem value={type.id.toString()} id={type.id.toString()} className="peer sr-only" />
            <Label
              htmlFor={type.id.toString()}
              className="flex cursor-pointer rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all"
            >
              <Card className="w-full border-0 shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-base">
                      {type.name === "Agent Registration" ? (
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                      ) : (
                        <Building className="h-5 w-5 mr-2 text-blue-600" />
                      )}
                      {type.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {type.multiplier === 1.0
                        ? "Base Rate"
                        : type.multiplier > 1.0
                          ? `+${((type.multiplier - 1) * 100).toFixed(0)}%`
                          : `-${((1 - type.multiplier) * 100).toFixed(0)}%`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm">{type.description}</CardDescription>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {quotationData.developerTypeId && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                {quotationData.isAgentRegistration
                  ? "Agent Registration selected - You'll follow a simplified 3-step process."
                  : "Standard quotation selected - You'll complete a comprehensive 5-step process."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
