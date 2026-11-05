"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@/components/Icons";

/** Password field with a show/hide toggle. Accepts the usual <input> props. */
export function PasswordInput({ className = "", ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  const Icon = show ? IconEyeOff : IconEye;

  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`input !pr-11 ${className}`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Sembunyikan kata laluan" : "Tunjuk kata laluan"}
        aria-pressed={show}
        title={show ? "Sembunyikan kata laluan" : "Tunjuk kata laluan"}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700"
      >
        <Icon className="size-5" />
      </button>
    </div>
  );
}
