"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Send, CheckCircle, User } from "lucide-react"
import { useRouter } from "next/navigation"
import type { QuotationData } from "@/components/quotation-wizard"

interface AgentStep3GenerateProps {
  quotationData: QuotationData
  user: any
}

export default function AgentStep3Generate({ quotationData, user }: AgentStep3GenerateProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)

    // Simulate agent registration generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsGenerating(false)
    setIsGenerated(true)
  }

  const handleDownload = () => {
    console.log("Downloading agent registration PDF...")
  }

  const handleSendEmail = () => {
    console.log("Sending agent registration email...")
  }

  const totalAmount = quotationData.selectedServices.reduce((total, serviceId) => {
    // This would normally fetch service prices, using placeholder for now
    return total + 50000 // Placeholder amount
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Agent Registration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review your agent registration details and generate the final document.
        </p>
      </div>

      {/* Agent Registration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Agent Registration Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Agent Details</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span> {quotationData.developerName}
                </div>
                <div>
                  <span className="text-gray-500">Mobile:</span> {quotationData.mobileNumber}
                </div>
                <div>
                  <span className="text-gray-500">Email:</span> {quotationData.email}
                </div>
                <div>
                  <span className="text-gray-500">Type:</span> {quotationData.agentType.replace("_", " ").toUpperCase()}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Registration Details</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Validity:</span> {quotationData.validityDays} days
                </div>
                <div>
                  <span className="text-gray-500">Payment:</span> {quotationData.paymentSchedule}
                </div>
                <div>
                  <span className="text-gray-500">Services:</span> {quotationData.selectedServices.length}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Registration Fee</span>
            <span className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Generation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Registration Document</CardTitle>
          <CardDescription>Create your agent registration document</CardDescription>
        </CardHeader>
        <CardContent>
          {!isGenerated ? (
            <div className="space-y-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Registration...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Agent Registration
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Agent registration generated successfully</span>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleSendEmail} variant="outline" className="flex-1 bg-transparent">
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>

              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
