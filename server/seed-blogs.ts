import { db } from "./db";
import { blogPosts } from "@shared/schema";
import { eq } from "drizzle-orm";

const BLOG_POSTS = [
  {
    slug: "why-register-devices",
    title: "Why Registering Your Devices is Critical in Rwanda",
    excerpt: "Learn how the KIZERE Safe Registry protects you against theft and increases device resale value.",
    content: `
      <p>In today's digital age, our electronic devices are more than just tools—they hold our personal data, professional lives, and significant financial value.</p>
      <h2>The Rising Cost of Device Theft</h2>
      <p>Device theft remains a significant issue globally. Without a central registry, stolen devices can easily be wiped and resold on the secondary market with little risk to the thieves.</p>
      <h2>How KIZERE Changes the Game</h2>
      <p>By registering your device's unique identifiers (like IMEI and Serial Number) on KIZERE, you create a permanent, verifiable link between you and your property. If your device is ever lost or stolen, you can flag it instantly. This prevents buyers on the secondary market from unknowingly purchasing stolen goods and dramatically increases the chances of recovery by law enforcement.</p>
      <h2>Increased Resale Value</h2>
      <p>When you're ready to upgrade, transferring a verified KIZERE-registered item gives the buyer peace of mind, often allowing you to command a premium price compared to unregistered, unverifiable items.</p>
    `,
    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
    category: "Security",
    authorName: "KIZERE Security Team",
  },
  {
    slug: "digital-passports-future",
    title: "Digital Passports: The Future of Item Ownership",
    excerpt: "Explore how blockchain and secure databases are providing immutable proof of ownership for high-value items.",
    content: `
      <p>Imagine buying a used laptop but having zero certainty about its history. Was it stolen? Who was the original owner? The concept of a digital passport solves this completely.</p>
      <h2>Immutable Authenticity</h2>
      <p>A digital passport for physical goods means creating an unforgeable record in a secure database. At KIZERE, we anchor this concept by tying verified identities to serial numbers.</p>
      <h2>Seamless Transfers</h2>
      <p>When you sell a piece of equipment, you aren't just handing over the physical item. With KIZERE, you securely transfer the Digital Passport. The new owner instantly receives verified proof of purchase and a clear chain of custody, boosting trust dramatically in secondary markets.</p>
      <h2>Partnering with Retailers</h2>
      <p>We are actively working with major electronics retailers across Different parts Rwanda to automatically issue these digital passports at the point of sale. This ensures the device is protected from the exact moment it leaves the store.</p>
    `,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
    category: "Technology",
    authorName: "Tech Innovations",
  },
  {
    slug: "success-story-laptop-recovered",
    title: "Success Story: How a Student Recovered Their Stolen Laptop",
    excerpt: "A real-world example of how the KIZERE network helped reunite a university student with their essential device.",
    content: `
      <p>Last month, Grace, a third-year university student in Kigali, inadvertently left her laptop bag at a busy coffee shop. By the time she returned 20 minutes later, the bag was gone. Panic set in; her entire thesis was on that machine.</p>
      <h2>The Reporting Process</h2>
      <p>Because Grace had registered her laptop on the KIZERE platform at the beginning of the semester, she immediately logged into the portal and marked the item as 'Lost'. The system instantly updated the status of her laptop's serial number globally.</p>
      <h2>The Recovery</h2>
      <p>Two days later, an individual attempted to sell the laptop to a second-hand electronics dealer. Upon checking the serial number through the KIZERE public search tool, the dealer immediately saw the prominent "LOST / STOLEN" alert. The dealer discreetly contacted authorities and initiated a 'Found' report securely through KIZERE.</p>
      <h2>The Handover</h2>
      <p>Our secure messaging system allowed Grace and the platform moderators to safely arrange a handover. Her thesis was saved, and the laptop was returned seamlessly. "I never thought I'd see it again," she noted. "Registering took five minutes, but it saved me a semester's worth of work."</p>
    `,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    category: "Success Stories",
    authorName: "Community Stories",
  },
  {
    slug: "digitizing-ownership-rwanda",
    title: "How KIZERE is Digitizing Item Ownership in Rwanda",
    excerpt: "Moving from paper receipts to secure Digital Passports for a more transparent future.",
    content: `
      <p>Rwanda is at the forefront of digital transformation in Africa. From Irembo to mobile money, the nation is embracing digital systems to improve lives. KIZERE is continuing this legacy by digitizing physical item ownership.</p>
      <h2>Beyond Paper Receipts</h2>
      <p>Traditional paper receipts are easily lost, damaged, or forged. They don't provide a live record of who owns an item <i>right now</i>. KIZERE's Digital Passports provide an immutable, cloud-based record that moves with the item.</p>
      <h2>Building a Trusted Secondary Market</h2>
      <p>When every high-value item has a digital twin on KIZERE, buying used goods becomes as safe as buying new. You can verify the entire history of a phone, laptop, or camera with a single scan.</p>
      <h2>National Security Impact</h2>
      <p>A digitized registry makes it significantly harder for stolen goods to be monetized, directly contributing to the safety and security of our neighborhoods across the country.</p>
    `,
    image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&auto=format&fit=crop",
    category: "Vision",
    authorName: "KIZERE Strategy Team",
  },
  {
    slug: "protecting-business-assets-sme",
    title: "Protecting Your Business Assets: A Guide for SMEs",
    excerpt: "Learn how Rwandan businesses are using KIZERE to track and secure their equipment.",
    content: `
      <p>For small and medium enterprises (SMEs) in Rwanda, equipment—from specialized tools to office laptops—represents a major investment. Losing these assets to theft or mismanagement can be devastating.</p>
      <h2>Asset Tracking Simplified</h2>
      <p>KIZERE provides a low-cost, high-impact way for businesses to maintain a digital inventory. By assigning each asset to an employee and registering it on our platform, you create a clear line of accountability.</p>
      <h2>Proof for Insurance</h2>
      <p>In the event of a claim, having your assets pre-registered and verified on KIZERE provides insurance companies with the immutable proof of ownership they need to process claims faster.</p>
      <h2>Preventing Internal Loss</h2>
      <p>A transparent registry discourages theft from within and ensures that assets are returned when employees transition. It's about building a culture of responsibility within your Rwandan business.</p>
    `,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
    category: "Business",
    authorName: "Business Solutions",
  },
  {
    slug: "community-role-item-recovery",
    title: "The Power of Community: Your Role in Item Recovery",
    excerpt: "How a vigilant network of users and dealers keeps Rwanda's marketplaces safe.",
    content: `
      <p>Security is a shared responsibility. While KIZERE provides the technology, it is the community of honest citizens, shopkeepers, and law enforcement that makes the system truly powerful.</p>
      <h2>The Dealer's Pledge</h2>
      <p>We are building a network of 'Verified Dealers' who commit to checking every serial number against the KIZERE database before purchase. This simple act is the single most effective way to stop the trade of stolen items.</p>
      <h2>Reporting as an Act of Kindness</h2>
      <p>If you find a lost item, checking KIZERE and initiating a 'Found' report can save someone months of work or a significant financial loss. It's about looking out for one another in the Rwandan spirit ofcommunity support.</p>
      <h2>Stay Vigilant, Stay Safe</h2>
      <p>By promoting the use of the registry to friends and family, you are helping to shrink the market for stolen goods, making Rwanda safer for everyone to own and carry the tools they need to succeed.</p>
    `,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop",
    category: "Community",
    authorName: "Community Relations",
  }
];

async function seedBlogs() {
  console.log("Seeding blog posts...");
  for (const post of BLOG_POSTS) {
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.slug, post.slug));
    if (!existing) {
      await db.insert(blogPosts).values(post);
      console.log(`✅ Seeded: ${post.slug}`);
    } else {
      // Update existing post to reflect user changes in seed file
      await db.update(blogPosts).set(post).where(eq(blogPosts.slug, post.slug));
      console.log(`🔄 Updated: ${post.slug}`);
    }
  }
  console.log("Blog seeding complete.");
  process.exit();
}

seedBlogs().catch(e => {
  console.error(e);
  process.exit(1);
});
