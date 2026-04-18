# Firestore Security Specification

## Data Invariants
1. Students must be registered by a valid staff member (`registeredBy` must match `request.auth.uid`).
2. Fees must be recorded by the staff member who collected them (`collectedBy` must match `request.auth.uid`).
3. Inquiries can be created by anyone (public) but can only be read/updated by Admins or assigned Staff.
4. Users (Staff/Admins) can only read their own profile, except for Admins who can see all staff for assignment.
5. Activities and Notices are public for reading but only creates/updates by Staff/Admin.

## The "Dirty Dozen" (Attack Scenarios)
1. **Identity Spoofing**: A staff member tries to register a student with `registeredBy` set to an Admin's UID.
2. **Unauthorized Access**: A staff member tries to read a student registered by another staff member.
3. **Ghost Inquiries**: An attacker tries to read all inquiries without being an Admin or assigned staff.
4. **Fee Tampering**: A staff member tries to update a fee record they didn't collect.
5. **Role Escalation**: A staff member tries to change their own role to 'admin' in Firestore.
6. **Public Write**: A guest tries to post a Notice or Activity.
7. **Resource Poisoning**: An attacker tries to create a student with a 2MB string for the name.
8. **Relational Sync Bypass**: A staff member tries to delete a student who has active fee records (handled by logic, but rules should restrict deletion to Admin).
9. **Update Gap**: A staff member tries to modify the `originalOwnerId` of a record during an update.
10. **Terminal State Shortcut**: A user tries to move an inquiry from 'new' to 'enrolled' without proper validation fields.
11. **PII Leak**: An authenticated user tries to list all user emails in the system.
12. **System Field Injection**: A user tries to update the `createdAt` timestamp of a record.

## Red Team Audit Results
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|-------------------|
| Students   | PREVENTED (isOwner) | N/A | PREVENTED (isValidStudent) |
| Inquiries  | PREVENTED (isOwner) | PREVENTED (affectedKeys) | PREVENTED (Size checks) |
| Fees       | PREVENTED (isOwner) | N/A | PREVENTED (isValidFee) |
| Users      | PREVENTED (isOwner) | PREVENTED (role lock) | PREVENTED (Size checks) |

## Final Policy Summary
- **Admin**: Full read/write access to all collections.
- **Staff**: CRUD for their own registrations; read-only for public content.
- **Public**: Create-only for Inquiries; Read-only for Home page content (Activities/Notices).
