import { ControllerDetail } from "@/components/dashboard/controller-detail";
import { getCurrentUser } from "@/lib/auth";
import { getControllerSnapshot } from "@/lib/data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ controllerId: string }>;
};

export default async function ControllerPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const { controllerId } = await params;
  let snapshot;
  try {
    snapshot = await getControllerSnapshot(user.id, controllerId);
  } catch (error) {
    if (error instanceof Error && error.message === "Controller not found.") {
      notFound();
    }
    throw error;
  }
  return <ControllerDetail initialSnapshot={snapshot} />;
}
