# Annual Data Privacy Audit Checklist (Rwanda Law No. 058/2021)

## Data Subject Rights
- [ ] Is the "Export My Data" functionality still operational and providing accurate JSON outputs?
- [ ] Are account deletion requests being strictly honored, including the purging of data after the 7-day grace period?
- [ ] Has any data subject requested "Restriction of Processing"? If so, are the restrictions actively being enforced in the backend?

## Consent & Transparency
- [ ] Verify that the Privacy Policy is up to date and reflects any new features introduced this year.
- [ ] Check if the registration and identity verification flows still correctly block submissions lacking explicit consent.
- [ ] Review the Cookie Consent Banner. Is it still functional? Does it successfully prevent non-essential cookies from loading when "Decline" is pressed?

## General Compliance & Governance
- [ ] Have there been any data breaches? (If yes, were they reported to the NCSA within 48 hours according to Art. 56?)
- [ ] Is the Data Protection Impact Assessment (DPIA) still accurate, or have we modified our processing of sensitive data (like ID scans/selfies)?
- [ ] Is the Record of Processing Activities (ROPA) document accurately reflecting all databases and cloud services (like Cloudinary)?
- [ ] Ensure that NCSA registration details are still active. (Has our certificate of registration expired?)
- [ ] Check Cloudinary settings: Are all sensitive Identity Verification documents (passports, selfies) strictly uploaded to private buckets?

## Technical Security Measures
- [ ] Review access logs for any irregular spikes in admin-level data access.
- [ ] Rotate database credentials and relevant API keys (e.g., Cloudinary API Secret).
- [ ] Ensure all dependencies used in the project are updated to patch newly discovered security vulnerabilities.
