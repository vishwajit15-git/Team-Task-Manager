import { apiFetch } from '@/lib/api';
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { toast } from "sonner";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      
      setSubmitted(true);
      toast.success(data.message || "Reset link sent!");
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
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111111]">Forgot Password</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        {!submitted ? (
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 p-6 bg-slate-50 border-t border-[#D1CDC4]">
              <Button type="submit" className="w-full rounded-none bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Remember your password?{" "}
                <Link to="/login" className="underline underline-offset-4 hover:text-[#111111]">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <div className="p-6 bg-white text-center">
            <p className="text-sm font-medium mb-4">
              If an account with that email exists, we have sent a reset password link. 
              Please check your inbox.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full rounded-none border-[#D1CDC4] font-bold uppercase tracking-widest text-xs">
                Return to Login
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
