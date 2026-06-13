import { apiFetch } from '@/lib/api';
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from "../components/ui/select";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate("/");
      toast.success("Account created successfully!");
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
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111111]">Create an account</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Enter your details below to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>
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
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full rounded-none border-[#D1CDC4] focus:ring-[#C6A15B]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#D1CDC4]">
                  <SelectItem value="MEMBER" className="font-bold text-xs uppercase tracking-widest rounded-none">Team Member</SelectItem>
                  <SelectItem value="ADMIN" className="font-bold text-xs uppercase tracking-widest rounded-none">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-6 bg-slate-50 border-t border-[#D1CDC4]">
            <Button type="submit" className="w-full rounded-none bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#111111] font-bold uppercase tracking-widest text-xs" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="underline underline-offset-4 hover:text-[#111111]">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
