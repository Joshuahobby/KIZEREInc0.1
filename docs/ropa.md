# Record of Processing Activities (ROPA)

| Processing Activity | Categories of Data | Legal Basis (Law 058/2021) | Categories of Recipients | Retention Period | Security Measures |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Account Registration** | Name, email, phone, hashed password, role | Art. 6 (Consent) & Art. 7 (Contract) | Internal DB (Neon DB), Application Server (Vercel) | Until account deletion + 7 days | HTTPS, Scrypt hashing, RBAC |
| **Item Registration (Lost/Found)** | Item descriptions, photos, location, user ID | Art. 7 (Performance of Contract) | Public users (via search) | Indefinite until deleted by user | HTTPS, ID references |
| **Identity Verification** | Government ID (NID/Passport), Selfie/Biometric Data, Liveness Code | Art. 6 (Explicit Consent for Sensitive Data) | Internal Admin/Moderators | Securely stored until manual or automated deletion by Admin | Private Cloudinary Bucket (Signed URLs only) |
| **Data Export Requests** | Full JSON dump of user data | Art. 19 (Right of Access) | The requesting Data Subject | Generated on-the-fly, not permanently stored | Auth token required |
| **Cookie Storage** | Session tokens, analytics identifiers | Art. 6 (Consent for Non-Essential) | Internal application, analytics provider | Variable (Session length to 12 months) | Secure, HttpOnly flags where possible, Cookie Banner |
