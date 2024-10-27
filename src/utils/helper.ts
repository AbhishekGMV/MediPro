export function generateSlots(
  availability: any[],
  interval: number,
  doctorId: string,
  availabilityId: number
) {
  const slots = [];
  for (let { startTime, endTime } of availability) {
    startTime = new Date(startTime);
    endTime = new Date(endTime);
    let currentStartTime = new Date(startTime);
    let currentEndTime = new Date(currentStartTime);
    currentEndTime.setMinutes(currentEndTime.getMinutes() + interval);

    while (currentEndTime <= endTime) {
      slots.push({
        startTime: new Date(currentStartTime),
        endTime: new Date(currentEndTime),
        doctorId,
        availabilityId,
        isBooked: false,
      });

      currentStartTime.setMinutes(currentStartTime.getMinutes() + interval);
      currentEndTime.setMinutes(currentEndTime.getMinutes() + interval);
    }
  }

  return slots;
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
