import { ApiError, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { getPestSchedule, upsertPestSchedule } from "@/lib/data";
import { publishCommands } from "@/lib/mqtt/client";
import { pestScheduleSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    return jsonOk({ schedule: getPestSchedule(user.id, id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const body = pestScheduleSchema.parse(await request.json());
    const schedule = upsertPestSchedule(user.id, id, {
      enabled: body.enabled,
      sprayEntries: body.sprayEntries,
      uvStartTime: body.uvStartTime ?? null,
      uvEndTime: body.uvEndTime ?? null,
    });

    // Push updated schedule to device immediately via MQTT (no-op until task 9)
    publishCommands(id, { pestControlSchedule: schedule });

    return jsonOk({ schedule });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(new ApiError("Invalid JSON payload.", 400));
    }
    return jsonError(error);
  }
}
