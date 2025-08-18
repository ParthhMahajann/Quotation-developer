"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Send, CheckCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import type { QuotationData } from "@/components/quotation-wizard"

interface Step5GenerateProps {
  quotationData: QuotationData
  user: any
}

export default function Step5Generate({ quotationData, user }: Step5GenerateProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)

    // Simulate quotation generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsGenerating(false)
    setIsGenerated(true)
  }

  const handleDownload = () => {
    // PDF download logic would go here
    console.log("Downloading PDF...")
  }

  const handleSendEmail = () => {
    // Email sending logic would go here
    console.log("Sending email...")
  }

  const needsApproval = quotationData.totalDiscount >= 10

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Quotation</h3>
        <p className="text-sm text-gray-600 mb-6">Review your quotation summary and generate the final document.</p>
      </div>

      {/* Quotation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Quotation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Developer:</span> {quotationData.developerName}
                </div>
                {quotationData.projectName && (
                  <div>
                    <span className="text-gray-500">Project:</span> {quotationData.projectName}
                  </div>
                )}
                {quotationData.projectLocation && (
                  <div>
                    <span className="text-gray-500">Location:</span> {quotationData.projectLocation}
                  </div>
                )}
                {quotationData.plotArea && (
                  <div>
                    <span className="text-gray-500">Plot Area:</span> {quotationData.plotArea} sq ft
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Quotation Details</h4>
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
                {quotationData.totalDiscount > 0 && (
                  <div>
                    <span className="text-gray-500">Discount:</span> {quotationData.totalDiscount.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-blue-600">₹{quotationData.finalTotal.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Approval Status */}
      {needsApproval && !isGenerated && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Clock className="h-5 w-5 mr-2" />
              Approval Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              This quotation requires managerial approval due to the discount level. It will be submitted for approval
              when generated.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Document</CardTitle>
          <CardDescription>Create your quotation document and choose delivery options</CardDescription>
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
                    Generating Quotation...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Quotation
                  </>
                )}
              </Button>

              {needsApproval && (
                <p className="text-xs text-gray-500 text-center">
                  Quotation will be submitted for approval after generation
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  {needsApproval ? "Quotation submitted for approval" : "Quotation generated successfully"}
                </span>
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
