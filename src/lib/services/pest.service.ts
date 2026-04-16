import { createId } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { channels, pestControlSchedules, telemetrySamples } from "@/lib/db/schema";
import type { PestControlSchedule, PestLogEntry, SnapshotPayload } from "@/lib/types";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getControllerOwnedByUser } from "./controller.service";

function nowIso() {
  return new Date().toISOString();
}

function hydrateSchedule(row: typeof pestControlSchedules.$inferSelect): PestControlSchedule {
  return {
    controllerId: row.controllerId,
    enabled: row.enabled,
    sprayEntries: (row.sprayEntries as Array<{ startTime: string; durationMinutes: number }>) ?? [],
    uvStartTime: row.uvStartTime ?? null,
    uvEndTime: row.uvEndTime ?? null,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

export function getPestSchedule(userId: string, controllerId: string): PestControlSchedule | null {
  getControllerOwnedByUser(userId, controllerId);
  const row = db.select().from(pestControlSchedules).where(eq(pestControlSchedules.controllerId, controllerId)).get();
  return row ? hydrateSchedule(row) : null;
}

export function upsertPestSchedule(
  userId: string,
  controllerId: string,
  input: {
    enabled: boolean;
    sprayEntries: Array<{ startTime: string; durationMinutes: number }>;
    uvStartTime?: string | null;
    uvEndTime?: string | null;
  }
): PestControlSchedule {
  getControllerOwnedByUser(userId, controllerId);

  const existing = db.select().from(pestControlSchedules).where(eq(pestControlSchedules.controllerId, controllerId)).get();
  const now = new Date();

  if (existing) {
    db.update(pestControlSchedules)
      .set({
        enabled: input.enabled,
        sprayEntries: input.sprayEntries,
        uvStartTime: input.uvStartTime ?? null,
        uvEndTime: input.uvEndTime ?? null,
        updatedAt: now,
      })
      .where(eq(pestControlSchedules.controllerId, controllerId))
      .run();
  } else {
    db.insert(pestControlSchedules)
      .values({
        id: createId("sched"),
        controllerId,
        enabled: input.enabled,
        sprayEntries: input.sprayEntries,
        uvStartTime: input.uvStartTime ?? null,
        uvEndTime: input.uvEndTime ?? null,
        updatedAt: now,
      })
      .run();
  }

  const saved = db.select().from(pestControlSchedules).where(eq(pestControlSchedules.controllerId, controllerId)).get()!;
  return hydrateSchedule(saved);
}

export function getPestControlLog(controllerId: string, limit = 20): PestLogEntry[] {
  const pestChannels = db
    .select()
    .from(channels)
    .where(
      and(
        eq(channels.controllerId, controllerId),
        inArray(channels.template, ["spray_pump", "uv_zapper"])
      )
    )
    .all();

  if (!pestChannels.length) return [];

  const channelIds = pestChannels.map((c) => c.id);
  const channelNameById = new Map(pestChannels.map((c) => [c.id, c.name]));

  const samples = db
    .select()
    .from(telemetrySamples)
    .where(inArray(telemetrySamples.channelId, channelIds))
    .orderBy(desc(telemetrySamples.recordedAt))
    .limit(limit)
    .all();

  return samples.map((sample) => {
    let activationType: "manual" | "scheduled" = "manual";
    try {
      const payload = JSON.parse(sample.payloadJson ?? "{}") as Record<string, unknown>;
      if (payload.source === "scheduled") activationType = "scheduled";
    } catch {
      // default to manual
    }

    return {
      channelId: sample.channelId,
      channelName: channelNameById.get(sample.channelId) ?? "Unknown",
      activationType,
      booleanState: sample.booleanState ?? false,
      recordedAt: sample.recordedAt instanceof Date ? sample.recordedAt.toISOString() : String(sample.recordedAt),
    };
  });
}

export function getLatestSnapshots(controllerId: string): Record<string, SnapshotPayload> {
  const cameraChannels = db
    .select()
    .from(channels)
    .where(and(eq(channels.controllerId, controllerId), eq(channels.template, "camera_snapshot")))
    .all();

  if (!cameraChannels.length) return {};

  const result: Record<string, SnapshotPayload> = {};

  for (const channel of cameraChannels) {
    const latest = db
      .select()
      .from(telemetrySamples)
      .where(eq(telemetrySamples.channelId, channel.id))
      .orderBy(desc(telemetrySamples.recordedAt))
      .limit(1)
      .get();

    if (!latest) continue;

    try {
      const payload = JSON.parse(latest.payloadJson ?? "{}") as Record<string, unknown>;
      if (payload.imageUrl || payload.imageBase64) {
        result[channel.id] = {
          imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : null,
          imageBase64: typeof payload.imageBase64 === "string" ? payload.imageBase64 : null,
        };
      }
    } catch {
      // skip malformed payload
    }
  }

  return result;
}
