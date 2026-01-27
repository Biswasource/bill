import React, { useState, useEffect } from "react";
import { UserPlus, User, Mail, Shield, Trash2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwpbffyiggkomneomtch.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cGJmZnlpZ2drb21uZW9tdGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzQ3NjIsImV4cCI6MjA3OTAxMDc2Mn0.KrKtx23tflFy8ehIC_7jKh-Y4NDUNOvgQ9AoMlAu-I0";

// Helper client to create users without changing admin session
const tempSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export default function UserManagement() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [staffUsers, setStaffUsers] = useState([]);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("supabase_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminUser(user);
      fetchStaffUsers(user.user_metadata?.organisation_id);
    }
  }, []);

  const fetchStaffUsers = async (orgId) => {
    if (!orgId) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/staff_users?organisation_id=eq.${orgId}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${localStorage.getItem("supabase_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStaffUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!adminUser?.user_metadata?.organisation_id) {
      setError("Admin organization ID not found. Please re-login.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: "user",
            organisation_id: adminUser.user_metadata.organisation_id,
            company_name: adminUser.user_metadata.company_name
          },
        },
      });

      if (authError) throw authError;

      // 2. Store in our staff_users table for listing (Admin can't list Auth users without Service Role)
      const staffData = {
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        organisation_id: adminUser.user_metadata.organisation_id,
        role: "user",
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/staff_users`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${localStorage.getItem("supabase_token")}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(staffData),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to save staff record");
      }

      setSuccess(`User ${formData.name} created successfully! They can now login.`);
      setFormData({ name: "", email: "", password: "" });
      fetchStaffUsers(adminUser.user_metadata.organisation_id);
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? Note: This only removes them from this list, not from Supabase Auth (requires service role).")) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/staff_users?id=eq.${userId}`, {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${localStorage.getItem("supabase_token")}`,
          },
        });
        if (response.ok) {
            setStaffUsers(staffUsers.filter(u => u.id !== userId));
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
              User Management
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl">
              Create and manage sub-users who can only generate quotations for your organization.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 animate-in fade-in slide-in-from-top-4">
            <X className="h-5 w-5" />
            <AlertDescription className="text-sm font-medium ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="h-5 w-5" />
            <AlertDescription className="text-sm font-medium ml-2">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Add User Form */}
          <div className="lg:col-span-5">
            <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Add New User</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  New users will have restricted access.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleAddUser} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Temporary Password</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Create User Account"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <div className="lg:col-span-7">
            <Card className="border-none shadow-2xl shadow-slate-200/60 bg-white/80 backdrop-blur-xl h-full">
              <CardHeader className="p-8 border-b border-slate-100">
                <CardTitle className="text-2xl font-bold text-slate-900">Active Staff Accounts</CardTitle>
                <CardDescription>Managed accounts within your organization</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {staffUsers.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                      <User className="h-8 w-8" />
                    </div>
                    <p className="text-slate-500 font-medium">No staff users added yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {staffUsers.map((u) => (
                      <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-lg uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{u.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="truncate">{u.email}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{u.role}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteUser(u.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
