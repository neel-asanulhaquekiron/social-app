const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/db.js");

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

  static async getUserData(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return { success: false, msg: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { success: false, msg: error.message || "Something went wrong" };
    }
  }

  static async signup({ email, password, options }) {
    try {
      const { data, error } = await supabase.auth.signUp({
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
      const { data, error } = await supabase.auth.signInWithPassword({
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
