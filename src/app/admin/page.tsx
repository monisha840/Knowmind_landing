import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";

/**
 * /admin — the gate.
 *
 * A Server Component, and that is the whole security design of this page: the
 * session is checked before anything renders, so an unauthenticated request
 * receives HTML containing a login form and *nothing else*. No lead data, no
 * hydration payload carrying rows, no client-side redirect that would ship the
 * data first and hide it afterwards (owner's condition 12).
 *
 * `AdminDashboard` is only ever mounted on the authenticated branch, and it
 * fetches its rows from `/api/admin/registrations`, which authenticates the
 * request again in its own right. Neither depends on the other having done it.
 */

/* Reading cookies already makes this dynamic; saying so is cheaper than
   discovering a cached admin page. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    /* `configured` tells an operator that the deployment is missing its admin
       environment variables. It reveals nothing worth having: it is only ever
       true-to-fact when there is no password to guess in the first place. */
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  return <AdminDashboard />;
}
