"use client";

import { OctagonAlert } from "lucide-react";

type Props = {
  visible: boolean;
  maxPossible: number;
};

export default function WarningCard({ visible, maxPossible }: Props) {
  if (!visible) return null;

  return (
    <section className="rounded-[8px] border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <OctagonAlert className="mt-1 shrink-0 text-red-600" size={28} />
        <div>
          <h2 className="text-base font-bold leading-7 text-red-950">IRREVERSIBLE DETENTION</h2>
          <p className="mt-2 text-sm leading-6 text-red-800">
            Even if you attend every remaining class, your attendance cannot reach the mandatory 75% requirement.
          </p>
          <p className="mt-3 text-lg font-bold">Maximum possible attendance: {maxPossible.toFixed(1)}%</p>
        </div>
      </div>
    </section>
  );
}
