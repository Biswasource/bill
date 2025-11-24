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
import { Label } from "@/components/ui/label";

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

export default function ClientsManager() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingClient, setEditingClient] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [viewingClient, setViewingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  const truncateText = (text, maxLength = 20) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

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
        fetchClients();
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await supabase.select("clients");
      setClients(data || []);
    } catch (err) {
      setError("Failed to fetch clients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.phone) {
      setError("Please fill in name, email, and phone");
      return;
    }

    if (!user) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      await supabase.insert("clients", {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        company: newClient.company || null,
        user_id: user.id,
      });

      setNewClient({ name: "", email: "", phone: "", company: "" });
      setError("");
      setSuccess("Client added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchClients();
    } catch (err) {
      setError("Failed to add client: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (client) => {
    setEditingId(client.id);
    setEditingClient({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingClient({ name: "", email: "", phone: "", company: "" });
  };

  const saveEdit = async (id) => {
    if (!editingClient.name || !editingClient.email || !editingClient.phone) {
      setError("Please fill in name, email, and phone");
      return;
    }

    setLoading(true);
    try {
      await supabase.update("clients", id, {
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone,
        company: editingClient.company || null,
      });

      setEditingId(null);
      setEditingClient({ name: "", email: "", phone: "", company: "" });
      setError("");
      setSuccess("Client updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchClients();
    } catch (err) {
      setError("Failed to update client");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    setLoading(true);
    try {
      await supabase.delete("clients", id);
      setClients(clients.filter((c) => c.id !== id));
      setSuccess("Client deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete client");
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
              Clients Manager
            </h1>
            <p className="text-slate-600">
              Manage your client information and contacts
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
            <CardTitle>Add New Client</CardTitle>
            <CardDescription>
              Create a new client with contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Client name"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="+91 9876543210"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name (optional)"
                  value={newClient.company}
                  onChange={(e) =>
                    setNewClient({ ...newClient, company: e.target.value })
                  }
                />
              </div>
            </div>
            <Button onClick={addClient} disabled={loading} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients List</CardTitle>
            <CardDescription>
              {clients.length} client{clients.length !== 1 ? "s" : ""} in your
              database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg mb-2">No clients yet</p>
                <p className="text-sm">Add your first client to get started</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm">#</th>
                      <th className="text-left p-3 font-medium text-sm">
                        Name
                      </th>
                      <th className="text-left p-3 font-medium text-sm">
                        Email
                      </th>
                      <th className="text-left p-3 font-medium text-sm">
                        Phone
                      </th>
                      <th className="text-left p-3 font-medium text-sm">
                        Company
                      </th>
                      <th className="text-right p-3 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <tr
                        key={client.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-3 font-medium text-sm">{index + 1}</td>
                        <td className="p-3">
                          {editingId === client.id ? (
                            <Input
                              value={editingClient.name}
                              onChange={(e) =>
                                setEditingClient({
                                  ...editingClient,
                                  name: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          ) : (
                            <span className="font-medium" title={client.name}>
                              {truncateText(client.name, 25)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === client.id ? (
                            <Input
                              type="email"
                              value={editingClient.email}
                              onChange={(e) =>
                                setEditingClient({
                                  ...editingClient,
                                  email: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          ) : (
                            <span className="text-sm" title={client.email}>
                              {truncateText(client.email, 25)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === client.id ? (
                            <Input
                              value={editingClient.phone}
                              onChange={(e) =>
                                setEditingClient({
                                  ...editingClient,
                                  phone: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          ) : (
                            <span className="text-sm">{client.phone}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === client.id ? (
                            <Input
                              value={editingClient.company}
                              onChange={(e) =>
                                setEditingClient({
                                  ...editingClient,
                                  company: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          ) : (
                            <span className="text-sm text-slate-600">
                              {client.company || "-"}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {editingId === client.id ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveEdit(client.id)}
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
                                onClick={() => setViewingClient(client)}
                                disabled={loading}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(client)}
                                disabled={loading}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteClient(client.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {viewingClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingClient(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Name
                  </label>
                  <p className="text-lg font-medium text-slate-900 mt-1">
                    {viewingClient.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Email
                  </label>
                  <p className="text-lg text-slate-900 mt-1">
                    {viewingClient.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Phone
                  </label>
                  <p className="text-lg text-slate-900 mt-1">
                    {viewingClient.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Company
                  </label>
                  <p className="text-lg text-slate-900 mt-1">
                    {viewingClient.company || "Not specified"}
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      startEdit(viewingClient);
                      setViewingClient(null);
                    }}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Client
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteClient(viewingClient.id);
                      setViewingClient(null);
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
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
