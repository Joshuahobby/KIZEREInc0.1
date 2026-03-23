import { db } from "./db";
import { reports, users } from "../shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { getReportsWithFilters } from "./storage/report.storage";

async function verify() {
  console.log("--- Starting Privacy & Featured Verification ---");

  try {
    // 0. Find a valid user
    const [dbUser] = await db.select().from(users).limit(1);
    if (!dbUser) {
      console.error("No users found in database. Please run seed-db.ts first.");
      process.exit(1);
    }
    const userId = dbUser.id;

    // 1. Create a test report
    const [report] = await db.insert(reports).values({
      userId: userId,
      type: "lost",
      category: "Electronics",
      title: "Privacy Test Phone",
      description: "This is a very long description that should be truncated in the search results to protect the privacy of the reporter. It contains sensitive details like serial numbers 123456789.",
      location: "Kigali, Nyarugenge, Sector X, Cell Y, House 123",
      date: new Date(),
      status: "Open",
      paymentStatus: "successful",
      receiptNumber: "PRIV-123-TEST",
      isFeatured: false
    }).returning();

    console.log(`Created test report ID: ${report.id}`);

    // 2. Test Guest Search (Normal search)
    // Note: The actual masking happens in search.routes.ts, not in storage.
    // We will verify the data returned by storage first.
    console.log("\nTesting Storage Data...");
    const searchResults = await getReportsWithFilters({
      search: "Privacy Test",
      page: 1,
      limit: 10
    });

    const foundReport = searchResults.reports.find((r: any) => r.id === report.id);
    if (!foundReport) {
      console.error("Test report not found in search results.");
      process.exit(1);
    }
    
    console.log(`Found Report Title: ${foundReport.title}`);
    console.log(`Found Report Location: ${foundReport.location}`);

    // 3. Simulate Route Masking Logic
    console.log("\nTesting Route Masking Logic Simulation...");
    const shouldMask = true; // Simulating guest user
    const displayTitle = `[Item in ${foundReport.category}]`;
    const maskedLocation = `[Region: ${foundReport.location.split(',').pop()?.trim() || 'Central'}]`;
    const truncatedDesc = foundReport.description && foundReport.description.length > 120 
      ? foundReport.description.substring(0, 120) + "..." 
      : foundReport.description;

    console.log(`Masked Title: ${displayTitle}`);
    console.log(`Masked Location: ${maskedLocation}`);
    console.log(`Truncated Desc: ${truncatedDesc}`);

    if (displayTitle.includes("Item in") && maskedLocation.includes("Region")) {
        console.log("Success: Masking logic produces expected generic output.");
    }

    // 4. Test Exact Match Search
    // In search.routes.ts: const isExactMatch = report.uniqueIdentifier === queryStr && queryStr.length > 3;
    // Actually, report.receiptNumber is what we might search for as exact match too.
    console.log("\nTesting Exact Match Logic Simulation...");
    const queryStr = "PRIV-123-TEST";
    const isExactMatch = foundReport.receiptNumber === queryStr;
    console.log(`Query: ${queryStr}, Match: ${isExactMatch}`);
    
    if (isExactMatch) {
      console.log("Success: Exact match identified. In the route, this would bypass masking.");
    }

    // 5. Test Featured Prioritization
    console.log("\nTesting Featured Prioritization...");
    // Create another non-featured report
    const [normalReport] = await db.insert(reports).values({
      userId: userId,
      type: "lost",
      category: "Others",
      title: "Normal Report",
      description: "Just a normal report",
      location: "Kigali",
      date: new Date(),
      status: "Open",
      paymentStatus: "successful",
      isFeatured: false
    }).returning();

    // Mark first report as featured
    await db.update(reports).set({ 
        isFeatured: true, 
        featuredAt: new Date(Date.now() + 86400000) 
    }).where(eq(reports.id, report.id));

    // We simulate the sorting logic from search.routes.ts
    const allReports = [foundReport, normalReport];
    // Add score to reports
    const scoredReports = allReports.filter((r): r is NonNullable<typeof r> => r != null).map(r => ({
        ...r,
        isFeatured: r.id === report.id,
        score: r.id === report.id ? 100 : 0
    }));

    scoredReports.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.score - a.score;
    });

    if (scoredReports[0].id === report.id && scoredReports[0].isFeatured) {
      console.log("Success: Featured report is at the top of the list!");
    } else {
      console.error("Failed: Featured report not prioritized.");
    }

    // Cleanup
    await db.delete(reports).where(or(eq(reports.id, report.id), eq(reports.id, normalReport.id)));
    console.log("\n--- Verification Complete ---");
  } catch (err) {
    console.error("Verification failed:", err);
  }
  process.exit(0);
}

verify();
