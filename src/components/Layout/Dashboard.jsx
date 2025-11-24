import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Briefcase,
  Package,
  Calendar,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Supabase Configuration
const SUPABASE_URL = "https://bwpbffyiggkomneomtch.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cGJmZnlpZ2drb21uZW9tdGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzQ3NjIsImV4cCI6MjA3OTAxMDc2Mn0.KrKtx23tflFy8ehIC_7jKh-Y4NDUNOvgQ9AoMlAu-I0";

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalRevenue: 0,
    approvedQuotations: 0,
    draftQuotations: 0,
    pendingQuotations: 0,
    totalQuotations: 0,
    monthlyGrowth: 0,
    averageQuotationValue: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientsResponse = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!clientsResponse.ok) throw new Error("Failed to fetch clients");
      const clientsData = await clientsResponse.json();
      console.log("Clients Data:", clientsData);
      const quotationsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/quotations?select=*&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      let quotationsData = [];
      if (quotationsResponse.ok) {
        quotationsData = await quotationsResponse.json();
      }
      console.log("Quotations Data:", clientsData);
      setClients(clientsData);
      setQuotations(quotationsData);
      calculateStats(clientsData, quotationsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateStats = (clientsData, quotationsData) => {
    const totalClients = clientsData.length;
    const totalQuotations = quotationsData.length;

    const approvedQuotes = quotationsData.filter((q) => q.status === "draft");
    const draftQuotes = quotationsData.filter((q) => q.status === "draft");
    const pendingQuotes = quotationsData.filter((q) => q.status === "pending");

    const totalRevenue = approvedQuotes.reduce(
      (sum, q) => sum + (parseFloat(q.total_amount) || 0),
      0
    );

    const averageQuotationValue =
      totalQuotations > 0 ? totalRevenue / approvedQuotes.length : 0;

    // Calculate monthly growth
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthRevenue = approvedQuotes
      .filter((q) => {
        const date = new Date(q.created_at);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0);

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthRevenue = approvedQuotes
      .filter((q) => {
        const date = new Date(q.created_at);
        return (
          date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0);

    const monthlyGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    setStats({
      totalClients,
      totalRevenue,
      totalQuotations,
      approvedQuotations: approvedQuotes.length,
      draftQuotations: draftQuotes.length,
      pendingQuotations: pendingQuotes.length,
      monthlyGrowth: monthlyGrowth.toFixed(1),
      averageQuotationValue,
    });
  };

  const getRevenueByMonth = () => {
    const monthlyData = {};
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    quotations.forEach((q) => {
      if (q.status === "draft" && q.created_at) {
        const date = new Date(q.created_at);
        const monthYear = `${date.toLocaleString("default", {
          month: "short",
        })}`;

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: monthYear,
            revenue: 0,
            quotations: 0,
          };
        }

        monthlyData[monthYear].revenue += parseFloat(q.total_amount) || 0;
        monthlyData[monthYear].quotations += 1;
      }
    });

    const sortedData = Object.values(monthlyData).sort((a, b) => {
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    return sortedData.slice(-12);
  };

  const getServiceBreakdown = () => {
    const services = {};

    quotations.forEach((q) => {
      if (q.status === "approved" && q.service_description) {
        const serviceName = q.service_description.substring(0, 30);
        if (!services[serviceName]) {
          services[serviceName] = { name: serviceName, value: 0, count: 0 };
        }
        services[serviceName].value += parseFloat(q.total_amount) || 0;
        services[serviceName].count += 1;
      }
    });

    return Object.values(services)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const getQuotationStatusData = () => {
    const total =
      stats.approvedQuotations +
      stats.draftQuotations +
      stats.pendingQuotations;
    return [
      {
        status: "Approved",
        count: stats.approvedQuotations,
        percentage:
          total > 0 ? ((stats.approvedQuotations / total) * 100).toFixed(1) : 0,
        color: "#10b981",
      },
      {
        status: "Draft",
        count: stats.draftQuotations,
        percentage:
          total > 0 ? ((stats.draftQuotations / total) * 100).toFixed(1) : 0,
        color: "#f59e0b",
      },
      {
        status: "Pending",
        count: stats.pendingQuotations,
        percentage:
          total > 0 ? ((stats.pendingQuotations / total) * 100).toFixed(1) : 0,
        color: "#6366f1",
      },
    ];
  };

  const getRecentQuotations = () => {
    return quotations.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Alert className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Error:</strong> {error}
            <br />
            <br />
            Make sure your Supabase tables are set up correctly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const revenueData = getRevenueByMonth();
  const servicesData = getServiceBreakdown();
  const quotationStatusData = getQuotationStatusData();
  const recentQuotations = getRecentQuotations();

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      change: "+12.5%",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      iconColor: "text-blue-600",
      description: "Active clients",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: `${stats.monthlyGrowth}%`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      description: "From approved quotes",
    },
    {
      title: "Total Quotations",
      value: stats.totalQuotations,
      change: "+18.7%",
      icon: FileText,
      gradient: "from-violet-500 to-violet-600",
      lightBg: "bg-violet-50",
      iconColor: "text-violet-600",
      description: "All quotations",
    },
    {
      title: "Avg. Quote Value",
      value: `$${stats.averageQuotationValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: "+5.2%",
      icon: TrendingUp,
      gradient: "from-pink-500 to-pink-600",
      lightBg: "bg-pink-50",
      iconColor: "text-pink-600",
      description: "Per quotation",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-neutral-200">
          <p className="font-semibold text-neutral-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-neutral-600">
              {entry.name}:{" "}
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.name === "revenue"
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      draft: "bg-amber-100 text-amber-700 border-amber-200",
      pending: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return (
      badges[status] || "bg-neutral-100 text-neutral-700 border-neutral-200"
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-neutral-500 mt-1">
                Welcome back! Here's your business overview
              </p>
            </div>
            <button
              onClick={fetchData}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all font-medium shadow-sm hover:shadow-md"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = parseFloat(stat.change) >= 0;
            return (
              <Card
                key={index}
                className="border-neutral-200 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.lightBg}`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-neutral-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium mb-1">
                    Approved
                  </p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {stats.approvedQuotations}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-neutral-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium mb-1">
                    Draft
                  </p>
                  <p className="text-3xl font-bold text-amber-700">
                    {stats.draftQuotations}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-neutral-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    Pending
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {stats.pendingQuotations}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="text-neutral-900">Revenue Trend</CardTitle>
              <CardDescription className="text-neutral-500">
                Monthly revenue from approved quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#a3a3a3"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#a3a3a3"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quotation Status Donut */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="text-neutral-900">
                Status Distribution
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Quotation breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={quotationStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {quotationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e5e5",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
            <div className="px-6 pb-6 space-y-3">
              {quotationStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-neutral-600">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-neutral-900">
                      {item.count}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Services Breakdown */}
        {servicesData.length > 0 && (
          <Card className="border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="text-neutral-900">
                Top Services by Revenue
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Performance across different services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={servicesData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#a3a3a3"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#a3a3a3"
                    style={{ fontSize: "12px" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                    name="revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotations */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="text-neutral-900">
                Recent Quotations
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Latest quotations created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentQuotations.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">
                          {quote.quote_number}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          {quote.client_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-neutral-900">
                          $
                          {parseFloat(quote.total_amount || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                          quote.status
                        )}`}
                      >
                        {quote.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentQuotations.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No quotations found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="text-neutral-900">Recent Clients</CardTitle>
              <CardDescription className="text-neutral-500">
                Latest additions to your client base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.slice(0, 5).map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-blue-700">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">
                          {client.name}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          {client.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {client.company || "N/A"}
                      </p>
                      <p className="text-xs text-neutral-500">{client.phone}</p>
                    </div>
                  </div>
                ))}
                {clients.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No clients found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
