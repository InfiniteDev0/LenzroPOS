"use client"

import { useState } from "react"

import { LoginForm } from "@/components/forms/login-form";
import { SignupForm } from "@/components/forms/signup-form";

export default function Authpage() {
  const [mode, setMode] = useState("login")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        {mode === "login" ? (
          <LoginForm onSwitchMode={() => setMode("signup")} />
        ) : (
          <SignupForm onSwitchMode={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
