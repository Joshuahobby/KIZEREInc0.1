import { config } from "./server/config";
console.log("CLOUDINARY_CLOUD_NAME:", config.CLOUDINARY_CLOUD_NAME ? "PRESENT" : "MISSING");
console.log("CLOUDINARY_API_KEY:", config.CLOUDINARY_API_KEY ? "PRESENT" : "MISSING");
console.log("CLOUDINARY_API_SECRET:", config.CLOUDINARY_API_SECRET ? "PRESENT" : "MISSING");
console.log("DATABASE_URL:", config.DATABASE_URL ? "PRESENT" : "MISSING");
