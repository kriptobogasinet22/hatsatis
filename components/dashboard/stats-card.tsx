import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  description: string
  trend: "up" | "down" | "stable"
}

export function StatsCard({ title, value, description, trend }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="flex items-center rounded-full px-2 py-1 text-xs">
          {trend === "up" && <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />}
          {trend === "down" && <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />}
          {trend === "stable" && <ArrowRightIcon className="mr-1 h-3 w-3 text-gray-500" />}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}
