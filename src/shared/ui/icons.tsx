import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BirdIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 13c2.5-.5 4-2 5-4 1.3 2 3.4 3 6 3 3 0 5.3-1.6 7-4-1 3.6-3.3 6-6.5 7l1 6-3-2.3-2 1.8-.6-3.8C6.8 16.2 4.4 15 3 13Z" />
      <path d="M13.5 9.2c.3-.7.9-1.2 1.7-1.2" />
      <circle cx="15.2" cy="8.6" r=".4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CaterpillarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.6" cy="16.4" r="2.8" />
      <circle cx="11.6" cy="15.2" r="3.2" />
      <circle cx="18" cy="13.6" r="3.6" />
      <path d="M19.5 10.3c.3-1 1-1.6 1.8-1.9M20.7 11c.6-.8 1.4-1 2.1-1.1" />
      <circle cx="18.9" cy="12.5" r=".45" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TicketStubIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9a2 2 0 0 0 0 4v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-4V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
      <path d="M14 5.5v1.2M14 9.5v1.5M14 13.5v1.5M14 17.3v1.2" />
    </svg>
  );
}

export function CrateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
      <path d="M3 8.5V16l9 4.5M21 8.5V16l-9 4.5M12 13v7.5" />
    </svg>
  );
}

export function StampAlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 4 6v6c0 4.5 3.4 7.4 8 9 4.6-1.6 8-4.5 8-9V6l-8-3Z" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.2" r=".4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12 5 5 9-9" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}
