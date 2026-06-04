import React from "react";
import { Card } from "@/components/ui/card";

interface StatBoxProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatBox({ icon, label, value, trend, className = "" }: StatBoxProps) {
  return (
    <Card className={`card-elegant hover-lift ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs font-semibold mt-2 ${trend.isPositive ? "text-success" : "text-destructive"}`}>
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && <div className="w-8 h-8 text-accent opacity-20">{icon}</div>}
      </div>
    </Card>
  );
}
