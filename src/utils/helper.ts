import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3client } from "../config/storage";
import { Slot, UploadInput, UploadResult } from "./types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function generateSlots(availability: Slot, interval: number) {
  const slots = [];
  let { startTime, endTime } = availability;
  let cursor = new Date(startTime);

  while (cursor < endTime) {
    const next = new Date(cursor.getTime() + interval * 60 * 1000);

    if (next > endTime) {
      break;
    }

    slots.push({
      startTime: new Date(cursor),
      endTime: next,
    });

    cursor = next;
  }

  return slots;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export const getFormattedSpeechData = (speechData: {
  medicine: string[];
  diagnosis: string;
  advice: string;
}): String => {
  const medicine = speechData.medicine.join("\n");

  let formattedSpeechData = `Diagnosing for, ${speechData.diagnosis}.`;
  formattedSpeechData += ` Medicines prescribed, ${medicine}. `;
  formattedSpeechData += speechData.advice.length
    ? `Advice, ${speechData.advice}`
    : "";
  return formattedSpeechData;
};

export const timeToDate = (time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(1970, 0, 1));
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
};

export function timeParts(d: Date) {
  return {
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

export const isSlotWithinAvailability = (
  slotStart: Date,
  slotEnd: Date,
  availabilityStart: Date,
  availabilityEnd: Date
): boolean => {
  let slotStartMin = minutesSinceMidnight(slotStart);
  let slotEndMin = minutesSinceMidnight(slotEnd);
  let availabilityStartMin = minutesSinceMidnight(availabilityStart);
  let availabilityEndMin = minutesSinceMidnight(availabilityEnd);

  return (
    slotStartMin >= availabilityStartMin && slotEndMin <= availabilityEndMin
  );
};

const minutesSinceMidnight = (d: Date) => {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  const { bucket, key, body, contentType } = input;

  await s3client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key };
}

export const getPreSignedUrl = async (key: string) => {
  if (!key) {
    return null;
  }
  const params = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const url = await getSignedUrl(s3client, command, { expiresIn: 3600 });
  return url;
};
