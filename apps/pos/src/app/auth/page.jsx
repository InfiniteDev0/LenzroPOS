import { LoginForm } from "@/components/forms/login-form";

export default function AuthPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
