// RERA Quotation System - Dynamic Pricing Engine
// Handles complex multi-variable pricing calculations

export interface PricingFactors {
  developerTypeMultiplier: number
  regionalMultiplier: number
  plotAreaMultiplier: number
  serviceComplexityFactor: number
}

export interface ServicePricing {
  serviceId: number
  serviceName: string
  basePrice: number
  calculatedPrice: number
  finalPrice: number
  discountAmount: number
  discountPercentage: number
  discountReason: string
  pricingFactors: PricingFactors
}

export interface QuotationPricing {
  services: ServicePricing[]
  subtotal: number
  totalDiscountAmount: number
  totalDiscountPercentage: number
  finalTotal: number
  roundedTotal: number
  approvalLevel: "auto_approved" | "manager" | "senior_manager" | "director"
  needsApproval: boolean
}

export class PricingEngine {
  private developerTypes: any[]
  private regions: any[]
  private plotAreaRanges: any[]
  private serviceCategories: any[]
  private services: any[]

  constructor(developerTypes: any[], regions: any[], plotAreaRanges: any[], serviceCategories: any[], services: any[]) {
    this.developerTypes = developerTypes
    this.regions = regions
    this.plotAreaRanges = plotAreaRanges
    this.serviceCategories = serviceCategories
    this.services = services
  }

  /**
   * Calculate comprehensive pricing for a quotation
   */
  calculateQuotationPricing(
    developerTypeId: number,
    regionId: number | null,
    plotAreaRangeId: number | null,
    selectedServiceIds: number[],
    existingServicePricing: { [serviceId: number]: { modifiedPrice: number; discountReason: string } } = {},
  ): QuotationPricing {
    // Get multipliers
    const developerType = this.developerTypes.find((dt) => dt.id === developerTypeId)
    const region = regionId ? this.regions.find((r) => r.id === regionId) : null
    const plotAreaRange = plotAreaRangeId ? this.plotAreaRanges.find((par) => par.id === plotAreaRangeId) : null

    const developerTypeMultiplier = developerType?.multiplier || 1.0
    const regionalMultiplier = region?.multiplier || 1.0
    const plotAreaMultiplier = plotAreaRange?.multiplier || 1.0

    // Calculate service pricing
    const servicePricings: ServicePricing[] = []
    let subtotal = 0

    for (const serviceId of selectedServiceIds) {
      const service = this.services.find((s) => s.id === serviceId)
      if (!service) continue

      const serviceCategory = this.serviceCategories.find((sc) => sc.id === service.category_id)
      const serviceComplexityFactor = serviceCategory?.complexity_factor || 1.0

      const pricingFactors: PricingFactors = {
        developerTypeMultiplier,
        regionalMultiplier,
        plotAreaMultiplier,
        serviceComplexityFactor,
      }

      // Calculate base price with all multipliers
      const basePrice = service.base_price
      const calculatedPrice = this.calculateServicePrice(basePrice, pricingFactors)

      // Check for existing custom pricing
      const existingPricing = existingServicePricing[serviceId]
      const finalPrice = existingPricing?.modifiedPrice || calculatedPrice
      const discountAmount = calculatedPrice - finalPrice
      const discountPercentage = calculatedPrice > 0 ? (discountAmount / calculatedPrice) * 100 : 0

      const servicePricing: ServicePricing = {
        serviceId,
        serviceName: service.name,
        basePrice,
        calculatedPrice,
        finalPrice,
        discountAmount,
        discountPercentage,
        discountReason: existingPricing?.discountReason || "",
        pricingFactors,
      }

      servicePricings.push(servicePricing)
      subtotal += finalPrice
    }

    // Calculate total discount
    const totalOriginalAmount = servicePricings.reduce((sum, sp) => sum + sp.calculatedPrice, 0)
    const totalDiscountAmount = totalOriginalAmount - subtotal
    const totalDiscountPercentage = totalOriginalAmount > 0 ? (totalDiscountAmount / totalOriginalAmount) * 100 : 0

    // Apply rounding
    const roundedTotal = this.applyRounding(subtotal)

    // Determine approval level
    const approvalLevel = this.getApprovalLevel(totalDiscountPercentage)
    const needsApproval = approvalLevel !== "auto_approved"

    return {
      services: servicePricings,
      subtotal,
      totalDiscountAmount,
      totalDiscountPercentage,
      finalTotal: subtotal,
      roundedTotal,
      approvalLevel,
      needsApproval,
    }
  }

  /**
   * Calculate individual service price with all multipliers
   */
  private calculateServicePrice(basePrice: number, factors: PricingFactors): number {
    return Math.round(
      basePrice *
        factors.developerTypeMultiplier *
        factors.regionalMultiplier *
        factors.plotAreaMultiplier *
        factors.serviceComplexityFactor,
    )
  }

