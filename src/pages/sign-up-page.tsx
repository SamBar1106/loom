import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthDivider, AuthScreen, authLinkClassName } from "@/components/auth/auth-screen";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useRegister, useSession } from "@/lib/api/hooks";
import { readReturnPath } from "@/lib/return-path";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

const emptyErrors: FieldErrors = { name: "", email: "", password: "", confirm: "" };

function validate(values: { name: string; email: string; password: string; confirm: string }): FieldErrors {
  return {
    name: values.name.trim() ? "" : "Enter your full name.",
    email: EMAIL.test(values.email.trim()) ? "" : "Enter an email address.",
    password: values.password.length >= 8 ? "" : "Use at least 8 characters.",
    confirm: values.password === values.confirm ? "" : "Passwords do not match.",
  };
}

function hasErrors(errors: FieldErrors): boolean {
  return Boolean(errors.name || errors.email || errors.password || errors.confirm);
}

export function SignUpPage() {
  const session = useSession();
  const register = useRegister();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors);

  if (session.data) {
    return <Navigate to={readReturnPath(location.state)} replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate({ name, email, password, confirm });
    setErrors(next);
    if (hasErrors(next)) return;

    register.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => navigate(readReturnPath(location.state), { replace: true }),
        onError: (error) => {
          if (error instanceof ApiError) {
            const nextErrors = { ...emptyErrors };
            for (const detail of error.details) {
              if (detail.field === "name" || detail.field === "email" || detail.field === "password") {
                nextErrors[detail.field] = detail.message;
              }
            }
            if (!hasErrors(nextErrors)) nextErrors.email = error.message;
            setErrors(nextErrors);
            return;
          }
          setErrors({ ...emptyErrors, email: "Could not create the account." });
        },
      },
    );
  }

  return (
    <AuthScreen
      title="Create account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/sign-in" state={location.state} className={authLinkClassName}>
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="full-name">Full name</FieldLabel>
          <Input
            id="full-name"
            name="name"
            autoComplete="name"
            placeholder="Alex Sample"
            value={name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "full-name-error" : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name ? <FieldError id="full-name-error">{errors.name}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email ? <FieldError id="signup-email-error">{errors.email}</FieldError> : null}
        </Field>
        <PasswordField
          id="signup-password"
          label="Password"
          value={password}
          autoComplete="new-password"
          error={errors.password}
          onChange={setPassword}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={confirm}
          autoComplete="new-password"
          error={errors.confirm}
          onChange={setConfirm}
        />
        <Button type="submit" className="mt-1 w-full" disabled={register.isPending}>
          Create account
        </Button>
        <AuthDivider />
        <GoogleButton />
      </form>
    </AuthScreen>
  );
}
