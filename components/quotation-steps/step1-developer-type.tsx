"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Step1() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // form states
  const [developerTypeId, setDeveloperTypeId] = useState<number | null>(null);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [projectLocation, setProjectLocation] = useState("");
  const [plotArea, setPlotArea] = useState("");
  const [plotAreaRangeId, setPlotAreaRangeId] = useState<number | null>(null);
  const [isAgentRegistration, setIsAgentRegistration] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        router.push("/login");
      } else {
        setUser(data?.user || null);
      }
      setLoading(false);
    };
    getUser();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  const handleNext = async () => {
    try {
      // prepare clean insert payload
      const insertPayload: any = {
        user_id: user.id,
        developer_type_id: developerTypeId,
        region_id: regionId,
        project_location: projectLocation,
        plot_area: plotArea,
        plot_area_range_id: plotAreaRangeId,
        is_agent_registration: isAgentRegistration,
        status: "draft", // make sure quotations table has this column
      };

      // upsert instead of plain insert (avoids duplicate drafts)
      const { data: savedQuotation, error: saveErr } = await supabase
        .from("quotations")
        .upsert(insertPayload, { onConflict: "user_id" }) // ensures one draft per user
        .select()
        .single();

      if (saveErr) throw saveErr;

      const quotationId = savedQuotation.id;
      console.log("Quotation saved:", quotationId);

      // move to step 2 with quotationId
      router.push(`/step2?quotationId=${quotationId}`);
    } catch (err) {
      console.error("Error saving quotation:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg shadow-lg">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-2xl font-bold">Step 1: Project Information</h2>

          <div>
            <label className="block font-medium">Developer Type ID</label>
            <input
              type="number"
              value={developerTypeId || ""}
              onChange={(e) => setDeveloperTypeId(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Region ID</label>
            <input
              type="number"
              value={regionId || ""}
              onChange={(e) => setRegionId(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Project Location</label>
            <input
              type="text"
              value={projectLocation}
              onChange={(e) => setProjectLocation(e.target.value)}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Plot Area</label>
            <input
              type="text"
              value={plotArea}
              onChange={(e) => setPlotArea(e.target.value)}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Plot Area Range ID</label>
            <input
              type="number"
              value={plotAreaRangeId || ""}
              onChange={(e) => setPlotAreaRangeId(Number(e.target.value))}
              className="border p-2 w-full rounded"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAgentRegistration}
              onChange={(e) => setIsAgentRegistration(e.target.checked)}
            />
            <span>Is Agent Registration?</span>
          </div>

          <Button onClick={handleNext} className="w-full">
            Next
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
