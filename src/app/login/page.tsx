import { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Login - Sistem Surat Jalan",
  description: "Sistem Manajemen Surat Jalan Digital",
};

export default async function LoginPage() {
  const session = await getSession().catch(() => null);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center transform rotate-3">
            <span className="text-white text-2xl font-bold -rotate-3">SJ</span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center px-4">
        <LoginForm />
      </div>
    </div>
  );
}
