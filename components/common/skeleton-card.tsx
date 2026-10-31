import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  avatar?: boolean;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  avatar = false,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-5 p-5">
        {avatar ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ) : null}

        {Array.from({ length: Math.max(0, lines) }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}

        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}
