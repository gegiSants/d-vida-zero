import { Card } from "@/components/ui/card";
import { brl } from "@/lib/format";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  highlight?: boolean;
}

export const StatCard = ({ label, value, icon: Icon, highlight }: Props) => (
  <Card
    className={`p-5 border-0 shadow-soft ${
      highlight ? "bg-gradient-primary text-primary-foreground" : "bg-card"
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <span
        className={`text-sm font-medium ${
          highlight ? "text-primary-foreground/90" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <Icon className="h-4 w-4 opacity-80" />
    </div>
    <div className="text-2xl font-bold tracking-tight">{brl(value)}</div>
  </Card>
);
