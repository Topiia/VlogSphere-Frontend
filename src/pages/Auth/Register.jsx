// src/pages/auth/Register.jsx
import { toast } from "react-hot-toast";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/UI/Button";
import Logo from "../../components/UI/Logo";
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { isValidPassword } from "../../utils/helpers";

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // avoid name clash: rename useForm's register to formRegister
  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    // prevent double calls
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      const result = await registerUser(payload);

      // registerUser returns { success, error }
      if (result?.success) {
        toast.success("Account created successfully!");
        navigate("/login");
      } else {
        // server message fallback
        const msg = result?.error || "Registration failed. Try again.";
        toast.error(msg);
      }
    } catch (err) {
      // should not reach here often because register handles errors,
      // but keep safe fallback
      const msg = err?.response?.data?.message || "Something went wrong. Try again!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { text: "At least 6 characters", test: (pwd) => (pwd || "").length >= 6 },
    { text: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd || "") },
    { text: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd || "") },
    { text: "Contains a number", test: (pwd) => /\d/.test(pwd || "") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden pb-20">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div className="max-w-lg w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Create Your Account</h2>
          <p className="text-[var(--theme-text-secondary)]">Join the future of visual storytelling</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-[480px]:space-y-4">
          <div className="glass-card p-8 max-[480px]:p-5 rounded-2xl space-y-5 max-[480px]:space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[var(--theme-text)] mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[var(--theme-text-secondary)]" />
                </div>
                <input
                  {...formRegister("username", {
                    required: "Username is required",
                    minLength: { value: 3, message: "Username must be at least 3 characters" },
                    maxLength: { value: 30, message: "Username cannot exceed 30 characters" },
                    pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Only letters, numbers, underscores" },
                  })}
                  type="text"
                  className="glass-input pl-11"
                  placeholder="Choose a username"
                  disabled={loading}
                />
              </div>
              {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--theme-text)] mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-[var(--theme-text-secondary)]" />
                </div>
                <input
                  {...formRegister("email", {
                    required: "Email is required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
                  })}
                  type="email"
                  className="glass-input pl-11"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--theme-text)] mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-[var(--theme-text-secondary)]" />
                </div>
                <input
                  {...formRegister("password", {
                    required: "Password is required",
                    validate: (value) =>
                      isValidPassword(value) || "Password must be 6+ chars and include upper, lower and number",
                  })}
                  type={showPassword ? "text" : "password"}
                  className="glass-input pl-11 pr-11"
                  placeholder="Create a strong password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-10 flex items-center text-[var(--theme-text-secondary)]"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {watch("password") && (
                <div className="mt-3 space-y-1 text-xs">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className={`flex items-center space-x-2 ${req.test(password) ? "text-green-400" : "text-[var(--theme-text-secondary)]"}`}>
                      <CheckIcon className={`w-3 h-3 ${req.test(password) ? "opacity-100" : "opacity-0"}`} />
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--theme-text)] mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  {...formRegister("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === password || "Passwords do not match",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  className="glass-input pl-11 pr-11"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-10 flex items-center text-[var(--theme-text-secondary)]"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start">
                <input
                  {...formRegister("agreeToTerms", { required: "You must agree to terms" })}
                  type="checkbox"
                  className="mt-1 w-4 h-4"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-[var(--theme-text-secondary)]">
                  I agree to the <Link to="/terms" className="text-[var(--theme-accent)]">Terms</Link> and <Link to="/privacy" className="text-[var(--theme-accent)]">Privacy</Link>
                </span>
              </label>
              {errors.agreeToTerms && <p className="mt-2 text-sm text-red-400">{errors.agreeToTerms.message}</p>}
            </div>

            <div>
              <Button type="submit" fullWidth size="lg" variant="primary" loading={loading} className="mt-4" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 glass text-[var(--theme-text-secondary)]">Or sign up with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={loading} className="flex items-center justify-center space-x-2"><span>Google</span></Button>
          <Button variant="secondary" disabled={loading} className="flex items-center justify-center space-x-2"><span>Twitter</span></Button>
        </div>

        <div className="text-center mt-8">
          <p className="text-[var(--theme-text-secondary)]">
            Already have an account? <Link to="/login" className="text-[var(--theme-accent)]">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
