const { supabase } = require("../config/db.js");
const { ok, fail, dbError } = require("../utils/result");

const PROFILE_COLUMNS = "id, name, email";

class User {
  // Clears the caller's stored push token (logout / opt-out).
  static async unregisterPushToken(userId) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ pushToken: null })
        .eq("id", userId);

      if (error) return dbError("unregistering push token", error);
      return ok();
    } catch (error) {
      return dbError("unregistering push token", error);
    }
  }

  static async registerPushToken(userId, pushToken) {
    try {
      // A device carries one Expo token. When a second account signs in on
      // that device the token must MOVE, not be copied: leaving it on the
      // previous owner meant their notifications were delivered to whoever
      // was signed in now.
      const { error: releaseError } = await supabase
        .from("users")
        .update({ pushToken: null })
        .eq("pushToken", pushToken)
        .neq("id", userId);

      if (releaseError) {
        return dbError(
          "releasing push token from previous owner",
          releaseError,
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ pushToken })
        .eq("id", userId);

      if (error) return dbError("registering push token", error);
      return ok();
    } catch (error) {
      return dbError("registering push token", error);
    }
  }

  static PUBLIC_COLUMNS = "id, name, created_at";
  static PRIVATE_COLUMNS = "id, name, email, created_at";

  // Never return pushToken; email only for the owner (includePrivate).
  static async getUserData(userId, { includePrivate = false } = {}) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(includePrivate ? User.PRIVATE_COLUMNS : User.PUBLIC_COLUMNS)
        .eq("id", userId)
        .maybeSingle();

      if (error) return dbError("fetching user data", error);
      if (!data) return fail("User not found", "not_found");

      return ok({ data });
    } catch (error) {
      return dbError("fetching user data", error);
    }
  }

  // Ensure a public.users profile row exists for an auth user. The DB trigger
  // normally creates it on signup; this is the fallback so a missing row never
  // leaves an account half-created.
  static async ensureProfile({ id, email, name }) {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        { id, email, name },
        { onConflict: "id", ignoreDuplicates: false },
      )
      .select(PROFILE_COLUMNS)
      .single();

    if (error) return dbError("creating user profile", error);
    return ok({ data });
  }
}

module.exports = User;
