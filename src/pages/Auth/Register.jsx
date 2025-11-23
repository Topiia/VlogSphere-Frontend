// src/pages/auth/Register.jsx
import { toast } from "react-hot-toast";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { isValidPassword } from "../../utils/helpers";
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

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (loading) return; // prevent double submission
    setLoading(true);

    try {
      const payload = {
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
      };

      const result = await registerUser(payload);

      if (result?.success) {
        toast.success("Account created successfully!");
        navigate("/login");
      } else {
        // result.error is expected to be a string
        toast.error(result?.error || "Registration failed");
      }
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  const passwordRequirements = [
    { text: "At least 6 characters", test: (pwd) => pwd.length >= 6 },
    { text: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
    { text: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
    { text: "Contains a number", test: (pwd) => /\d/.test(pwd) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden pb-20">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-lg w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6"><Logo size="lg" /></div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Create Your Account</h2>
          <p className="text-[var(--theme-text-secondary)]">Join the future of visual storytelling</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-[480px]:space-y-4">
          <div className="glass-card p-8 max-[480px]:p-5 rounded-2xl space-y-5 max-[480px]:space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input {...formRegister("username", {
                  required: "Username is required",
                  minLength: { value: 3, message: "Minimum 3 chars" },
                  maxLength: { value: 30, message: "Maximum 30 chars" },
                  pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Only letters/numbers/_" }
                })} id="username" className="glass-input pl-4 pr-10" disabled={loading} />
              </div>
              {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <EnvelopeIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input {...formRegister("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                })} type="email" id="email" className="glass-input pl-4 pr-10" disabled={loading} />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input {...formRegister("password", {
                  required: "Password is required",
                  validate: v => isValidPassword(v) || "Must be 6+ chars, include upper/lower/number"
                })} type={showPassword ? "text" : "password"} id="password" className="glass-input pl-4 pr-10" disabled={loading} />
                <button type="button" className="absolute right-10 top-3" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400"/> : <EyeIcon className="h-5 w-5 text-gray-400"/>}
                </button>
              </div>

              {password && <div className="mt-3 space-y-1">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${req.test(password) ? "text-green-400" : "text-gray-400"}`}>
                    <CheckIcon className={`w-3 h-3 ${req.test(password) ? "opacity-100" : "opacity-0"}`} />
                    {req.text}
                  </div>
                ))}
              </div>}
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input {...formRegister("confirmPassword", {
                  required: "Please confirm password",
                  validate: value => value === password || "Passwords do not match"
                })} type={showConfirmPassword ? "text" : "password"} id="confirmPassword" className="glass-input pl-4 pr-10" disabled={loading}/>
                <button type="button" className="absolute right-10 top-3" onClick={() => setShowConfirmPassword(s => !s)}>
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400"/> : <EyeIcon className="h-5 w-5 text-gray-400"/>}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2">
                <input {...formRegister("agreeToTerms", { required: "You must accept the terms" })} type="checkbox" className="mt-1 w-4 h-4" disabled={loading} />
                <span className="text-sm text-gray-300">I agree to the <Link to="/terms" className="text-indigo-400 hover:underline">Terms</Link> and <Link to="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link></span>
              </label>
              {errors.agreeToTerms && <p className="text-red-400 text-sm mt-1">{errors.agreeToTerms.message}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" variant="primary" loading={loading}>
              {loading ? "Creating Account…" : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="text-center mt-8">
          <p className="text-gray-400">Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
