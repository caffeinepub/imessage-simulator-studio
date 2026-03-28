# iMessage Simulator Studio

## Current State
Admin Panel allows adding/editing users with: Principal ID, Name, Role, Status. The backend `UserProfile` type has `name` and `status` fields only. No email field exists anywhere.

## Requested Changes (Diff)

### Add
- `email: ?Text` optional field to `UserProfile` in Motoko backend
- Email column in the users table in Admin Panel
- Email input in the Add User form
- Email input in the Edit User dialog

### Modify
- `addUser` backend function to accept an optional email parameter
- `updateUser` backend function to accept an optional email parameter
- `UserProfile` type in `backend.d.ts` to include `email: string | null`
- `addUser` and `updateUser` signatures in `backend.d.ts`

### Remove
- Nothing

## Implementation Plan
1. Update `UserProfile` in `main.mo` to add `email: ?Text`
2. Update `addUser` and `updateUser` in `main.mo` to accept and store email
3. Update `backend.d.ts` to reflect new `UserProfile.email` field and updated function signatures
4. Update `AdminPanel/index.tsx` to add email field to add form, edit dialog, and table
