import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const upload = async (file, key, fileType) => {
    try {
        const { env } = process;
        const client = new S3Client({ region: env.AWS_REGION, credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        } });
        const command = new PutObjectCommand({
            ACL: 'public-read',
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: fileType,
        });
        
        const response = await client.send(command);
        if (response.$metadata.httpStatusCode === 200) {
            return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
        }
        return null;
    } catch (error) {
        console.log("error while uploading to s3", error.message);  
        return null;
    }
}

export default upload;