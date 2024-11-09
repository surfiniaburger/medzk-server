/* eslint-disable react/prop-types */
import  { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Sector, Cell, ScatterChart, Scatter, ZAxis,
  ComposedChart, Area 
} from 'recharts';
import { Brain, TrendingUp, Map,  Users } from 'lucide-react';
import Navbar from './Navbar';

const AdvancedAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('1y');
  const [region, setRegion] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  
  const [activeIndex, setActiveIndex] = useState(0);

  // Mock data generators
  const generateTimeSeriesData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      pregnancyRisk: Math.random() * 100,
      sdohRisk: Math.random() * 100,
      healthcareAccess: Math.random() * 100,
      patients: Math.floor(Math.random() * 1000),
      completedVisits: Math.floor(Math.random() * 800),
    }));
  };

  const generateGeographicalData = () => {
    return [
      { region: 'North', riskScore: 65, patientCount: 1200, accessScore: 78 },
      { region: 'South', riskScore: 45, patientCount: 980, accessScore: 82 },
      { region: 'East', riskScore: 55, patientCount: 1100, accessScore: 75 },
      { region: 'West', riskScore: 35, patientCount: 890, accessScore: 88 },
      { region: 'Central', riskScore: 50, patientCount: 1300, accessScore: 80 },
    ];
  };

  const generateDemographicData = () => {
    return [
      { name: '18-24', value: 20, risk: 45 },
      { name: '25-30', value: 35, risk: 35 },
      { name: '31-35', value: 25, risk: 40 },
      { name: '36-40', value: 15, risk: 55 },
      { name: '40+', value: 5, risk: 65 },
    ];
  };

  const generateSdohClusterData = () => {
    return Array.from({ length: 50 }, () => ({
      income: Math.random() * 100,
      education: Math.random() * 100,
      healthcareAccess: Math.random() * 100,
      riskScore: Math.random() * 100,
      size: Math.random() * 100,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {`${payload.name}: ${value}%`}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <Navbar/>
     <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Zero Kare Analytics Hub</h1>
          <p className="text-gray-500">Powered by Google Cloud Gemini AI</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskLevel} onValueChange={setRiskLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Trend Analysis */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Risk Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={generateTimeSeriesData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="pregnancyRisk" fill="#8884d8" stroke="#8884d8" />
                <Line yAxisId="left" type="monotone" dataKey="sdohRisk" stroke="#82ca9d" />
                <Bar yAxisId="right" dataKey="completedVisits" fill="#ffc658" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Demographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Demographic Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={generateDemographicData()}
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {generateDemographicData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SDOH Cluster Analysis */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI-Powered SDOH Cluster Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="income" name="Income Level" />
                <YAxis type="number" dataKey="education" name="Education Level" />
                <ZAxis type="number" dataKey="size" range={[100, 500]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter
                  name="Population Segments"
                  data={generateSdohClusterData()}
                  fill="#8884d8"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographical Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Regional Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateGeographicalData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="region" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="riskScore" fill="#8884d8" name="Risk Score" />
                <Bar dataKey="accessScore" fill="#82ca9d" name="Access Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions">
        <TabsList>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="correlations">Risk Correlations</TabsTrigger>
          <TabsTrigger value="interventions">Intervention Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={generateTimeSeriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="pregnancyRisk" stroke="#8884d8" name="Actual Risk" />
                  <Line type="monotone" dataKey="sdohRisk" stroke="#82ca9d" name="AI Predicted Risk" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="sdohRisk" name="SDOH Risk Score" />
                  <YAxis type="number" dataKey="pregnancyRisk" name="Pregnancy Risk Score" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter name="Risk Correlation" data={generateTimeSeriesData()} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={generateTimeSeriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="pregnancyRisk" fill="#8884d8" stroke="#8884d8" />
                  <Line type="monotone" dataKey="healthcareAccess" stroke="#82ca9d" />
                  <Bar dataKey="completedVisits" fill="#ffc658" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
   
  );
};

export default AdvancedAnalyticsDashboard;