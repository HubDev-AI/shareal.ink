import Image from "next/image";

interface NyraSealProps {
  className?: string;
}

export function NyraSeal({ className }: NyraSealProps) {
  return (
    <div className={`pointer-events-none select-none ${className ?? ""}`}>
      <Image
        src="/nyra/nyra-icon.png"
        alt=""
        width={56}
        height={56}
        className="opacity-[0.15]"
      />
    </div>
  );
}
