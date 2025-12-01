import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TopProductsChart = ({ data }) => {
    // Take top 8 for better visibility
    const topData = data.slice(0, 8);

    return (
        <div className="chart-container">
            <h3 className="chart-title">Top Selling Products</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={topData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        type="number"
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        style={{ fontSize: '11px' }}
                        width={90}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="quantity"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                        name="Quantity Sold"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopProductsChart;
