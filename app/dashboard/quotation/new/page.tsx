import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import QuotationWizard from "@/components/quotation-wizard"

export default async function NewQuotationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch lookup data for the form
  const [
    { data: developerTypes },
    { data: regions },
    { data: plotAreaRanges },
    { data: serviceCategories },
    { data: services },
  ] = await Promise.all([
    supabase.from("developer_types").select("*").order("name"),
    supabase.from("regions").select("*").order("name"),
    supabase.from("plot_area_ranges").select("*").order("min_area"),
    supabase.from("service_categories").select("*").eq("is_active", true).order("name"),
    supabase.from("services").select("*, service_categories(name)").eq("is_active", true).order("name"),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <QuotationWizard
        user={user}
        developerTypes={developerTypes || []}
        regions={regions || []}
        plotAreaRanges={plotAreaRanges || []}
        serviceCategories={serviceCategories || []}
        services={services || []}
      />
    </div>
  )
}
