import * as RadixSelect from "@radix-ui/react-select";
import type { ComponentPropsWithoutRef } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export const Select = RadixSelect.Root;
export const SelectValue = RadixSelect.Value;

export function SelectTrigger({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixSelect.Trigger>) {
  return (
    <RadixSelect.Trigger
      className={`flex items-center gap-2 rounded-sm border-2 border-ink/25 bg-surface px-3 py-2 text-sm text-ink outline-none data-[state=open]:border-ink ${className}`}
      {...props}
    >
      {children}
      <RadixSelect.Icon>
        <ChevronDownIcon className="h-4 w-4 text-mist" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

export function SelectContent({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixSelect.Content>) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        className={`z-50 overflow-hidden rounded-sm border-2 border-ink bg-surface shadow-stamp-sm animate-pop-in ${className}`}
        {...props}
      >
        <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export function SelectItem({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixSelect.Item>) {
  return (
    <RadixSelect.Item
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-paper ${className}`}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator>
        <CheckIcon className="h-3.5 w-3.5 text-brand" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
