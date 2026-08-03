import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDialog.Content>) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/40 animate-fade-in" />
      <RadixDialog.Content
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-ink bg-surface p-5 shadow-stamp animate-pop-in focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({ className = "", ...props }: ComponentPropsWithoutRef<typeof RadixDialog.Title>) {
  return <RadixDialog.Title className={`font-display text-lg font-bold text-ink ${className}`} {...props} />;
}

export function DialogDescription({
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof RadixDialog.Description>) {
  return <RadixDialog.Description className={`text-sm text-mist ${className}`} {...props} />;
}
