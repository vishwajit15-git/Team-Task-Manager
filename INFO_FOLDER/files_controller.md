# Detailed Breakdown: `server/controllers/files.ts`

## 1. Overview & Importance
This controller acts as the bridge between our local server RAM (where Multer temporarily holds the file) and AWS S3 (where the file will permanently live). 

**What problem it solves:**
We cannot save files directly to our database because it would bloat PostgreSQL and crash the server. Instead, we upload the file to AWS S3, get a public URL back, and only save that lightweight URL string to our database.

**Pro Upgrades Implemented:**
1.  **Frontend-Friendly Error Handling:** We explicitly avoid backend jargon in our error messages (e.g., using "Please select a project to upload this file to." instead of "projectId query missing"). This ensures that if the error reaches the user interface, it makes perfect sense to a non-technical user.
2.  **Cryptographic Filenames:** If two users upload an image called `screenshot.png` at the exact same time, AWS might overwrite one. We use the built-in Node `crypto` library to generate a completely random 16-byte hex string for every upload.
3.  **Project Folder Structure:** We structure the AWS S3 Key (the filename) as `${projectId}/${randomName}.${extension}`. This automatically creates a virtual folder inside the S3 bucket for every project, making manual cleanup and bucket management incredibly easy.

---

## 2. Line-by-Line Breakdown

### Validate the Request
```typescript
if (!req.file) {
    throw new AppError('No file was selected for upload.', 400);
}

const { projectId } = req.body; 

if (!projectId) {
    throw new AppError('Please select a project to upload this file to.', 400);
}
```
*   **Why we used it:** First, we ensure Multer actually intercepted a file. Then, we check for the `projectId`. Note that because this is a `multipart/form-data` request, text fields are parsed into `req.body`, *not* `req.query` or `req.params`.

### Security Check (Data Isolation)
```typescript
const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { id: true } } }
});

if (!project) throw new AppError('The selected project could not be found.', 404);

const isMember = project.members.some(m => m.id === req.user.id);
if (!isMember) throw new AppError('You do not have permission to upload files to this project.', 403);
```
*   **Why we used it:** Standard tenant isolation. We prevent malicious users from uploading files into projects they don't belong to.

### Prepare for AWS S3
```typescript
const randomName = crypto.randomBytes(16).toString('hex');
const extension = req.file.originalname.split('.').pop();
const uniqueFileName = `${projectId}/${randomName}.${extension}`;
```
*   **Why we used it:** `crypto.randomBytes(16)` generates a secure random string (e.g., `4f9b2...`). We split the original filename by the `.` and pop off the last item to grab the file extension (`jpg`, `pdf`, etc).

### Upload to S3
```typescript
const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: uniqueFileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
});

await s3.send(command);
```
*   **Why we used it:** We construct a `PutObjectCommand` and send it via the `s3` client. `req.file.buffer` is the raw binary data of the file sitting in our server's RAM. `ContentType` is crucial—without it, when a user clicks the URL, the browser will force them to download the file instead of displaying it in the browser!

### Save to Database
```typescript
const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

const newFile = await prisma.file.create({
    data: {
        name: req.file.originalname,
        url: fileUrl,
        mimeType: req.file.mimetype,
        size: req.file.size,
        projectId,
        uploaderId: req.user.id
    }
});
```
*   **Why we used it:** We manually construct the public URL based on standard AWS S3 formatting rules. Then we save the original human-readable name, the URL, and file metadata into our PostgreSQL database so the frontend can display a clean list of files.
