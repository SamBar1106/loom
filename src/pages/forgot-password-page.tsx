import { Link } from "react-router-dom";
import { AuthScreen, authLinkClassName } from "@/components/auth/auth-screen";

export function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Forgot password"
      footer={
        <Link to="/sign-in" className={authLinkClassName}>
          Back to sign in
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">Password reset is not available in this sample.</p>
    </AuthScreen>
  );
}
