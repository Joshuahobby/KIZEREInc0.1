# KIZERE Platform: Comprehensive Use Cases

This document outlines the various use cases for the KIZERE Lost & Found platform from the perspective of different stakeholders and system "angles."

---

## 👨‍💼 1. The Distressed Owner (Lost Item Angle)

**Primary Goal:** To recover a lost item as quickly and securely as possible.

### Use Case 1.1: Standard Search
*   **Narrative:** A user loses their wallet at a local cafe. They visit KIZERE and use the search filters (Category: Wallets, Location: Kigali, Sort: Newest) to see if anyone has reported finding it.
*   **System Action:** Provides a real-time filtered list of reports matching the criteria.

### Use Case 1.2: Filing a Lost Report
*   **Narrative:** If no match is found, the user files a "Lost" report. They provide a detailed description, upload photos of a similar item (or the actual item if they have them), and specify the last known location.
*   **System Action:** Generates a unique "LST" receipt, triggers background matching against existing "Found" reports, and sends a confirmation email.

### Use Case 1.3: Claiming an Item
*   **Narrative:** The owner finds a matching "Found" report. They click "File Ownership Claim" and provide specific proof (e.g., "The ID inside has my name...", "There is a scratched corner...").
*   **System Action:** Notifies the finder that a claim has been filed and creates a pending verification task.

---

## 🙋‍♂️ 2. The Good Samaritan (Found Item Angle)

**Primary Goal:** To return a found item to its rightful owner.

### Use Case 2.1: Reporting a Found Item
*   **Narrative:** A taxi driver finds a smartphone in their car. They log into KIZERE and report it as "Found." They upload photos and provide a receipt number.
*   **System Action:** Marks the item as "Found," triggers matching, and alerts any users who have matching "Lost" reports.

### Use Case 2.2: Reviewing Claims
*   **Narrative:** The driver receives a notification that someone has claimed the phone. They view the claim details and the provided proof.
*   **System Action:** Allows the finder to communicate with the claimant or wait for an Admin to verify the claim.

---

## 🛡️ 3. The System Guardian (Administrator Angle)

**Primary Goal:** To ensure platform integrity, security, and user trust.

### Use Case 3.1: Identity Verification (KYC)
*   **Narrative:** A new user wants to become "Verified" to increase the trustworthiness of their reports. They upload their National ID and a selfie.
*   **System Action:** Admin reviews the documents in the Verification Dashboard, compares the selfie to the ID, and grants "Verified" status.

### Use Case 3.2: Content Moderation
*   **Narrative:** A user reports a fraudulent "Found" post that seems to be a scam.
*   **System Action:** Admin reviews the flagged content, suspends the offending account, and removes the fraudulent report.

### Use Case 3.3: System Analytics
*   **Narrative:** The Admin needs to see how many items were recovered this month for a performance report.
*   **System Action:** Dashboard provides real-time stats on total reports, resolution rates, and active users.

---

## 🕵️ 4. The Official Verifier (Agent/Moderator Angle)

**Primary Goal:** To mediate the return of high-value items and verify complex claims.

### Use Case 4.1: Claim Verification
*   **Narrative:** For a high-value laptop, the Moderator reviews the claim proof provided by the owner. They verify the serial number matches the one provided by the finder.
*   **System Action:** Moderator marks the claim as "Verified," enabling the next steps for physical return.

### Use Case 4.2: Dispute Resolution
*   **Narrative:** Two different people claim the same found item.
*   **System Action:** Moderator investigative tools allow them to compare the history and details of both claimants to determine the rightful owner.

---

## 💼 5. The Subscriber (Business/Entity Angle)

**Primary Goal:** To manage lost and found items within a specific organization (e.g., a hotel or airport).

### Use Case 5.1: Batch Uploading
*   **Narrative:** A hotel manager finds 10 items after a large event. They use the batch upload feature to register all items at once.
*   **System Action:** Efficiently processes multiple image uploads and creates individual reports for each item.

### Use Case 5.2: Premium Visibility
*   **Narrative:** A business wants their "Lost" reports for customer items to stay at the top of the search results.
*   **System Action:** Payment for a "Premium" or "Urgent" package boosts the report’s visibility and extends its expiration date.
