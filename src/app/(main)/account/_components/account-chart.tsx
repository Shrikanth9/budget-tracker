"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { fi } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Rectangle,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last 30 Days", days: 30 },
  "3M": { label: "Last 90 Days", days: 90 },
  "6M": { label: "Last 180 Days", days: 180 },
  ALL: { label: "All Time", days: null },
};

type dateRangeType = keyof typeof DATE_RANGES

const AccountChart = ({ transactions }: { transactions: any[] }) => {
  const [dateRange, setDateRange] = useState<dateRangeType>("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const filtered = transactions.filter((tx) => {
      const txDate = startOfDay(new Date(tx.date));
      return txDate >= startDate && txDate <= endOfDay(now);
    });

    const grouped = filtered.reduce((acc: { [key: string]: any }, tx) => {
      const rawDate = startOfDay(new Date(tx.date));
      const date = format(new Date(tx.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = { rawDate, date, income: 0, expense: 0 };
      }

      if (tx.type === "INCOME") {
        acc[date].income += tx.amount;
      } else {
        acc[date].expense += tx.amount;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => a.rawDate.getTime() - b.rawDate.getTime()
    );
  }, [transactions, dateRange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.income += item.income;
        acc.expense += item.expense;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
         <CardTitle className="text-base font-normal"> Transaction overview </CardTitle>
         <Select defaultValue={dateRange} onValueChange={(val: dateRangeType) => setDateRange(val)}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select range"/>
            </SelectTrigger>
            <SelectContent>
                {
                    Object.entries(DATE_RANGES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}> 
                            {label}
                        </SelectItem>
                    ))
                }
            </SelectContent>
         </Select>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground"> Total Income </p>
            <p className="text-lg font-bold text-green-500"> { totals.income.toFixed(2) }</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground"> Total Expenses </p>
            <p className="text-lg font-bold text-red-500"> { totals.expense.toFixed(2) }</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground"> Net </p>
            <p className={`text-lg font-bold 
              ${totals.income - totals.expense < 0 ? "text-red-500" : "text-green-500"}
            `}>
              { (totals.income - totals.expense).toFixed(2) }
            </p>
          </div>
        </div>
      </CardContent>
      <div className="h-[300px]"> 
        <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={filteredData}
                margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 0
                }}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
               dataKey="date"
               fontSize={12}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`} />
            <Tooltip />
            <Legend />
            <Bar 
                dataKey="income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
            />
            <Bar 
                dataKey="expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
            />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AccountChart;
