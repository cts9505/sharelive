-- CreateEnum
CREATE TYPE "HostingPlatform" AS ENUM ('vercel', 'netlify', 'render', 'railway', 'flyio', 'heroku', 'azure', 'cloudflare', 'firebase', 'other');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "hosting_platform" "HostingPlatform",
ADD COLUMN     "platform_instructions" TEXT;
