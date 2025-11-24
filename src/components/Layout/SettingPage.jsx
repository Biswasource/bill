import React, { useState, useEffect } from "react";
import { Save, LogOut, X, CheckCircle, Upload } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

const SUPABASE_URL = "https://bwpbffyiggkomneomtch.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cGJmZnlpZ2drb21uZW9tdGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzQ3NjIsImV4cCI6MjA3OTAxMDc2Mn0.KrKtx23tflFy8ehIC_7jKh-Y4NDUNOvgQ9AoMlAu-I0";

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async fetchJson(path, options = {}) {
    const headers = {
      apikey: this.key,
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.url}/rest/v1${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }

    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  async select(table, filter = "") {
    return this.fetchJson(`/${table}?select=*${filter}`);
  }

  async insert(table, data) {
    const result = await this.fetchJson(`/${table}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        Prefer: "return=representation",
      },
    });
    return Array.isArray(result) ? result : [result];
  }

  async update(table, id, data) {
    return this.fetchJson(`/${table}?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        Prefer: "return=representation",
      },
    });
  }

  async getUser(token) {
    const response = await fetch(`${this.url}/auth/v1/user`, {
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    return response.json();
  }

  async signOut(token) {
    await fetch(`${this.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    documentTitle: "QUOTATION",
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    bankName: "",
    ifscCode: "",
    accountNo: "",
    bankBranch: "",
    termsAndConditions: "",
    logoImage: "",
    signatureImage: "",
  });
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("supabase_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const userData = await supabase.getUser(token);
        setUser(userData);
        supabase.setAuthToken(token);
        fetchSettings(userData.id);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  const fetchSettings = async (userId) => {
    setLoading(true);
    try {
      const data = await supabase.select("settings", `&user_id=eq.${userId}`);
      if (data && data.length > 0) {
        const userSettings = data[0];
        setSettingsId(userSettings.id);
        setSettings({
          documentTitle: userSettings.document_title || "QUOTATION",
          companyName: userSettings.company_name || "",
          companyAddress: userSettings.company_address || "",
          companyEmail: userSettings.company_email || "",
          companyPhone: userSettings.company_phone || "",
          companyWebsite: userSettings.company_website || "",
          bankName: userSettings.bank_name || "",
          ifscCode: userSettings.ifsc_code || "",
          accountNo: userSettings.account_number || "",
          bankBranch: userSettings.bank_branch || "",
          termsAndConditions: userSettings.terms_and_conditions || "",
          logoImage: userSettings.logo_image || "",
          signatureImage: userSettings.signature_image || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, logoImage: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, signatureImage: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (!settings.companyName || !settings.companyEmail) {
      setError("Please fill in company name and email");
      return;
    }

    setLoading(true);
    try {
      const settingsData = {
        document_title: settings.documentTitle,
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        company_email: settings.companyEmail,
        company_phone: settings.companyPhone,
        company_website: settings.companyWebsite,
        bank_name: settings.bankName,
        ifsc_code: settings.ifscCode,
        account_number: settings.accountNo,
        bank_branch: settings.bankBranch,
        terms_and_conditions: settings.termsAndConditions,
        logo_image: settings.logoImage,
        signature_image: settings.signatureImage,
        user_id: user.id,
      };

      if (settingsId) {
        // Update existing settings
        await supabase.update("settings", settingsId, settingsData);
        setSuccess("Settings updated successfully!");
      } else {
        // Insert new settings
        const result = await supabase.insert("settings", settingsData);
        if (result && result.length > 0) {
          setSettingsId(result[0].id);
        }
        setSuccess("Settings saved successfully!");
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save settings: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("supabase_token");
    if (token) {
      await supabase.signOut(token);
    }
    localStorage.removeItem("supabase_token");
    window.location.href = "/login";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-600">
              Configure your company details and quotation defaults
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError("")}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
                <CardDescription>
                  Upload your company logo for quotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings.logoImage ? (
                  <div className="text-center">
                    <img
                      src={settings.logoImage}
                      alt="Logo Preview"
                      className="w-full h-40 object-contain mb-4 border rounded-lg"
                    />
                    <Button
                      onClick={() =>
                        setSettings({ ...settings, logoImage: "" })
                      }
                      variant="destructive"
                      size="sm"
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition">
                    <Upload className="h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                      Click to upload logo
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      (PNG, JPG, SVG)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signature Image</CardTitle>
                <CardDescription>
                  Upload authorized signature for quotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings.signatureImage ? (
                  <div className="text-center">
                    <img
                      src={settings.signatureImage}
                      alt="Signature Preview"
                      className="w-full h-24 object-contain mb-4 border rounded-lg"
                    />
                    <Button
                      onClick={() =>
                        setSettings({ ...settings, signatureImage: "" })
                      }
                      variant="destructive"
                      size="sm"
                    >
                      Remove Signature
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                      Click to upload signature
                    </p>
                    <p className="text-xs text-slate-500 mt-1">(PNG, JPG)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentTitle">Document Title</Label>
                  <Input
                    id="documentTitle"
                    placeholder="QUOTATION"
                    value={settings.documentTitle}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documentTitle: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
                <CardDescription>
                  Default terms for your quotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your terms and conditions..."
                  value={settings.termsAndConditions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      termsAndConditions: e.target.value,
                    })
                  }
                  rows={8}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>
                  Your company information for quotations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Your Company Name"
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings({ ...settings, companyName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    placeholder="Full company address"
                    value={settings.companyAddress}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        companyAddress: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email *</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="info@company.com"
                    value={settings.companyEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, companyEmail: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    placeholder="+91 9876543210"
                    value={settings.companyPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, companyPhone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    placeholder="www.company.com"
                    value={settings.companyWebsite}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        companyWebsite: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>
                  Bank account information for payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Account Holder Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Account holder name"
                    value={settings.bankName}
                    onChange={(e) =>
                      setSettings({ ...settings, bankName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    placeholder="IFSC0001234"
                    value={settings.ifscCode}
                    onChange={(e) =>
                      setSettings({ ...settings, ifscCode: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNo">Account Number</Label>
                  <Input
                    id="accountNo"
                    placeholder="1234567890"
                    value={settings.accountNo}
                    onChange={(e) =>
                      setSettings({ ...settings, accountNo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Bank & Branch</Label>
                  <Input
                    id="bankBranch"
                    placeholder="Bank Name, Branch Location"
                    value={settings.bankBranch}
                    onChange={(e) =>
                      setSettings({ ...settings, bankBranch: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="h-12 px-8 text-base"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
