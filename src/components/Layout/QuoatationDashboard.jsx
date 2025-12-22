import React, { useState, useEffect } from "react";
import { Edit, Eye, Trash2, Download, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  async select(table, filters = {}) {
    let query = `/${table}?select=*`;
    Object.entries(filters).forEach(([key, value]) => {
      query += `&${key}=eq.${value}`;
    });
    return this.fetchJson(query);
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

  async getUser(token) {
    const response = await fetch(`${this.url}/auth/v1/user`, {
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to get user");
    return response.json();
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

function numberToWords(num) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  let result = "";
  if (crore > 0) result += convertTwoDigit(crore) + " Crore ";
  if (lakh > 0) result += convertTwoDigit(lakh) + " Lakh ";
  if (thousand > 0) result += convertTwoDigit(thousand) + " Thousand ";
  if (hundred > 0) result += ones[hundred] + " Hundred ";
  if (num > 0) result += convertTwoDigit(num);

  return result.trim() + " Rupees Only";

  function convertTwoDigit(n) {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + ones[n % 10] : "");
  }
}

export default function QuotationsList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [editForm, setEditForm] = useState({
    quote_number: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    service_description: "",
    total_amount: 0,
    date: "",
    expiry_date: "",
    status: "draft",
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_website: "",
    bank_name: "",
    ifsc_code: "",
    account_number: "",
    bank_branch: "",
    terms_and_conditions: "",
  });

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
        await fetchQuotations(userData.id);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  const fetchQuotations = async (userId) => {
    try {
      setLoading(true);
      const data = await supabase.select("quotations", { user_id: userId });
      // Sort by created_at descending so newest appears at bottom
      const sortedData = (data || []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setQuotations(sortedData);
    } catch (err) {
      setError("Failed to fetch quotations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (quotation) => {
    setSelectedQuotation(quotation);
    setViewDialog(true);
  };

  const handleEdit = (quotation) => {
    setSelectedQuotation(quotation);
    setEditForm({
      quote_number: quotation.quote_number || "",
      client_name: quotation.client_name || "",
      client_email: quotation.client_email || "",
      client_phone: quotation.client_phone || "",
      client_address: quotation.client_address || "",
      service_description: quotation.service_description || "",
      total_amount: quotation.total_amount || 0,
      date: quotation.date || "",
      expiry_date: quotation.expiry_date || "",
      status: quotation.status || "draft",
      company_name: quotation.company_name || "",
      company_email: quotation.company_email || "",
      company_phone: quotation.company_phone || "",
      company_address: quotation.company_address || "",
      company_website: quotation.company_website || "",
      bank_name: quotation.bank_name || "",
      ifsc_code: quotation.ifsc_code || "",
      account_number: quotation.account_number || "",
      bank_branch: quotation.bank_branch || "",
      terms_and_conditions: quotation.terms_and_conditions || "",
    });
    setEditDialog(true);
  };

  const regenerateHtmlContent = (form, originalHtml) => {
    const totalInWords = numberToWords(Math.floor(form.total_amount));

    // Extract the logo and signature images from original HTML
    const logoMatch = originalHtml.match(/<img src="([^"]*)" alt="Logo">/);
    const signatureMatch = originalHtml.match(
      /<img src="([^"]*)" alt="Signature">/
    );

    const logoImage = logoMatch ? logoMatch[1] : "";
    const signatureImage = signatureMatch ? signatureMatch[1] : "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation ${form.quote_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    .page { width: 210mm; margin: 0 auto; padding: 10mm; background: white; }
    .header-container { display: flex; justify-content: space-between; align-items: flex-start; border: 2px solid #000; padding: 10px; margin-bottom: 0; }
    .logo-box { width: 80px; height: 80px; background: #000; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .company-info { flex: 1; padding: 0 15px; font-size: 10px; line-height: 1.4; }
    .company-info h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .company-info p { margin: 2px 0; }
    .quotation-meta { text-align: right; font-size: 10px; line-height: 1.6; min-width: 150px; }
    .quotation-meta strong { display: inline-block; width: 100px; text-align: left; }
    .quotation-title-bar { background: #000; color: white; text-align: center; padding: 8px; font-size: 16px; font-weight: bold; letter-spacing: 2px; margin-bottom: 0; }
    .bill-to-section { border: 2px solid #000; border-top: none; padding: 10px; margin-bottom: 10px; font-size: 10px; line-height: 1.5; }
    .bill-to-section strong { display: block; margin-bottom: 4px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 0; }
    thead { background-color: #000; color: white; }
    th { padding: 10px 8px; text-align: center; font-weight: bold; border: 1px solid #000; font-size: 10px; }
    td { padding: 10px 8px; border: 1px solid #000; text-align: center; }
    .service-col { text-align: left; }
    .amount-col { text-align: right; }
    .total-row td { height: auto; padding: 8px; font-weight: bold; }
    .tax-section { border: 2px solid #000; border-top: none; margin-bottom: 10px; }
    .tax-row { display: flex; border-bottom: 1px solid #000; font-size: 10px; }
    .tax-row:last-child { border-bottom: none; }
    .tax-cell { padding: 8px; border-right: 1px solid #000; text-align: center; flex: 1; }
    .tax-cell:last-child { border-right: none; }
    .tax-header { background: #000; color: white; font-weight: bold; }
    .amount-in-words { border: 2px solid #000; border-top: none; padding: 8px; margin-bottom: 10px; font-size: 10px; }
    .amount-in-words strong { display: block; margin-bottom: 4px; }
    .bottom-section { display: flex; gap: 10px; font-size: 10px; }
    .bank-details, .terms-conditions { flex: 1; border: 2px solid #000; padding: 10px; min-height: 200px; }
    .bank-details h3, .terms-conditions h3 { font-size: 11px; margin-bottom: 8px; text-decoration: underline; }
    .bank-details p, .terms-conditions p { margin: 4px 0; line-height: 1.5; }
    .terms-conditions { display: flex; flex-direction: column; justify-content: space-between; }
    .terms-content { flex: 1; }
    .signature-box { align-self: flex-end; text-align: center; font-size: 9px; min-width: 150px; margin-top: 20px; }
    .signature-box img { max-width: 120px; max-height: 60px; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto; }
    .signature-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; font-weight: bold; }
    @media print { body { margin: 0; padding: 0; } .page { margin: 0; page-break-after: always; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-container">
      <div class="logo-box">
        <img src="${logoImage}" alt="Logo">
      </div>
      <div class="company-info">
        <h1>${form.company_name}</h1>
        <p>${form.company_address || ""}</p>
        <p>Mobile: ${form.company_phone || ""}</p>
        <p>Email: ${form.company_email}</p>
        <p>Website: ${form.company_website || ""}</p>
      </div>
      <div class="quotation-meta">
        <p><strong>Quotation No.</strong> ${form.quote_number}</p>
        <p><strong>Quotation Date</strong> ${form.date}</p>
        <p><strong>Expiry Date</strong> ${form.expiry_date}</p>
      </div>
    </div>
    <div class="quotation-title-bar">QUOTATION</div>
    <div class="bill-to-section">
      <strong>BILL TO</strong>
      <p>${form.client_name}</p>
      <p>Mobile: ${form.client_phone}</p>
      <p>Email: ${form.client_email}</p>
      ${form.client_address ? `<p>Address: ${form.client_address}</p>` : ""}
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 8%;">S.NO.</th>
          <th style="width: 52%;">SERVICES</th>
          <th style="width: 10%;">QTY</th>
          <th style="width: 15%;">RATE</th>
          <th style="width: 15%;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td class="service-col">${form.service_description}</td>
          <td>1 PCS</td>
          <td>₹${form.total_amount.toLocaleString("en-IN")}</td>
          <td class="amount-col">₹${form.total_amount.toLocaleString(
            "en-IN"
          )}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3"></td>
          <td><strong>TOTAL</strong></td>
          <td class="amount-col"><strong>₹${form.total_amount.toLocaleString(
            "en-IN"
          )}</strong></td>
        </tr>
      </tbody>
    </table>
    <div class="tax-section">
      <div class="tax-row tax-header">
        <div class="tax-cell">HSN/SAC</div>
        <div class="tax-cell">Taxable Value</div>
        <div class="tax-cell">CGST Rate</div>
        <div class="tax-cell">CGST Amount</div>
        <div class="tax-cell">SGST Rate</div>
        <div class="tax-cell">SGST Amount</div>
        <div class="tax-cell">Total Tax Amount</div>
      </div>
      <div class="tax-row">
        <div class="tax-cell"></div>
        <div class="tax-cell">₹${form.total_amount.toLocaleString(
          "en-IN"
        )}</div>
        <div class="tax-cell">0%</div>
        <div class="tax-cell">₹0</div>
        <div class="tax-cell">0%</div>
        <div class="tax-cell">₹0</div>
        <div class="tax-cell">₹0</div>
      </div>
      <div class="tax-row">
        <div class="tax-cell"><strong>Total</strong></div>
        <div class="tax-cell"><strong>₹${form.total_amount.toLocaleString(
          "en-IN"
        )}</strong></div>
        <div class="tax-cell"></div>
        <div class="tax-cell"><strong>₹0</strong></div>
        <div class="tax-cell"></div>
        <div class="tax-cell"><strong>₹0</strong></div>
        <div class="tax-cell"><strong>₹0</strong></div>
      </div>
    </div>
    <div class="amount-in-words">
      <strong>Total Amount (in words)</strong>
      <p>${totalInWords}</p>
    </div>
    <div class="bottom-section">
      <div class="bank-details">
        <h3>Bank Details</h3>
        <p><strong>Name:</strong> ${form.bank_name || ""}</p>
        <p><strong>IFSC Code:</strong> ${form.ifsc_code || ""}</p>
        <p><strong>Account No:</strong> ${form.account_number || ""}</p>
        <p><strong>Bank:</strong> ${form.bank_branch || ""}</p>
      </div>
      <div class="terms-conditions">
        <div class="terms-content">
          <h3>Terms and Conditions</h3>
          <p style="white-space: pre-line;">${form.terms_and_conditions || ""}</p>
        </div>
        <div class="signature-box">
          ${
            signatureImage
              ? `<img src="${signatureImage}" alt="Signature">`
              : '<div style="height: 50px;"></div>'
          }
          <div class="signature-line">Authorised Signatory For<br>${
            form.company_name
          }</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleUpdateQuotation = async () => {
    try {
      setLoading(true);

      const updatedHtmlContent = regenerateHtmlContent(
        editForm,
        selectedQuotation.html_content
      );

      await supabase.update("quotations", selectedQuotation.id, {
        ...editForm,
        html_content: updatedHtmlContent,
      });

      setSuccess("Quotation updated successfully!");
      setEditDialog(false);
      await fetchQuotations(user.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to update quotation: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      setLoading(true);
      await supabase.delete("quotations", id);
      setSuccess("Quotation deleted successfully!");
      await fetchQuotations(user.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to delete quotation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (quotation) => {
    try {
      setLoading(true);
      
      // Create a temporary element to render the HTML
      const element = document.createElement("div");
      element.innerHTML = quotation.html_content;
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.width = "210mm";
      element.style.background = "#ffffff";
      document.body.appendChild(element);

      // Wait for images to load
      const images = element.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 2000); // Fallback timeout
            }
          });
        })
      );

      // Load libraries dynamically if not already loaded
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      // Load html2canvas and jsPDF
      if (!window.html2canvas) {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        );
      }
      if (!window.jspdf) {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        );
      }

      // Convert HTML to canvas
      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123, // A4 height in pixels at 96 DPI
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 5;

      pdf.addImage(
        imgData,
        "JPEG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`Quotation_${quotation.quote_number}.pdf`);

      // Clean up
      document.body.removeChild(element);
      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to download PDF: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || colors.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && quotations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-700 font-medium">
            Loading quotations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              My Quotations
            </h1>
            <p className="text-slate-600">
              View, edit, and manage your quotations
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="text-sm font-medium text-slate-700">{user?.email}</p>
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Quotations</CardTitle>
            <CardDescription>
              Total: {quotations.length} quotation(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">
                  No quotations found. Create your first quotation!
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Quote No.
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Client
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Expiry
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map((quotation) => (
                        <tr
                          key={quotation.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="p-2 align-middle text-sm">
                            <span className="font-medium">
                              {quotation.quote_number}
                            </span>
                          </td>
                          <td className="p-2 align-middle text-sm">
                            <div>
                              <p className="font-medium">
                                {quotation.client_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quotation.client_email}
                              </p>
                            </div>
                          </td>
                          <td className="p-2 align-middle text-sm">
                            {new Date(quotation.date).toLocaleDateString()}
                          </td>
                          <td className="p-2 align-middle text-sm">
                            {new Date(
                              quotation.expiry_date
                            ).toLocaleDateString()}
                          </td>
                          <td className="p-2 align-middle text-sm text-right font-semibold">
                            ₹{quotation.total_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 align-middle text-sm">
                            {getStatusBadge(quotation.status)}
                          </td>
                          <td className="p-2 align-middle text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(quotation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(quotation)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(quotation)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(quotation.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-6xl max-h-[93vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Quotation</DialogTitle>
              <DialogDescription>
                Quotation #{selectedQuotation?.quote_number}
              </DialogDescription>
            </DialogHeader>
            {selectedQuotation && (
              <div className="mt-4">
                <iframe
                  srcDoc={selectedQuotation.html_content}
                  className="w-full h-[600px] border rounded-lg"
                  title="Quotation Preview"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Quotation</DialogTitle>
              <DialogDescription>
                Update all quotation details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quote Number</Label>
                    <Input
                      value={editForm.quote_number}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          quote_number: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={editForm.expiry_date}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          expiry_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input
                      value={editForm.client_name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          client_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Email</Label>
                    <Input
                      type="email"
                      value={editForm.client_email}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          client_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Phone</Label>
                    <Input
                      value={editForm.client_phone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          client_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Address</Label>
                    <Input
                      value={editForm.client_address}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          client_address: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service & Amount</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Description</Label>
                    <Textarea
                      value={editForm.service_description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          service_description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Amount (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.total_amount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          total_amount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={editForm.company_name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          company_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Email</Label>
                    <Input
                      type="email"
                      value={editForm.company_email}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          company_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Phone</Label>
                    <Input
                      value={editForm.company_phone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          company_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Website</Label>
                    <Input
                      value={editForm.company_website}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          company_website: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Company Address</Label>
                    <Textarea
                      value={editForm.company_address}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          company_address: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={editForm.bank_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bank_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      value={editForm.ifsc_code}
                      onChange={(e) =>
                        setEditForm({ ...editForm, ifsc_code: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={editForm.account_number}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          account_number: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Branch</Label>
                    <Input
                      value={editForm.bank_branch}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          bank_branch: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                <div className="space-y-2">
                  <Label>Terms and Conditions</Label>
                  <Textarea
                    value={editForm.terms_and_conditions}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        terms_and_conditions: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Enter terms and conditions..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateQuotation} disabled={loading}>
                {loading ? "Updating..." : "Update Quotation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