  /**
   * Apply intelligent rounding based on amount thresholds
   */
  private applyRounding(amount: number): number {
    if (amount >= 200000) {
      // Round to nearest ₹1,000 for amounts ≥ ₹2,00,000
      return Math.round(amount / 1000) * 1000
    } else if (amount >= 50000) {
      // Round to nearest ₹100 for amounts ≥ ₹50,000
      return Math.round(amount / 100) * 100
    } else {
      // Round to nearest ₹10 for smaller amounts
      return Math.round(amount / 10) * 10
    }
  }

  /**
   * Determine approval level based on discount percentage
   */
  private getApprovalLevel(discountPercentage: number): "auto_approved" | "manager" | "senior_manager" | "director" {
    if (discountPercentage >= 30) return "director"
    if (discountPercentage >= 20) return "senior_manager"
    if (discountPercentage >= 10) return "manager"
    return "auto_approved"
  }

  /**
   * Update service pricing with custom price
   */
  updateServicePrice(
    quotationPricing: QuotationPricing,
    serviceId: number,
    newPrice: number,
    discountReason = "",
  ): QuotationPricing {
    const updatedServices = quotationPricing.services.map((service) => {
      if (service.serviceId === serviceId) {
        const discountAmount = service.calculatedPrice - newPrice
        const discountPercentage = service.calculatedPrice > 0 ? (discountAmount / service.calculatedPrice) * 100 : 0

        return {
          ...service,
          finalPrice: newPrice,
          discountAmount,
          discountPercentage,
          discountReason,
        }
      }
      return service
    })

    // Recalculate totals
    const subtotal = updatedServices.reduce((sum, service) => sum + service.finalPrice, 0)
    const totalOriginalAmount = updatedServices.reduce((sum, service) => sum + service.calculatedPrice, 0)
    const totalDiscountAmount = totalOriginalAmount - subtotal
    const totalDiscountPercentage = totalOriginalAmount > 0 ? (totalDiscountAmount / totalOriginalAmount) * 100 : 0

    const roundedTotal = this.applyRounding(subtotal)
    const approvalLevel = this.getApprovalLevel(totalDiscountPercentage)
    const needsApproval = approvalLevel !== "auto_approved"

    return {
      ...quotationPricing,
      services: updatedServices,
      subtotal,
      totalDiscountAmount,
      totalDiscountPercentage,
      finalTotal: subtotal,
      roundedTotal,
      approvalLevel,
      needsApproval,
    }
  }

  /**
   * Get pricing breakdown for display
   */
  getPricingBreakdown(servicePricing: ServicePricing) {
    return {
      basePrice: servicePricing.basePrice,
      developerTypeAdjustment: servicePricing.basePrice * (servicePricing.pricingFactors.developerTypeMultiplier - 1),
      regionalAdjustment:
        servicePricing.basePrice *
        servicePricing.pricingFactors.developerTypeMultiplier *
        (servicePricing.pricingFactors.regionalMultiplier - 1),
      plotAreaAdjustment:
        servicePricing.basePrice *
        servicePricing.pricingFactors.developerTypeMultiplier *
        servicePricing.pricingFactors.regionalMultiplier *
        (servicePricing.pricingFactors.plotAreaMultiplier - 1),
      complexityAdjustment:
        servicePricing.basePrice *
        servicePricing.pricingFactors.developerTypeMultiplier *
        servicePricing.pricingFactors.regionalMultiplier *
        servicePricing.pricingFactors.plotAreaMultiplier *
        (servicePricing.pricingFactors.serviceComplexityFactor - 1),
      calculatedPrice: servicePricing.calculatedPrice,
      discount: servicePricing.discountAmount,
      finalPrice: servicePricing.finalPrice,
    }
  }

  /**
   * Validate pricing constraints
   */
  validatePricing(quotationPricing: QuotationPricing): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for negative prices
    quotationPricing.services.forEach((service) => {
      if (service.finalPrice < 0) {
        errors.push(`Service "${service.serviceName}" cannot have negative price`)
      }
    })

    // Check for excessive discounts
    quotationPricing.services.forEach((service) => {
      if (service.discountPercentage > 50) {
        errors.push(
          `Service "${service.serviceName}" has excessive discount (${service.discountPercentage.toFixed(1)}%)`,
        )
      }
    })

    // Check minimum quotation value
    if (quotationPricing.finalTotal < 1000) {
      errors.push("Quotation total is below minimum threshold of ₹1,000")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Utility functions for pricing display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercentage = (percentage: number): string => {
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(1)}%`
}

export const getApprovalLevelColor = (level: string): string => {
  switch (level) {
    case "auto_approved":
      return "bg-green-100 text-green-800"
    case "manager":
      return "bg-yellow-100 text-yellow-800"
    case "senior_manager":
      return "bg-orange-100 text-orange-800"
    case "director":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getApprovalLevelLabel = (level: string): string => {
  switch (level) {
    case "auto_approved":
      return "Auto Approved"
    case "manager":
      return "Manager Approval Required"
    case "senior_manager":
      return "Senior Manager Approval Required"
    case "director":
      return "Director Approval Required"
    default:
      return "Unknown"
  }
}
