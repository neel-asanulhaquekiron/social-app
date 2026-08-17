const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase, supabaseAuth } = require("../config/db.js");

const JWT_SECRET = process.env.JWT_SECRET;

class User {
  static async registerPushToken(userId, pushToken) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ pushToken })
        .eq("id", userId);

      if (error) return { success: false, msg: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, msg: error.message || "Something went wrong" };
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

      if (error) {
        console.error("Error fetching user data:", error);
        return { success: false, msg: error.message };
      }

      if (!data) {
        return { success: false, notFound: true, msg: "User not found" };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async signup({ email, password, options }) {
    try {
      const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        return { success: false, msg: error.message };
      }

      const { data: userRow, error: fetchError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", data.user.id)
        .single();

      if (fetchError) {
        return { success: false, msg: fetchError.message };
      }

      const token = jwt.sign(
        { id: userRow.id, email: userRow.email },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return { success: true, token, user: userRow };
    } catch (error) {
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async login({ email, password }) {
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, msg: "Invalid email or password" };
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", data.user.id)
        .single();

      const token = jwt.sign(
        { id: userRow.id, email: userRow.email },
        JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );

      return { success: true, token, user: userRow };
    } catch (error) {
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }
}

module.exports = User;
