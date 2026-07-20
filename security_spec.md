# Security Specification: Maersk Global Shipment Portal

This document describes the security spec for the Maersk Global Shipment Portal, outlining the data invariants, "Dirty Dozen" threat payloads, and security requirements to protect Firestore.

## 1. Data Invariants

1. **User Identity & Role Enforcement**:
   - A user's profile is stored in `users/{userId}`.
   - A user can only write/edit their own profile.
   - Customers are strictly forbidden from modifying or elevating their own roles to "Agent". Only existing system configuration or Admins can designate Agents.

2. **Shipment Access Control**:
   - Registered, authenticated users can read all shipments in the database (since this is a corporate ledger portal for tracking global shipments).
   - Only users with the `Agent` role (verified by fetching their profile or custom attributes) can create or update shipments.
   - Deletion of shipments is restricted to prevent loss of audit history.

3. **Logistics Rules & Policies**:
   - Registered users can read active routing rules.
   - Only `Agent` users can create, update, or delete logistics rules.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads are designed to attack the system and must be rejected by Firestore Security Rules:

### Payload 1: Role Escalation via Self-Update
*   **Target**: `users/{myUserId}`
*   **Attack**: Customer attempts to change their role to "Agent" in their profile.
```json
{
  "email": "user@gmail.com",
  "name": "Malicious User",
  "company": "Fake Corp",
  "role": "Agent"
}
```

### Payload 2: Profile Hijacking / Cross-Writing
*   **Target**: `users/{someoneElseUserId}`
*   **Attack**: Logged-in user tries to overwrite another user's profile.
```json
{
  "email": "victim@gmail.com",
  "name": "Victim Name",
  "role": "Customer"
}
```

### Payload 3: Customer Creating Logistics Rules
*   **Target**: `rules/RULE-123`
*   **Attack**: User with "Customer" role tries to insert a custom rule to disrupt supply chains.
```json
{
  "id": "RULE-123",
  "name": "Fake Disruption Policy",
  "description": "Delay everything",
  "targetStatus": "Delayed",
  "delayReason": "Customs",
  "delayDays": "10 Days",
  "isActive": true
}
```

### Payload 4: Resource Poisoning (Denial of Wallet) via Long Rule Name
*   **Target**: `rules/RULE-999`
*   **Attack**: Injecting an oversized (1MB) string into the rule's name field.
```json
{
  "id": "RULE-999",
  "name": "A".repeat(100000),
  "description": "Short desc",
  "targetStatus": "Delayed",
  "delayReason": "Port Congestion",
  "delayDays": "2 Days",
  "isActive": true
}
```

### Payload 5: Anonymous Shipment Creation
*   **Target**: `shipments/6500101000`
*   **Attack**: Unauthenticated request trying to write a fake shipment.
```json
{
  "id": "6500101000",
  "vesselName": "Ghost Ship",
  "origin": "Unknown",
  "destination": "Unknown",
  "status": "Pending"
}
```

### Payload 6: Customer Modifying Shipment status
*   **Target**: `shipments/6500101000`
*   **Attack**: Customer attempts to set their shipment status directly to "Delivered" to bypass customs check.
```json
{
  "status": "Delivered"
}
```

### Payload 7: Ghost Field Injection in Shipments
*   **Target**: `shipments/6500101000`
*   **Attack**: Adding unregistered parameters (e.g. `bypassCustoms: true`) to a shipment document.
```json
{
  "id": "6500101000",
  "vesselName": "Maersk Edmonton",
  "origin": "Singapore",
  "destination": "Frankfurt",
  "status": "At Sea",
  "bypassCustoms": true
}
```

### Payload 8: Path ID Poisoning
*   **Target**: `shipments/SH-%2F-POISON`
*   **Attack**: Using invalid URL characters or excessive length strings as path variable keys.

### Payload 9: Invalid Status Injection in Shipment Update
*   **Target**: `shipments/6500101000`
*   **Attack**: Setting an unrecognized status value like `Pirate Attack` or `Lost`.
```json
{
  "status": "Pirates"
}
```

### Payload 10: Client-Side Timestamp Spoofing
*   **Target**: `rules/RULE-123`
*   **Attack**: Setting `deployedAt` back in time to spoof historical records.
```json
{
  "deployedAt": 1000000000
}
```

### Payload 11: Unauthenticated Read attempts
*   **Target**: `shipments` collection
*   **Attack**: Reading the list of shipments without registering/logging in.

### Payload 12: Blanket Write / Deletion of Shipment ledger
*   **Target**: `shipments/6500101000`
*   **Attack**: Direct delete request to wipe historical voyage records.

---

## 3. Recommended Security Rules Concept

To prevent all of the above, we implement:
- Strong schema validation helpers (`isValidUser`, `isValidShipment`, `isValidRule`).
- `request.auth != null` checking on all resources.
- Checking user role against their profile doc using `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Agent'` for rules & shipment writes.
- Immutability of key identifiers (`id`, `createdAt`) on update.
- Size constraints on all string parameters.
