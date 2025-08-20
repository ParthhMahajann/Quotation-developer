"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building, Users } from "lucide-react"

type DeveloperType = { id: number; name: string; }

type QuotationData = {
  id?: string
  developerTypeId?: number
  isAgentRegistration?: boolean
  projectRegion?: string
  projectLocation?: string
  plotArea?: number | null
  plotAreaRange?: string
}

interface Props {
  developerTypes?: DeveloperType[] // from server or omitted to use defaults
  initialData?: QuotationData
  updateQuotationData?: (updates: Partial<QuotationData>) => void
  onNext: (quotationId: string | null) => void
}

/* Static fallback lists (if you don't pass developerTypes from server) */
const DEFAULT_DEV_TYPES: DeveloperType[] = [
  { id: 1, name: "Category 1", },
  { id: 2, name: "Category 2", },
  { id: 3, name: "Category 3", },
  { id: 4, name: "Agent Registration",},
]

const STATIC_REGIONS = [
  "Mumbai Suburban",
  "Mumbai City",
  "Thane",
  "Palghar",
  "KDMC",
  "Navi Mumbai",
  "Raigad",
  "Pune 1",
  "Pune 2",
  "Pune 3",
  "Pune 4",
  "ROM",
]

const PLOT_RANGES = [
  "0-500",
  "500-1000",
  "1000-2000",
  "2000-4000",
  "4000-6500",
  "6500 and above",
]

function detectRange(num: number | null | undefined) {
  if (num == null || Number.isNaN(num)) return ""
  if (num <= 500) return "0-500"
  if (num <= 1000) return "500-1000"
  if (num <= 2000) return "1000-2000"
  if (num <= 4000) return "2000-4000"
  if (num <= 6500) return "4000-6500"
  return "6500 and above"
}

