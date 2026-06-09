import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { ResetPasswordCard } from "~/modules/authentication";

export async function loader({ request }: LoaderFunctionArgs) {
  if (getUserFromRequest(request)) return redirect("/dashboard");
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return redirect("/auth/forgot-password");
  return { token };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  try {
    await AuthService.resetPassword({
      token: String(formData.get("token") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    return redirect("/auth/login");
  } catch (error: any) {
    return { error: error.message ?? "Reset failed. The link may have expired." };
  }
}

export default function ResetPasswordRoute() {
  return <ResetPasswordCard />;
}
