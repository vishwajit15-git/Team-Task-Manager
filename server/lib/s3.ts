import { S3Client } from '@aws-sdk/client-s3';

//initialize the AWS S3 Client
export const s3 = new S3Client({
    region: process.env.SUPABASE_REGION!,
    endpoint: process.env.SUPABASE_S3_ENDPOINT, // Required for Supabase
    credentials: {
        accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY!,
    },
});