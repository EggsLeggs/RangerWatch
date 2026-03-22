import { cn } from "../../lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      role="separator"
      className={cn(
        "shrink-0 bg-ranger-border",
        orientation === "horizontal" ? "h-px w-full" : "h-4 w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
