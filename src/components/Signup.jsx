// Signup.jsx - Simplified Frontend Component
// Place this in: src/components/Signup.jsx or src/pages/Signup.jsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "../supabase/supabase";

// UUID generation function
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function Signup() {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s+()-]/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.companyName.trim()) {
      setError("Company name is required!");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address!");
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid 10-digit phone number!");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // Generate UUID for organisation
      const organisationId = generateUUID();

      // Prepare data for Supabase
      const organisationData = {
        id: organisationId,
        company_name: formData.companyName,
        email: formData.email,
        phone: formData.phone,
      };

      console.log("Organisation Data:", organisationData);

      const { data: orgData, error: orgError } = await supabase
        .from("organisations")
        .insert([organisationData])
        .select()
        .single();

      if (orgError) {
        console.error("Organisation insert error:", orgError);
        throw new Error(orgError.message);
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            organisation_id: organisationId,
            company_name: formData.companyName,
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(authError.message);
      }

      console.log("Success! User created:", authData.user);

      setSuccess(
        `Account created successfully! Check your email for verification.`
      );

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          companyName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        // Optionally redirect to login or dashboard
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(
        err.message ||
          "An error occurred while creating the account. Please try again."
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      {/* Centered Form */}
      <div className="w-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-base">
              Register your business to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="company@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {/* Password */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Login here
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
