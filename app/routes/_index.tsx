import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (user) {
    return redirect("/dashboard");
  }
  return redirect("/auth/login");
}

export default function IndexPage() {
  return null;
}
