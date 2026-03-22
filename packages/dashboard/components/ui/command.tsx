"use client";

import { type ComponentPropsWithoutRef, type HTMLAttributes } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "../../lib/utils";

function Command({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl bg-ranger-card text-ranger-text",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center border-b border-ranger-border px-3">
      <svg
        className="mr-2 h-4 w-4 shrink-0 text-ranger-muted"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <CommandPrimitive.Input
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-ranger-text outline-none placeholder:text-ranger-muted disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  );
}

function CommandEmpty(
  props: ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty className="py-6 text-center text-sm text-ranger-muted" {...props} />
  );
}

function CommandGroup({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-ranger-text [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ranger-muted",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-ranger-border/40 data-[selected=true]:text-ranger-text data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
};
