# Data Breach Incident Response Plan

## 1. Preparation
KIZERE maintains continuous monitoring over its database (Neon Postgres) and application logs. Anomalies in authentication or abnormal data retrieval volume are monitored. 

## 2. Identification
If unauthorized access, disclosure, or destruction of personal data is detected or suspected, the team is to immediately halt non-essential services. The DPO (dpo@kizere.rw) will be notified immediately.

## 3. Containment & Eradication
- Identify the compromised systems or accounts.
- Rotate all database and cloud integration credentials (e.g. Neon, Cloudinary).
- Revoke active user sessions if the attack vector involved session hijacking.

## 4. Notification (Legal Requirement)
As per **Rwanda Law No. 058/2021, Article 56 (Notification of personal data breach)**:
1. **NCSA Notification:** Notify the supervisory authority (National Cyber Security Authority) within forty-eight (48) hours after having become aware of the breach, unless the breach is unlikely to result in a risk to the rights of natural persons.
2. **Data Subject Notification:** If the breach is likely to result in a high risk to the rights and freedoms of individuals (e.g. leak of unencrypted IDs or passwords), KIZERE will notify the affected individuals via their registered email address without undue delay.

## 5. Recovery & Post-Incident Analysis
- Restore services to a secure state from uncontaminated backups.
- Document the entire incident timeline, root cause analysis, and measures deployed in a Post-Mortem Report.

---

### Breach Notification Email Template
> **Subject:** IMPORTANT: Notice of Data Security Incident regarding your KIZERE Account
> **Dear [User],**
> We are writing to inform you of a data security incident that may have involved some of your personal information. 
> 
> **What Happened:** On [Date], we identified unauthorized access to...
> **What Information Was Involved:** The data affected was limited to [Name, Email, etc.]. No sensitive ID documents were compromised.
> **What We Are Doing:** We have secured our systems, notified the appropriate authorities (NCSA), and initiated...
> **What You Can Do:** We recommend you change your password and monitor...
> 
> For more information, contact our DPO at dpo@kizere.rw.
