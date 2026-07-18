export const validateEmail = (email) => {
  const trimmed = email?.trim() ?? "";

  if (!trimmed) {
    return "Email is required";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email";
  }
  return "";
};

export const validatePassword = (password) => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return "";
};

// Bonus: for sign-up flows needing stronger rules
export const validateStrongPassword = (password) => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain a number";
  }
  return "";
};

// Bonus: for sign-up flows needing password confirmation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return "";
};

export const validateName = (name) => {
  const trimmed = name?.trim() ?? "";

  if (!trimmed) {
    return "Name is required";
  }
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters";
  }
  return "";
};
