const jwt = require("jsonwebtoken");
const { supabase, supabaseAuth } = require("../config/db.js");
const { ok, fail, dbError } = require("../utils/result");

const JWT_SECRET = process.env.JWT_SECRET;

const PROFILE_COLUMNS = "id, name, email";

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

class User {
  static async registerPushToken(userId, pushToken) {
    try {
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
      .upsert({ id, email, name }, { onConflict: "id", ignoreDuplicates: false })
      .select(PROFILE_COLUMNS)
      .single();

    if (error) return dbError("creating user profile", error);
    return ok({ data });
  }

  static async signup({ email, password, name }) {
    try {
      const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        // Only server-chosen metadata reaches GoTrue (the DB trigger reads
        // name/email from raw_user_meta_data).
        options: { data: { name, email } },
      });

      if (error) {
        const status = error.status || 400;
        if (status === 422 || /already/i.test(error.message)) {
          return fail("An account with this email already exists", "conflict");
        }
        if (status === 429) {
          return fail("Too many attempts, please try again later", "bad_request");
        }
        console.error("Signup error:", error);
        return fail("Could not create the account", "bad_request");
      }

      if (!data?.user) {
        return fail("Could not create the account", "bad_request");
      }

      // With email confirmation enabled GoTrue hides duplicates behind a fake
      // success whose user has no identities.
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return fail("An account with this email already exists", "conflict");
      }

      const profile = await User.ensureProfile({ id: data.user.id, email, name });
      if (!profile.success) return profile;

      return ok({ token: signToken(profile.data), user: profile.data });
    } catch (error) {
      return dbError("signing up", error);
    }
  }

  static async login({ email, password }) {
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        return fail("Invalid email or password", "unauthorized");
      }

      const { data: userRow, error: fetchError } = await supabase
        .from("users")
        .select(PROFILE_COLUMNS)
        .eq("id", data.user.id)
        .maybeSingle();

      if (fetchError) return dbError("fetching user profile", fetchError);

      let profile = userRow;
      if (!profile) {
        const created = await User.ensureProfile({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || null,
        });
        if (!created.success) return created;
        profile = created.data;
      }

      return ok({ token: signToken(profile), user: profile });
    } catch (error) {
      return dbError("logging in", error);
    }
  }
}

module.exports = User;
