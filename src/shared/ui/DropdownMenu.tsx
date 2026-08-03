import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef } from "react";

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;

export function DropdownMenuContent({
  className = "",
  sideOffset = 6,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        sideOffset={sideOffset}
        className={`z-50 min-w-[10rem] rounded-sm border-2 border-ink bg-surface p-1 shadow-stamp-sm animate-pop-in focus:outline-none ${className}`}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
}

export function DropdownMenuItem({
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item>) {
  return (
    <RadixDropdownMenu.Item
      className={`flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-paper ${className}`}
      {...props}
    />
  );
}

export const DropdownMenuSeparator = RadixDropdownMenu.Separator;
