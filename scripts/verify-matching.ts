
import { db } from "../server/db";
import { users, items, reports } from "@shared/schema";
import { ReportMatchingService } from "../server/services/report-matching.service";
import { storage } from "../server/storage";

async function verifyMatchingLogic() {
    console.log("=== Starting Smart Matching Verification ===");
    const testSuffix = Date.now();

    try {
        // 1. Create Test Users
        console.log("\n[1] Creating Test Users...");
        const user1 = await storage.createUser({
            username: `matcher_1_${testSuffix}`,
            email: `matcher1_${testSuffix}@example.com`,
            password: "password123",
            role: "User",
            fullName: "Matcher One"
        });
        const user2 = await storage.createUser({
            username: `matcher_2_${testSuffix}`,
            email: `matcher2_${testSuffix}@example.com`,
            password: "password123",
            role: "User",
            fullName: "Matcher Two"
        });
        console.log(`Created users: ${user1.username}, ${user2.username}`);

        // 2. Test EXACT MATCH (Serial Number)
        console.log("\n[2] Testing EXACT MATCH (Serial Number)...");
        const serialNumber = `SN-${testSuffix}`;

        // User 1 reports LOST item with Serial
        const lostReportExact = await storage.createReport({
            userId: user1.id,
            type: "lost",
            title: "Lost iPhone 15 Pro",
            description: "Lost my darker blue iPhone.",
            category: "Electronics",
            location: "Kigali Heights",
            date: new Date(),
            status: "Open",
            uniqueIdentifier: serialNumber,
            reportedAt: new Date()
        });

        // User 2 reports FOUND item with SAME Serial
        const foundReportExact = await storage.createReport({
            userId: user2.id,
            type: "found",
            title: "Found iPhone 15",
            description: "Found an iPhone in the parking lot.",
            category: "Electronics",
            location: "Kigali Heights Parking",
            date: new Date(),
            status: "Open",
            uniqueIdentifier: serialNumber,
            reportedAt: new Date()
        });

        // Check matches for the Lost Report
        const matchesExact = await ReportMatchingService.findPotentialMatches(lostReportExact);
        const exactMatch = matchesExact.find(m => m.candidate.id === foundReportExact.id);

        if (exactMatch && exactMatch.score >= 100) {
            console.log(`✅ Exact Match Verified! Score: ${exactMatch.score}`);
        } else {
            console.error(`❌ Exact Match Failed. Score: ${exactMatch?.score || 0}`);
        }

        // 3. Test FUZZY MATCH (Location + Keyword + Date)
        console.log("\n[3] Testing FUZZY MATCH (Location + Keyword)...");

        // User 1 reports LOST Keys
        const lostReportFuzzy = await storage.createReport({
            userId: user1.id,
            type: "lost",
            title: "Lost Car Keys Toyota",
            description: "Bunch of keys with a Toyota logo.",
            category: "Keys",
            location: "Nyarugenge Market",
            date: new Date(),
            status: "Open",
            reportedAt: new Date()
        });

        // User 2 reports FOUND Keys (Similar location, matching keyword)
        const foundReportFuzzy = await storage.createReport({
            userId: user2.id,
            type: "found",
            title: "Found Toyota Keys",
            description: "Found keys near the market entrance.",
            category: "Keys",
            location: "Nyarugenge", // substring match
            date: new Date(),
            status: "Open",
            reportedAt: new Date()
        });

        const matchesFuzzy = await ReportMatchingService.findPotentialMatches(lostReportFuzzy);
        const fuzzyMatch = matchesFuzzy.find(m => m.candidate.id === foundReportFuzzy.id);

        // Expected score breakdown:
        // Category: 20
        // Location: ~20
        // Keyword (Toyota): ~10
        // Date (Same day): 15
        // Total should be around 65
        console.log(`Fuzzy Match Score: ${fuzzyMatch?.score}`);

        if (fuzzyMatch && fuzzyMatch.score > 50) {
            console.log(`✅ Fuzzy Match Verified! Score: ${fuzzyMatch.score}`);
        } else {
            console.error(`❌ Fuzzy Match Failed. Score: ${fuzzyMatch?.score || 0}`);
        }

        // 4. Verification Summary
        console.log("\n=== Verification Complete ===");

    } catch (error) {
        console.error("Verification Script Failed:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the verification
verifyMatchingLogic();
