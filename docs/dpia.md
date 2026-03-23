# Data Protection Impact Assessment (DPIA)

## 1. Description of the Processing
- **Nature:** Registration of users and items, identity verification using government IDs and selfies, and facilitating return of lost items.
- **Scope:** Personal data (names, emails, phones) and Sensitive data (Biometrics, IDs).
- **Context:** KIZERE INC., a Rwandan tech startup.
- **Purposes:** Providing a secure registry and lost-and-found matching service.

## 2. Assessment of Necessity and Proportionality
- Processing is strictly necessary to prevent fraud (item theft) and enable contact between finders and owners. 
- Data minimization is applied: only required ID points are collected during verification.

## 3. Risks to the Rights and Freedoms of Data Subjects
- **Risk 1:** Unauthorized access to sensitive ID documents or selfies.
- **Risk 2:** Accidental deletion or modification of registry data.
- **Risk 3:** Processing restriction mechanism failing, leading to unwanted data use.

## 4. Measures to Address Risks
- **For Risk 1:** All sensitive documents are stored in a private Cloudinary bucket requiring signed URLs for access. Strong RBAC is enforced.
- **For Risk 2:** Database backups via Neon serverless Postgres; soft-delete grace periods (7 days) for user account deletions.
- **For Risk 3:** Automated boolean checks (`processingRestricted`) hardcoded into the backend data retrieval queries.
