export interface DoctorData {
  id: string;
  name: string;
  imageUrl: string;
  phone: string;
  signatureUrl: string;
  role: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  password: string;
}

export interface BaseResponse {
  status: number;
  message: string;
}

export interface Slot {
  startTime: Date;
  endTime: Date;
}

export type UploadInput = {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
};

export type UploadResult = {
  key: string;
};

export type UserRole = "DOCTOR" | "PATIENT";

export type IssueTokenInput = {
  id: string;
  passwordHash: string;
  role: UserRole;
};
