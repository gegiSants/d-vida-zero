import { Card } from "@/components/ui/card";
import { brl } from "@/lib/format";
import { SEMAFORO_CLASS, SEMAFORO_LABEL, Semaforo } from "@/lib/financeMetrics";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value?: number;
  display?: string;
  icon: LucideIcon;
  hint?: string;
  semaforo?: Semaforo;
  highlight?: boolean;
}

export const MetricCard = ({
  label,
  value,
  display,
  icon: Icon,
  hint,
  semaforo,
  highlight,
}: Props) => (
  <Card
    className={`p-4 border shadow-soft ${
      highlight
        ? "bg-primary text-primary-foreground border-primary"
        : semaforo
          ? SEMAFORO_CLASS[semaforo]
          : "bg-card border-border"
    }`}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <span
        className={`text-sm font-medium leading-tight ${
          highlight ? "text-primary-foreground/90" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <Icon className={`h-4 w-4 shrink-0 opacity-70 ${highlight ? "text-primary-foreground" : ""}`} />
    </div>
    <div
      className={`text-xl font-bold tracking-tight tabular-nums ${
        highlight ? "text-primary-foreground" : "text-foreground"
      }`}
    >
      {display ?? brl(value ?? 0)}
    </div>
    {semaforo && !highlight && (
      <p className={`text-xs font-medium mt-1.5 ${semaforo === "success" ? "text-success" : semaforo === "warning" ? "text-yellow-700" : semaforo === "destructive" ? "text-destructive" : "text-primary"}`}>
        {SEMAFORO_LABEL[semaforo]}
      </p>
    )}
    {hint && (
      <p className={`text-xs mt-1 ${highlight ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
        {hint}
      </p>
    )}
  </Card>
);

/** @deprecated use MetricCard */
export const StatCard = MetricCard;
