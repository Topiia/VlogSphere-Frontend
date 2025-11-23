// src/pages/auth/Login.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/UI/Button";
import Logo from "../../components/UI/Logo";
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "", rememberMe: false }
  });

  const onSubmit = async (data) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await login(data.email.trim(), data.password, !!data.rememberMe);
      if (res.success) {
        // redirect to stored path if any
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath, { replace: true });
        } else {
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      } else {
        // login() already shows toast, but ensure we show something
        toast.error(res.error || "Invalid credentials");
      }
    } catch (err) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6"><Logo size="lg" /></div>
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-400">Sign in to your VLOGSPHERE account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <EnvelopeIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <input {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} type="email" className="glass-input pl-4 pr-10" disabled={loading} />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <input {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 chars" } })} type={showPassword ? "text" : "password"} className="glass-input pl-4 pr-10" disabled={loading} />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-10 top-3">
                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input {...register("rememberMe")} type="checkbox" className="w-4 h-4" disabled={loading} />
              <span className="text-sm text-gray-400">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-indigo-400 hover:underline text-sm">Forgot password?</Link>
          </div>

          <Button type="submit" fullWidth size="lg" variant="primary" loading={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-400">Don't have an account? <Link to="/register" className="text-indigo-400">Sign up</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
