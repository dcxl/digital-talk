import type { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import {
  defaultGeneralSettings,
  generalSettingsKey,
  normalizeGeneralSettings,
  type GeneralSettings,
} from "./defaults";

function toInputJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function getGeneralSettings(userId = DEFAULT_USER_ID) {
  const prisma = getPrismaClient();
  await ensureDefaultUser();

  const setting = await prisma.appSetting.findUnique({
    where: {
      userId_key: {
        key: generalSettingsKey,
        userId,
      },
    },
  });

  return normalizeGeneralSettings(setting?.value ?? defaultGeneralSettings);
}

export async function saveGeneralSettings(
  input: GeneralSettings,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();
  const settings = normalizeGeneralSettings(input);

  const setting = await prisma.appSetting.upsert({
    create: {
      key: generalSettingsKey,
      userId: userId || user.id,
      value: toInputJson(settings),
    },
    update: {
      value: toInputJson(settings),
    },
    where: {
      userId_key: {
        key: generalSettingsKey,
        userId: userId || user.id,
      },
    },
  });

  return normalizeGeneralSettings(setting.value);
}
