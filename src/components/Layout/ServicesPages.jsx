import React, { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Check, Eye, LogOut } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      try {
        const error = JSON.parse(text);
        throw new Error(error.message || "Request failed");
      } catch (e) {
        throw new Error(text || "Request failed");
      }
    }

    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  async select(table) {
    return this.fetchJson(`/${table}?select=*`);
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

  async delete(table, id) {
    return this.fetchJson(`/${table}?id=eq.${id}`, {
      method: "DELETE",
    });
  }

  // Auth methods
  async signInWithPassword(email, password) {
    const response = await fetch(
      `${this.url}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: this.key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || "Login failed");
    }

    return response.json();
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

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: "", price: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingService, setEditingService] = useState({ name: "", price: "" });
  const [viewingService, setViewingService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  const truncateText = (text, wordLimit = 5) => {
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
  };

  // Check authentication on mount
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
        fetchServices();
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await supabase.select("services");
      setServices(data || []);
    } catch (err) {
      setError("Failed to fetch services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addService = async () => {
    if (!newService.name || !newService.price) {
      setError("Please fill in all service fields");
      return;
    }

    if (!user) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      await supabase.insert("services", {
        name: newService.name,
        price: parseFloat(newService.price),
        user_id: user.id,
      });

      setNewService({ name: "", price: "" });
      setError("");
      setSuccess("Service added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchServices();
    } catch (err) {
      setError("Failed to add service: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setEditingService({ name: service.name, price: service.price.toString() });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingService({ name: "", price: "" });
  };

  const saveEdit = async (id) => {
    if (!editingService.name || !editingService.price) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await supabase.update("services", id, {
        name: editingService.name,
        price: parseFloat(editingService.price),
      });

      setEditingId(null);
      setEditingService({ name: "", price: "" });
      setError("");
      setSuccess("Service updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchServices();
    } catch (err) {
      setError("Failed to update service");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    setLoading(true);
    try {
      await supabase.delete("services", id);
      setServices(services.filter((s) => s.id !== id));
      setSuccess("Service deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete service");
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
    <div className="min-h-screen bg-gradient-to-br bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Services Manager
            </h1>
            <p className="text-slate-600">
              Manage your service offerings and pricing
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
              <Check className="h-4 w-4" />
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
            <CardDescription>
              Create a new service with name and pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Service name"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Price"
                value={newService.price}
                onChange={(e) =>
                  setNewService({ ...newService, price: e.target.value })
                }
                className="w-40"
              />
              <Button onClick={addService} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services List</CardTitle>
            <CardDescription>
              {services.length} service{services.length !== 1 ? "s" : ""}{" "}
              available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg mb-2">No services yet</p>
                <p className="text-sm">Add your first service to get started</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead className="text-right w-32">
                        Price (₹)
                      </TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service, index) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          {editingId === service.id ? (
                            <Input
                              value={editingService.name}
                              onChange={(e) =>
                                setEditingService({
                                  ...editingService,
                                  name: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          ) : (
                            <span className="font-medium" title={service.name}>
                              {truncateText(service.name, 5)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === service.id ? (
                            <Input
                              type="number"
                              value={editingService.price}
                              onChange={(e) =>
                                setEditingService({
                                  ...editingService,
                                  price: e.target.value,
                                })
                              }
                              className="h-8 text-right"
                            />
                          ) : (
                            <span className="font-semibold">
                              ₹{service.price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === service.id ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveEdit(service.id)}
                                disabled={loading}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setViewingService(service)}
                                disabled={loading}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(service)}
                                disabled={loading}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteService(service.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Service Modal */}
        {viewingService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Service Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingService(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Service Name
                  </label>
                  <p className="text-lg font-medium text-slate-900 mt-1">
                    {viewingService.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Price
                  </label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ₹{viewingService.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      startEdit(viewingService);
                      setViewingService(null);
                    }}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Service
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteService(viewingService.id);
                      setViewingService(null);
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
