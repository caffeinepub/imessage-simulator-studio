import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // V1 type (legacy — used only for migration from old stable storage)
  type UserProfileV1 = {
    name : Text;
    status : { #active; #suspended };
  };

  // Current type
  public type UserProfile = {
    name : Text;
    email : ?Text;
    status : { #active; #suspended };
  };

  public type UserSummary = {
    principal : Principal;
    profile : UserProfile;
    role : AccessControl.UserRole;
  };

  // Old stable variable — keeps the same name so Motoko can read the old data on upgrade
  let userProfiles = Map.empty<Principal, UserProfileV1>();

  // New stable variable holding the migrated/current data
  let userProfilesV2 = Map.empty<Principal, UserProfile>();

  // One-time migration: on upgrade, move V1 records into V2 with email = null
  system func postupgrade() {
    userProfiles.entries().forEach(
      func((p, old)) {
        if (userProfilesV2.get(p) == null) {
          userProfilesV2.add(p, { name = old.name; email = null; status = old.status });
        };
      }
    );
  };

  func checkActive(caller : Principal) {
    switch (userProfilesV2.get(caller)) {
      case (?profile) {
        switch (profile.status) {
          case (#active) {};
          case (#suspended) { Runtime.trap("Account suspended") };
        };
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  // Auto-register the caller on first login. Safe to call every login (idempotent).
  public shared ({ caller }) func registerSelf() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot register");
    };
    switch (userProfilesV2.get(caller)) {
      case (?_existing) { /* already registered, do nothing */ };
      case (null) {
        let profile : UserProfile = {
          name = caller.toText();
          email = null;
          status = #active;
        };
        userProfilesV2.add(caller, profile);
        let existingRole = AccessControl.getUserRole(accessControlState, caller);
        switch (existingRole) {
          case (#guest) {
            AccessControl.assignRole(accessControlState, caller, caller, #user);
          };
          case (_) { /* keep existing role */ };
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (userProfilesV2.get(caller)) {
      case (?profile) {
        switch (profile.status) {
          case (#active) { ?profile };
          case (#suspended) { Runtime.trap("Account suspended") };
        };
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfilesV2.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    checkActive(caller);
    userProfilesV2.add(caller, profile);
  };

  // Admin-only functions
  public query ({ caller }) func listUsers() : async [UserSummary] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list users");
    };
    let list = List.empty<UserSummary>();
    userProfilesV2.entries().forEach(
      func((principal, profile)) {
        let role = AccessControl.getUserRole(accessControlState, principal);
        list.add({ principal; profile; role });
      }
    );
    list.toArray();
  };

  public shared ({ caller }) func addUser(principal : Principal, name : Text, email : ?Text, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add users");
    };
    let profile : UserProfile = {
      name;
      email;
      status = #active;
    };
    userProfilesV2.add(principal, profile);
    AccessControl.assignRole(accessControlState, caller, principal, role);
  };

  public shared ({ caller }) func suspendUser(principal : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can suspend users");
    };
    switch (userProfilesV2.get(principal)) {
      case (?profile) {
        let updatedProfile = { profile with status = #suspended };
        userProfilesV2.add(principal, updatedProfile);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public shared ({ caller }) func unsuspendUser(principal : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can unsuspend users");
    };
    switch (userProfilesV2.get(principal)) {
      case (?profile) {
        let updatedProfile = { profile with status = #active };
        userProfilesV2.add(principal, updatedProfile);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  public shared ({ caller }) func removeUser(principal : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove users");
    };
    userProfilesV2.remove(principal);
    AccessControl.assignRole(accessControlState, caller, principal, #guest);
  };

  public shared ({ caller }) func updateUser(principal : Principal, name : Text, email : ?Text, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update users");
    };
    switch (userProfilesV2.get(principal)) {
      case (?profile) {
        let updatedProfile = { profile with name; email };
        userProfilesV2.add(principal, updatedProfile);
        AccessControl.assignRole(accessControlState, caller, principal, role);
      };
      case (null) { Runtime.trap("Profile not found") };
    };
  };

  // Additional iMessage Simulator Studio app logic can be added here.
};
