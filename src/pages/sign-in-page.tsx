import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthDivider, AuthScreen, authLinkClassName } from "@/components/auth/auth-screen";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useSession, useSignIn } from "@/lib/api/hooks";
import { readReturnPath } from "@/lib/return-path";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInPage() {
  const session = useSession();
  const signIn = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);

  if (session.data) {
    return <Navigate to={readReturnPath(location.state)} replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const nextEmailError = EMAIL.test(nextEmail) ? "" : "Enter an email address.";
    const nextPasswordError = password ? "" : "Enter your password.";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    signIn.mutate(
      { email: nextEmail, password },
      {
        onSuccess: () => navigate(readReturnPath(location.state), { replace: true }),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 429) {
            setRateLimited(true);
            setPasswordError("");
            return;
          }
          setRateLimited(false);
          setPasswordError(
            error instanceof ApiError && error.status === 401
              ? "Incorrect email or password."
              : error instanceof ApiError
                ? error.message
                : "Could not sign in.",
          );
        },
      },
    );
  }

  return (
    <AuthScreen
      title="Sign in"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/sign-up" state={location.state} className={authLinkClassName}>
            Create an account
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
        {rateLimited ? (
          <p role="alert" className="text-sm text-destructive">
            Too many attempts, try again in a few minutes.
          </p>
        ) : null}
        <Field data-invalid={emailError ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {emailError ? <FieldError id="email-error">{emailError}</FieldError> : null}
        </Field>
        <div className="flex flex-col gap-2">
          <PasswordField
            id="password"
            label="Password"
            value={password}
            autoComplete="current-password"
            error={passwordError}
            onChange={setPassword}
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={signIn.isPending}>
          Sign in
        </Button>
        <AuthDivider />
        <GoogleButton />
      </form>
    </AuthScreen>
  );
}
