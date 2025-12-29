import { S3Client } from "@aws-sdk/client-s3";

const config = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
  },
  endpoint: process.env.S3_ENDPOINT as string,
  region: "auto",
};

export const s3client = new S3Client(config);
