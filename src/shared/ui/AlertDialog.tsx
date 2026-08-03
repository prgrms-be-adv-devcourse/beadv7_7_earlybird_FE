import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { ComponentPropsWithoutRef } from "react";

export const AlertDialog = RadixAlertDialog.Root;
export const AlertDialogTrigger = RadixAlertDialog.Trigger;
export const AlertDialogCancel = RadixAlertDialog.Cancel;
export const AlertDialogAction = RadixAlertDialog.Action;

export function AlertDialogContent({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAlertDialog.Content>) {
  return (
    <RadixAlertDialog.Portal>
      <RadixAlertDialog.Overlay className="fixed inset-0 z-40 bg-ink/40 animate-fade-in" />
      <RadixAlertDialog.Content
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-ink bg-surface p-5 shadow-stamp animate-pop-in focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </RadixAlertDialog.Content>
    </RadixAlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof RadixAlertDialog.Title>) {
  return <RadixAlertDialog.Title className={`font-display text-lg font-bold text-ink ${className}`} {...props} />;
}

export function AlertDialogDescription({
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof RadixAlertDialog.Description>) {
  return <RadixAlertDialog.Description className={`text-sm text-mist ${className}`} {...props} />;
}
