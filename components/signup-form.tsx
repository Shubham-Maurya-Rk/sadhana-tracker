"use client";

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner"; // Import sonner
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Flower2, Loader2 } from "lucide-react";
import Link from "next/link";


const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"], // This attaches the error to the confirm_password field specifically
  });

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  })

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // We use toast.promise to handle the entire request lifecycle
    toast.promise(
      (async () => {
        // 1. Registration Request
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || "Registration failed");
        }

        // 2. Auto-login attempt
        const loginRes = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (loginRes?.ok) {
          router.push("/sadhak");
          router.refresh();
          return "Account created! Redirecting...";
        } else {
          router.push("/login");
          throw new Error("Account created, but auto-login failed. Please sign in.");
        }
      })(),
      {
        loading: "Creating your account...",
        success: (data) => data,
        error: (err) => {
          // This ensures even weird objects or empty errors get a message
          return err?.message || "Something went wrong. Please try again.";
        },
      }
    );
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   // 1. Client-side validation
  //   if (formData.password !== formData.confirmPassword) {
  //     toast.error("Passwords do not match!"); // Sonner Toast
  //     setIsLoading(false);
  //     return;
  //   }

  //   if (formData.password.length < 8) {
  //     toast.error("Password must be at least 8 characters long.");
  //     setIsLoading(false);
  //     return;
  //   }

  //   try {
  //     const response = await fetch("/api/register", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         name: formData.name,
  //         email: formData.email,
  //         password: formData.password,
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.text();
  //       throw new Error(errorData || "Something went wrong");
  //     }

  //     toast.success("Account created successfully!"); // Success Toast

  //     // 3. Auto-login
  //     const loginRes = await signIn("credentials", {
  //       email: formData.email,
  //       password: formData.password,
  //       redirect: false,
  //     });

  //     if (loginRes?.ok) {
  //       router.push("/sadhak");
  //       router.refresh();
  //     } else {
  //       toast.warning("Account created, but please sign in manually.");
  //       router.push("/login");
  //     }
  //   } catch (error: any) {
  //     toast.error(error.message); // Server-side error Toast
  //     console.log(error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-center justify-center gap-2 group cursor-pointer shrink-0 mb-8">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
            <Flower2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-3xl tracking-tight bg-gradient-to-br from-stone-900 to-stone-600 dark:from-stone-100 dark:to-stone-400 bg-clip-text text-transparent">
            SadhnaTrk
          </span>
        </div>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="m@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        {...field}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pr-10"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Field>
              <Button type="submit">Sign Up</Button>
              <FieldDescription className="text-center">
                Already have an account? <Link href="/login">Log In</Link>
              </FieldDescription>
            </Field>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}