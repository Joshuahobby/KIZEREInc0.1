import { uploadImage } from "./server/services/cloudinary.service";

async function test() {
    console.log("Testing Cloudinary service initialization...");
    try {
        // Small transparent pixel in base64
        const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        const result = await uploadImage(testImage, "kizere/test");
        console.log("Verification upload successful:", result.url);
    } catch (err) {
        console.error("Verification upload failed:", err);
        process.exit(1);
    }
}

test();
