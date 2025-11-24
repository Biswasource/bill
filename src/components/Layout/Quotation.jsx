import React, { useState, useEffect } from "react";
import { Download, CheckCircle, LogOut, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

export default function QuotationPage() {
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [settings, setSettings] = useState(null);
  const [billDetails, setBillDetails] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("supabase_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const userData = await supabase.getUser(token);
        console.log("Authenticated user:", userData);
        setUser(userData);
        supabase.setAuthToken(token);

        await Promise.all([fetchServices(), fetchClients(), fetchSettings()]);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await supabase.select("services");
      setServices(data || []);
    } catch (err) {
      setError("Failed to fetch services");
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await supabase.select("clients");
      setClients(data || []);
    } catch (err) {
      setError("Failed to fetch clients");
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await supabase.select("settings");
      if (data && data.length > 0) {
        setSettings(data[0]);
      } else {
        setError("Please configure your company settings first");
      }
    } catch (err) {
      setError("Failed to fetch settings");
      console.error(err);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("supabase_token");
    if (token) {
      await supabase.signOut(token);
    }
    localStorage.removeItem("supabase_token");
    window.location.href = "/login";
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const total = selectedServices.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.price || 0);
  }, 0);

  const fileName = `Quotation_${
    billDetails.invoiceNo
  }_${selectedClient?.name.replace(/\s+/g, "_")}.html`;

  // selectedClient.name;
  const generateQuotation = async () => {
    if (!settings) {
      setError("Please configure your company settings first");
      return;
    }

    if (!selectedClient) {
      setError("Please select a client");
      return;
    }

    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    if (!settings.logo_image) {
      setError("Please upload a company logo in settings");
      return;
    }

    if (!billDetails.invoiceNo) {
      setError("Please enter a quotation number");
      return;
    }

    const totalInWords = numberToWords(Math.floor(total));

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation ${billDetails.invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    
    .page { 
      width: 210mm; 
      margin: 0 auto; 
      padding: 10mm; 
      background: white;
    }
    
    .header-container { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      border: 2px solid #000;
      padding: 10px;
      margin-bottom: 0;
    }
    
    .logo-box { 
      width: 80px; 
      height: 80px; 
      background: #000;
      display: flex; 
      align-items: center; 
      justify-content: center;
      flex-shrink: 0;
    }
    
    .logo-box img { 
      max-width: 100%; 
      max-height: 100%; 
      object-fit: contain; 
    }
    
    .company-info { 
      flex: 1; 
      padding: 0 15px;
      font-size: 10px;
      line-height: 1.4;
    }
    
    .company-info h1 { 
      font-size: 18px; 
      font-weight: bold; 
      margin-bottom: 4px;
    }
    
    .company-info p { margin: 2px 0; }
    
    .quotation-meta { 
      text-align: right;
      font-size: 10px;
      line-height: 1.6;
      min-width: 150px;
    }
    
    .quotation-meta strong { 
      display: inline-block;
      width: 100px;
      text-align: left;
    }
    
    .quotation-title-bar {
      background: #000;
      color: white;
      text-align: center;
      padding: 8px;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-bottom: 0;
    }
    
    .bill-to-section {
      border: 2px solid #000;
      border-top: none;
      padding: 10px;
      margin-bottom: 10px;
      font-size: 10px;
      line-height: 1.5;
    }
    
    .bill-to-section strong {
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 10px;
      margin-bottom: 0;
    }
    
    thead { 
      background-color: #000; 
      color: white; 
    }
    
    th { 
      padding: 10px 8px; 
      text-align: center; 
      font-weight: bold; 
      border: 1px solid #000;
      font-size: 10px;
    }
    
    td { 
      padding: 10px 8px; 
      border: 1px solid #000;
      text-align: center;
    }
    
    .service-col { text-align: left; }
    .amount-col { text-align: right; }
    
    .total-row td {
      height: auto;
      padding: 8px;
      font-weight: bold;
    }
    
    .tax-section {
      border: 2px solid #000;
      border-top: none;
      margin-bottom: 10px;
    }
    
    .tax-row {
      display: flex;
      border-bottom: 1px solid #000;
      font-size: 10px;
    }
    
    .tax-row:last-child {
      border-bottom: none;
    }
    
    .tax-cell {
      padding: 8px;
      border-right: 1px solid #000;
      text-align: center;
      flex: 1;
    }
    
    .tax-cell:last-child {
      border-right: none;
    }
    
    .tax-header {
      background: #000;
      color: white;
      font-weight: bold;
    }
    
    .amount-in-words {
      border: 2px solid #000;
      border-top: none;
      padding: 8px;
      margin-bottom: 10px;
      font-size: 10px;
    }
    
    .amount-in-words strong {
      display: block;
      margin-bottom: 4px;
    }
    
    .bottom-section {
      display: flex;
      gap: 10px;
      font-size: 10px;
    }
    
    .bank-details, .terms-conditions {
      flex: 1;
      border: 2px solid #000;
      padding: 10px;
      min-height: 200px;
    }
    
    .bank-details h3, .terms-conditions h3 {
      font-size: 11px;
      margin-bottom: 8px;
      text-decoration: underline;
    }
    
    .bank-details p, .terms-conditions p {
      margin: 4px 0;
      line-height: 1.5;
    }
    
    .terms-conditions {
      position: relative;
    }
    
    .signature-box {
      position: absolute;
      right: 10px;
      bottom: 15px;
      text-align: center;
      font-size: 9px;
    }
    
    .signature-box img {
      max-width: 100px;
      max-height: 50px;
      margin-bottom: 5px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      padding-top: 5px;
      margin-top: 8px;
      font-weight: bold;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .page { margin: 0; page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-container">
      <div class="logo-box">
        <img src="${settings.logo_image}" alt="Logo">
      </div>
      
      <div class="company-info">
        <h1>${settings.company_name}</h1>
        <p>${settings.company_address || ""}</p>
        <p>Mobile: ${settings.company_phone || ""}</p>
        <p>Email: ${settings.company_email}</p>
        <p>Website: ${settings.company_website || ""}</p>
      </div>
      
      <div class="quotation-meta">
        <p><strong>Quotation No.</strong> ${billDetails.invoiceNo}</p>
        <p><strong>Quotation Date</strong> ${billDetails.date}</p>
        <p><strong>Expiry Date</strong> ${billDetails.dueDate}</p>
      </div>
    </div>
    
    <div class="quotation-title-bar">${
      settings.document_title || "QUOTATION"
    }</div>
    
    <div class="bill-to-section">
      <strong>BILL TO</strong>
      <p>${selectedClient.name}</p>
      ${selectedClient.company ? `<p>${selectedClient.company}</p>` : ""}
      <p>Mobile: ${selectedClient.phone}</p>
      <p>Email: ${selectedClient.email}</p>
      ${
        selectedClient.address
          ? `<p>Address: ${selectedClient.address}</p>`
          : ""
      }
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
        ${selectedServices
          .map((id, index) => {
            const service = services.find((s) => s.id === id);
            return `<tr>
            <td>${index + 1}</td>
            <td class="service-col">${service.name}</td>
            <td>1 PCS</td>
            <td>₹${service.price.toLocaleString("en-IN")}</td>
            <td class="amount-col">₹${service.price.toLocaleString(
              "en-IN"
            )}</td>
          </tr>`;
          })
          .join("")}
        <tr class="total-row">
          <td colspan="3"></td>
          <td><strong>TOTAL</strong></td>
          <td class="amount-col"><strong>₹${total.toLocaleString(
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
        <div class="tax-cell">₹${total.toLocaleString("en-IN")}</div>
        <div class="tax-cell">0%</div>
        <div class="tax-cell">₹0</div>
        <div class="tax-cell">0%</div>
        <div class="tax-cell">₹0</div>
        <div class="tax-cell">₹0</div>
      </div>
      <div class="tax-row">
        <div class="tax-cell"><strong>Total</strong></div>
        <div class="tax-cell"><strong>₹${total.toLocaleString(
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
        <p><strong>Name:</strong> ${settings.bank_name || ""}</p>
        <p><strong>IFSC Code:</strong> ${settings.ifsc_code || ""}</p>
        <p><strong>Account No:</strong> ${settings.account_number || ""}</p>
        <p><strong>Bank:</strong> ${settings.bank_branch || ""}</p>
      </div>
      
      <div class="terms-conditions">
        <h3>Terms and Conditions</h3>
        <p style="white-space: pre-line;">${
          settings.terms_and_conditions || ""
        }</p>
        
        <div class="signature-box">
          ${
            settings.signature_image
              ? `<img src="${settings.signature_image}" alt="Signature">`
              : '<div style="height: 50px;"></div>'
          }
          <div class="signature-line">Authorised Signatory For<br>${
            settings.company_name
          }</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    setLoading(true);
    try {
      console.log("Generated HTML Content:", user.id);
      // Save to Supabase
      await supabase.insert("quotations", {
        user_id: user.id,
        quote_number: billDetails.invoiceNo.trim(),
        client_name: settings.company_name,
        client_email: settings.company_email,
        client_phone: settings.company_phone,
        client_address: settings.company_address || "",
        service_description: selectedServices
          .map((id) => services.find((s) => s.id === id)?.name)
          .join(", "),
        total_amount: total,
        date: billDetails.date,
        expiry_date: billDetails.dueDate,
        html_content: htmlContent,
        company_phone: settings.company_phone || "",
        company_email: settings.company_email || "",
        company_name: settings.company_name || "",
        company_address: settings.company_address || "",
        company_website: settings.company_website || "",
        bank_name: settings.bank_name || "",
        ifsc_code: settings.ifsc_code || "",
        account_number: settings.account_number || "",
        bank_branch: settings.bank_branch || "",
        terms_and_conditions: settings.terms_and_conditions || "",

        status: "draft",
      });

      // Method 1: Using jsPDF + html2canvas (more reliable)
      const element = document.createElement("div");
      element.innerHTML = htmlContent;
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

      // Load libraries dynamically
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
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
      pdf.save(`Quotation_${billDetails.invoiceNo}.pdf`);

      // Clean up
      document.body.removeChild(element);
      setSuccess(
        `Quotation ${billDetails.invoiceNo} saved and downloaded successfully!`
      );
      setTimeout(() => setSuccess(""), 5000);

      // Reset form
      setSelectedServices([]);
      setSelectedClientId("");
      setBillDetails({
        invoiceNo: "",
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-700 font-medium">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Generate Quotation
            </h1>
            <p className="text-slate-600">
              Create professional quotations with your company branding
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-medium text-slate-700">
                {user?.email}
              </p>
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

        {!settings && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertDescription>
              ⚠️ Please configure your company settings before generating
              quotations.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Your company details from settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings ? (
                  <div className="space-y-4">
                    {settings.logo_image && (
                      <div className="text-center">
                        <img
                          src={settings.logo_image}
                          alt="Company Logo"
                          className="w-32 h-32 object-contain mx-auto border rounded-lg p-2 bg-white"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong className="text-slate-700">Company:</strong>{" "}
                        {settings.company_name}
                      </p>
                      {settings.company_email && (
                        <p>
                          <strong className="text-slate-700">Email:</strong>{" "}
                          {settings.company_email}
                        </p>
                      )}
                      {settings.company_phone && (
                        <p>
                          <strong className="text-slate-700">Phone:</strong>{" "}
                          {settings.company_phone}
                        </p>
                      )}
                      {settings.company_address && (
                        <p>
                          <strong className="text-slate-700">Address:</strong>{" "}
                          {settings.company_address}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No settings configured. Please set up your company
                    information.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
                <CardDescription>Enter quotation information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">Quotation Number *</Label>
                  <Input
                    id="invoiceNo"
                    placeholder="Q-2024-001"
                    value={billDetails.invoiceNo}
                    onChange={(e) =>
                      setBillDetails({
                        ...billDetails,
                        invoiceNo: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Quotation Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={billDetails.date}
                      onChange={(e) =>
                        setBillDetails({ ...billDetails, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Expiry Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={billDetails.dueDate}
                      onChange={(e) =>
                        setBillDetails({
                          ...billDetails,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Select Client</CardTitle>
                <CardDescription>
                  Choose a client for this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="no-clients" disabled>
                        No clients available
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedClient && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-1 text-sm border">
                    <p>
                      <strong>Name:</strong> {selectedClient.name}
                    </p>
                    {selectedClient.company && (
                      <p>
                        <strong>Company:</strong> {selectedClient.company}
                      </p>
                    )}
                    <p>
                      <strong>Phone:</strong> {selectedClient.phone}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedClient.email}
                    </p>
                    {selectedClient.address && (
                      <p>
                        <strong>Address:</strong> {selectedClient.address}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Select Services</CardTitle>
                <CardDescription>
                  Choose services to include in the quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {services.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No services available
                    </p>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition"
                      >
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceToggle(service.id)
                          }
                        />
                        <label
                          htmlFor={service.id}
                          className="flex-1 cursor-pointer"
                        >
                          <p className="font-medium text-sm">{service.name}</p>
                        </label>
                        <p className="text-sm font-semibold text-blue-600">
                          ₹{service.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg space-y-2 border border-blue-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Subtotal:</span>
                    <span className="font-semibold">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pb-2 border-b border-blue-200">
                    <span className="text-slate-700">Tax (0%):</span>
                    <span className="font-semibold">₹0</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2">
                    <span className="font-bold text-slate-800">Total:</span>
                    <span className="font-bold text-blue-600">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generateQuotation}
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading || !settings}
            >
              <Download className="h-5 w-5 mr-2" />
              {loading ? "Generating..." : "Generate & Download Quotation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
