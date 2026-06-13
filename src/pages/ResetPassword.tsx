import { apiFetch } from '@/lib/api';
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { toast } from "sonner";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      toast.success(data.message || "Password has been updated!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password">
            <Button variant="outline" className="rounded-none">Request new link</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md rounded-none border border-[#D1CDC4] shadow-none">
        <CardHeader className="space-y-1 text-center bg-slate-50 border-b border-[#D1CDC4] p-6">
          <div className="w-12 h-12 bg-[#111111] mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl tracking-tighter">
            TM
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111111]">Set New Password</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#111111]">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-6 bg-slate-50 border-t border-[#D1CDC4]">
            <Button type="submit" className="w-full rounded-none bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
