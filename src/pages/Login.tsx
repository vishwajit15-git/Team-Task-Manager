import { apiFetch } from '@/lib/api';
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { toast } from "sonner";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate("/");
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md rounded-none border border-[#D1CDC4] shadow-none">
        <CardHeader className="space-y-1 text-center bg-slate-50 border-b border-[#D1CDC4] p-6">
          <div className="w-12 h-12 bg-[#111111] mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl tracking-tighter">
            TM
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111111]">Sign in to workspace</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Enter your email below to login</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Password</Label>
                <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B] hover:text-[#111111]">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-6 bg-slate-50 border-t border-[#D1CDC4]">
            <Button type="submit" className="w-full rounded-none bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="underline underline-offset-4 hover:text-[#111111]">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
