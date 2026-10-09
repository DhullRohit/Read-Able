// Custom validation functions for authentication request payloads (register, login)

export const validateRegister = (body) => {
  const { name, email, phone, password } = body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters.");
  }

  if (!email || !email.trim()) {
    errors.push("Email address is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please enter a valid email address.");
  }

  if (!phone || !phone.trim()) {
    errors.push("Mobile number is required.");
  } else if (!/^[+\d][\d\s-]{7,}$/.test(phone.trim())) {
    errors.push("Please enter a valid mobile number.");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  return errors;
};

export const validateLogin = (body) => {
  const { email, phone, identifier, password } = body;
  const errors = [];

  if (!email && !phone && !identifier) {
    errors.push("Please enter your email address or mobile number.");
  }

  if (!password) {
    errors.push("Password is required.");
  }

  return errors;
};