export default function Step1BasicConfig({ developerTypes, initialData, updateQuotationData, onNext }: Props) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const devTypes = developerTypes && developerTypes.length > 0 ? developerTypes : DEFAULT_DEV_TYPES

  const { register, handleSubmit, watch, setValue, formState } = useForm({
    mode: "onChange",
    defaultValues: {
      developerTypeId: initialData?.developerTypeId?.toString() ?? "",
      projectRegion: initialData?.projectRegion ?? "",
      projectLocation: initialData?.projectLocation ?? "",
      plotArea: initialData?.plotArea ?? "",
      plotAreaRange: initialData?.plotAreaRange ?? "",
    },
  })

  const devTypeIdStr = watch("developerTypeId")
  const projectRegion = watch("projectRegion")
  const projectLocation = watch("projectLocation")
  const plotAreaValue = watch("plotArea")
  const plotAreaRange = watch("plotAreaRange")

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const plotAreaNumber = useMemo(() => {
    if (plotAreaValue === "" || plotAreaValue == null) return null
    const n = Number(plotAreaValue)
    return Number.isNaN(n) ? null : n
  }, [plotAreaValue])

  const selectedType = devTypes.find((t) => String(t.id) === devTypeIdStr)
  const isAgent = selectedType?.name === "Agent Registration"

  /* Auto-select plot area range when numeric plot area provided */
  useEffect(() => {
    const detected = detectRange(plotAreaNumber)
    if (plotAreaNumber !== null && detected) {
      setValue("plotAreaRange", detected)
    }
  }, [plotAreaNumber, setValue])

  /* Validation rules:
     - developerTypeId required always
     - if agent selected => allow Next (special flow)
     - else require projectRegion, projectLocation, plotAreaRange
  */
  const isFormValid = useMemo(() => {
    if (!devTypeIdStr) return false
    if (isAgent) return true
    if (!projectRegion || projectRegion.trim() === "") return false
    if (!projectLocation || projectLocation.trim() === "") return false
    if (!plotAreaRange || plotAreaRange.trim() === "") return false
    return true
  }, [devTypeIdStr, isAgent, projectRegion, projectLocation, plotAreaRange])

  /* Submit handler: save draft to Supabase and call onNext with quotation id */
  const onSubmit = handleSubmit(async (vals) => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // check auth
      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      if (!user) {
        router.push("/auth/login")
        return
      }

      const developer_type_id = Number(vals.developerTypeId)
      const project_region_name = vals.projectRegion || null
      const project_location = vals.projectLocation || null
      const plot_area = vals.plotArea ? Number(vals.plotArea) : null
      const plot_area_range_name = vals.plotAreaRange || null
      const is_agent_registration = isAgent || false

      // Map or create region row (returns id or null)
      let region_id: number | null = null
      if (project_region_name) {
        const { data: regionRow, error: regionErr } = await supabase
          .from("regions")
          .select("id")
          .eq("name", project_region_name)
          .limit(1)
          .maybeSingle()

        if (regionErr) throw regionErr

        region_id = regionRow?.id ?? null

        // if not found, create it
        if (!region_id) {
          const { data: newRegion, error: createErr } = await supabase
            .from("regions")
            .insert({ name: project_region_name })
            .select("id")
            .single()
          if (createErr) throw createErr
          region_id = newRegion.id
        }
      }

      // Map or create plot area range row
      let plot_area_range_id: number | null = null
      if (plot_area_range_name) {
        const { data: rangeRow, error: rangeErr } = await supabase
          .from("plot_area_ranges")
          .select("id")
          .eq("range_name", plot_area_range_name)
          .limit(1)
          .maybeSingle()

        if (rangeErr) throw rangeErr
        plot_area_range_id = rangeRow?.id ?? null

        if (!plot_area_range_id) {
          const { data: newRange, error: createRangeErr } = await supabase
            .from("plot_area_ranges")
            .insert({ range_name: plot_area_range_name, min_area: 0, max_area: null })
            .select("id")
            .single()
          if (createRangeErr) throw createRangeErr
          plot_area_range_id = newRange.id
        }
      }

      const insertPayload: any = {
        user_id: user.id,
        developer_type_id,
        region_id,
        project_location: project_location,
        plot_area: plot_area,
        plot_area_range_id,
        project_region: project_region_name,
        plot_area_range: plot_area_range_name,
        is_agent_registration,
        status: "draft",
      }

      const { data: insertedRow, error: insertErr } = await supabase
        .from("quotations")
        .insert(insertPayload)
        .select()
        .single()

      if (insertErr) throw insertErr

      const quotationId = insertedRow?.id ?? null

      // Update parent state (if provided)
      updateQuotationData?.({
        id: quotationId ?? undefined,
        developerTypeId: developer_type_id,
        isAgentRegistration: is_agent_registration,
        projectRegion: project_region_name ?? undefined,
        projectLocation: project_location ?? undefined,
        plotArea: plot_area ?? undefined,
        plotAreaRange: plot_area_range_name ?? undefined,
      })

      onNext(quotationId)
    } catch (err: any) {
      console.error("Step1 save error:", err)
      setErrorMsg(err?.message ?? "Failed to save Step 1")
    } finally {
      setLoading(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Step 1: Basic Project Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select Developer Type and provide project basic info. Developer Type is required. Selecting <strong>Agent Registration</strong> locks other fields and follows the Agent flow.
        </p>
      </div>

      {/* Developer Type radio cards */}
      <div>
        <div className="mb-3">
          <Label>Developer Type (required)</Label>
        </div>

        <RadioGroup
          value={devTypeIdStr || ""}
          onValueChange={(val) => {
            setValue("developerTypeId", val)
            // clear other fields if agent selection
            const chosen = devTypes.find((d) => String(d.id) === val)
            const agentSelected = chosen?.name === "Agent Registration"
            if (agentSelected) {
              setValue("projectRegion", "")
              setValue("projectLocation", "")
              setValue("plotArea", "")
              setValue("plotAreaRange", "")
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {devTypes.map((type) => (
            <div key={type.id} className="relative">
              <RadioGroupItem value={String(type.id)} id={String(type.id)} className="peer sr-only" />
              <label
                htmlFor={String(type.id)}
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
                        {type.multiplier == null || type.multiplier === 1.0
                          ? "Base Rate"
                          : type.multiplier > 1.0
                          ? `+${((type.multiplier - 1) * 100).toFixed(0)}%`
                          : `-${((1 - (type.multiplier ?? 1)) * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm">{type.description}</CardDescription>
                  </CardContent>
                </Card>
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Agent message */}
      {devTypeIdStr && (
        <div className="mt-2 p-3 rounded border bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            {isAgent
              ? "Agent Registration selected — a simplified flow will be followed. Region, Location and Plot Area are locked."
              : "Standard quotation selected — complete the required fields to proceed."}
          </p>
        </div>
      )}

      {/* Project Region */}
      <div>
        <Label htmlFor="projectRegion">Project Region {isAgent ? "(locked for Agent)" : "(required)"}</Label>
        <select
          id="projectRegion"
          {...register("projectRegion")}
          disabled={isAgent}
          className="w-full border rounded p-2 mt-1"
        >
          <option value="">Select Region</option>
          {STATIC_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Project Location */}
      <div>
        <Label htmlFor="projectLocation">Project Location {isAgent ? "(locked for Agent)" : "(required)"}</Label>
        <Input
          id="projectLocation"
          type="text"
          {...register("projectLocation")}
          disabled={isAgent}
          placeholder="e.g. Mira Road, Andheri West..."
          className="mt-1"
        />
      </div>

      {/* Plot Area */}
      <div>
        <Label htmlFor="plotArea">Plot Area (sq ft) — optional</Label>
        <Input
          id="plotArea"
          type="number"
          {...register("plotArea")}
          disabled={isAgent}
          placeholder="Enter numeric value"
          className="mt-1"
        />
        {plotAreaNumber !== null && (
          <p className="text-sm text-blue-600 mt-1">Area lies between {detectRange(plotAreaNumber)}</p>
        )}
      </div>

      {/* Plot Area Range */}
      <div>
        <Label htmlFor="plotAreaRange">Plot Area Range {isAgent ? "(locked for Agent)" : "(required)"}</Label>
        <select
          id="plotAreaRange"
          {...register("plotAreaRange")}
          disabled={isAgent}
          className="w-full border rounded p-2 mt-1"
        >
          <option value="">Select Range</option>
          {PLOT_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div />
        <div>
          <Button type="submit" disabled={loading || !isFormValid} className="ml-2">
            {loading ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
    </form>
  )
}
