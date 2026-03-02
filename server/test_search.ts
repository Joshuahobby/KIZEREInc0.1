import { getReportsWithFilters } from "./storage/report.storage";

async function test() {
    try {
        const res = await getReportsWithFilters({
            page: 1,
            limit: 10,
            search: "wallet"
        });
        console.log("Success! Found:", res.reports.length);
    } catch (e: any) {
        console.error("Error Message:", e.message);
        if (e.query) console.error("Query:", e.query);
        console.error("Full Error:", e);
    }
    process.exit(0);
}

test();
