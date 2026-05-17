# Security Specification - NONASHA Wellness

## 1. Data Invariants
- A user can only access their own profile, addresses, and payment methods.
- Orders must belong to the authenticated user.
- Order status can only be modified by the owner to a limited set of fields, or via administrative actions (not covered here).
- Payment methods (last4, expiry, etc.) are private to the user.
- Address details are private to the user.

## 2. The Dirty Dozen Payloads (Rejection Targets)

1. **Identity Spoofing (Orders)**: Create an order with `userId` of another user.
2. **Identity Spoofing (Users)**: Create or update a user profile with `uid` that doesn't match `request.auth.uid`.
3. **Data Poisoning (Addresses)**: Create an address with a 1MB string in the `fullName` field.
4. **Relational Sync Break (Addresses)**: Create an address in User A's subcollection but set `userId` in the document data to User B.
5. **Unauthorized Enumeration (Addresses)**: User B attempts to list all addresses in User A's subcollection.
6. **Integrity Violation (Orders)**: Update an order's `total` amount after it has been created.
7. **Privilege Escalation (Users)**: User attempts to set `isAdmin: true` on their own profile (if such field existed).
8. **Resource Exhaustion (ID Poisoning)**: Create a document with a 2MB string as the ID.
9. **State Shortcut (Orders)**: Create an order with `status: 'Delivered'` immediately.
10. **Shadow Field Injection (Payments)**: Create a payment method with an unexpected field like `isVerifiedByStaff: true`.
11. **PII Leak (Users)**: Unauthenticated user attempts to read User A's email.
12. **Orphaned Record (Addresses)**: Create an address for a `userId` that does not exist in the `/users` collection.

## 3. Test Runner (firestore.rules.test.ts)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, getDoc, collection, addDoc, getDocs, doc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "nonasha-wellness",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("NONASHA Wellness Security Rules", () => {
  const aliceAuth = { uid: "alice", email: "alice@example.com", email_verified: true };
  const bobAuth = { uid: "bob", email: "bob@example.com", email_verified: true };

  test("User A cannot read User B's profile", async () => {
    const bobDb = testEnv.authenticatedContext(bobAuth.uid).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/bob"), { uid: "bob", email: "bob@example.com" });
    });

    const aliceDb = testEnv.authenticatedContext(aliceAuth.uid).firestore();
    await assertFails(getDoc(doc(aliceDb, "users/bob")));
  });

  test("User A cannot create order for User B", async () => {
    const aliceDb = testEnv.authenticatedContext(aliceAuth.uid).firestore();
    await assertFails(addDoc(collection(aliceDb, "orders"), {
      userId: "bob",
      items: [],
      total: 100,
      status: "Confirmed"
    }));
  });

  test("User A cannot list User B's addresses", async () => {
    const aliceDb = testEnv.authenticatedContext(aliceAuth.uid).firestore();
    await assertFails(getDocs(collection(aliceDb, "users/bob/addresses")));
  });

  test("User A cannot modify User B's payment methods", async () => {
      const aliceDb = testEnv.authenticatedContext(aliceAuth.uid).firestore();
      await assertFails(setDoc(doc(aliceDb, "users/bob/payments/card1"), {
          cardName: "Alice's Stolen Card",
          last4: "1234",
          expiry: "12/25"
      }));
  });
});
```
