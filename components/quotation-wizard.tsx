"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Step1DeveloperType from "@/components/quotation-steps/step1-developer-type"
import Step2ProjectConfig from "@/components/quotation-steps/step2-project-config"
import Step3ServiceSelection from "@/components/quotation-steps/step3-service-selection"
import Step4ReviewPricing from "@/components/quotation-steps/step4-review-pricing"
import Step5Generate from "@/components/quotation-steps/step5-generate"
import AgentStep1Info from "@/components/quotation-steps/agent-step1-info"
import AgentStep2Services from "@/components/quotation-steps/agent-step2-services"
import AgentStep3Generate from "@/components/quotation-steps/agent-step3-generate"

interface QuotationWizardProps {
  user: any
  developerTypes: any[]
  regions: any[]
  plotAreaRanges: any[]
  serviceCategories: any[]
  services: any[]
}

export interface QuotationData {
  // Step 1
  developerTypeId: number | null
  isAgentRegistration: boolean

  // Step 2 (Standard) / Agent Step 1
  regionId: number | null
  plotArea: number | null
  plotAreaRangeId: number | null
  developerName: string
  projectName: string
  projectLocation: string
  reraNumber: string
  validityDays: number
  paymentSchedule: string

  // Agent specific
  agentType: string
  mobileNumber: string
  email: string

  // Step 3 (Standard) / Agent Step 2
  selectedServices: number[]

  // Step 4 (Standard)
  servicePricing: { [serviceId: number]: { originalPrice: number; modifiedPrice: number; discountReason: string } }
  totalDiscount: number
  finalTotal: number
}

export default function QuotationWizard({
  user,
  developerTypes,
  regions,
  plotAreaRanges,
  serviceCategories,
  services,
}: QuotationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [quotationData, setQuotationData] = useState<QuotationData>({
    developerTypeId: null,
    isAgentRegistration: false,
    regionId: null,
    plotArea: null,
    plotAreaRangeId: null,
    developerName: "",
    projectName: "",
    projectLocation: "",
    reraNumber: "",
    validityDays: 30,
    paymentSchedule: "50%",
    agentType: "",
    mobileNumber: "",
    email: "",
    selectedServices: [],
    servicePricing: {},
    totalDiscount: 0,
    finalTotal: 0,
  })

  const isAgentFlow = quotationData.isAgentRegistration
  const maxSteps = isAgentFlow ? 3 : 5
  const progress = (currentStep / maxSteps) * 100

  const updateQuotationData = (updates: Partial<QuotationData>) => {
    setQuotationData((prev) => ({ ...prev, ...updates }))
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return quotationData.developerTypeId !== null
      case 2:
        if (isAgentFlow) {
          return (
            quotationData.developerName && quotationData.mobileNumber && quotationData.email && quotationData.agentType
          )
        }
        return quotationData.regionId !== null && quotationData.plotArea !== null && quotationData.developerName
      case 3:
        return quotationData.selectedServices.length > 0
      case 4:
        return !isAgentFlow // Only for standard flow
      default:
        return true
    }
  }

  const handleNext = () => {
    if (canProceedToNext() && currentStep < maxSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepTitle = () => {
    if (isAgentFlow) {
      switch (currentStep) {
        case 1:
          return "Developer Type"
        case 2:
          return "Agent Information"
        case 3:
          return "Service Selection"
        default:
          return "Generate Quotation"
      }
    } else {
      switch (currentStep) {
        case 1:
          return "Developer Type"
        case 2:
          return "Project Configuration"
        case 3:
          return "Service Selection"
        case 4:
          return "Review & Pricing"
        case 5:
          return "Generate Quotation"
        default:
          return "Quotation"
      }
    }
  }

  const renderCurrentStep = () => {
    if (isAgentFlow) {
      switch (currentStep) {
        case 1:
          return (
            <Step1DeveloperType
              developerTypes={developerTypes}
              quotationData={quotationData}
              updateQuotationData={updateQuotationData}
            />
          )
        case 2:
          return <AgentStep1Info quotationData={quotationData} updateQuotationData={updateQuotationData} />
        case 3:
          return (
            <AgentStep2Services
              services={services.filter((s) => s.service_categories?.name === "Registration Services")}
              quotationData={quotationData}
              updateQuotationData={updateQuotationData}
            />
          )
        default:
          return <AgentStep3Generate quotationData={quotationData} user={user} />
      }
    } else {
      switch (currentStep) {
        case 1:
          return (
            <Step1DeveloperType
              developerTypes={developerTypes}
              quotationData={quotationData}
              updateQuotationData={updateQuotationData}
            />
          )
        case 2:
          return (
            <Step2ProjectConfig
              regions={regions}
              plotAreaRanges={plotAreaRanges}
              quotationData={quotationData}
              updateQuotationData={updateQuotationData}
            />
          )
        case 3:
          return (
            <Step3ServiceSelection
              serviceCategories={serviceCategories}
              services={services}
              quotationData={quotationData}
              updateQuotationData={updateQuotationData}
            />
          )
        case 4:
          return (
            <Step4ReviewPricing
              services={services}
              quotationData={quotationData}
              updateQuotationData={updateQuotationData}
              developerTypes={developerTypes}
              regions={regions}
              plotAreaRanges={plotAreaRanges}
              serviceCategories={serviceCategories}
            />
          )
        case 5:
          return <Step5Generate quotationData={quotationData} user={user} />
        default:
          return null
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Building2 className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-semibold text-gray-900">
                New {isAgentFlow ? "Agent Registration" : "Quotation"}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {maxSteps}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-900">{getStepTitle()}</h2>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep}: {getStepTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderCurrentStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < maxSteps ? (
            <Button onClick={handleNext} disabled={!canProceedToNext()} className="bg-blue-600 hover:bg-blue-700">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </main>
    </div>
  )
}
