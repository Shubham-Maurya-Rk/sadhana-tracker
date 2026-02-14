"use client";

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner" // Ensure sonner is installed
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Flower2 } from "lucide-react"
import { Field, FieldDescription } from "./ui/field";
import { useState } from "react";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter() // Call this inside your component, not the function itself
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {

    // 1. Show a loading toast
    const toastId = toast.loading("Verifying your credentials...")

    try {
      // 2. Execute NextAuth Sign In
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false, // Set to false so we can handle the toast logic manually
      })
      console.log("Result: ", result);
      if (result?.error) {
        // 3. Handle Login Failure
        // result.error is usually the string thrown in your authorize function
        toast.error(result.error || "Invalid email or password", { id: toastId })
      } else {
        // 4. Handle Success
        toast.success("Welcome back! Redirecting...", { id: toastId })

        // Give the toast a moment to be seen before redirecting
        setTimeout(() => {
          router.push("/sadhak")
          router.refresh() // Ensures server components update with the new session
        }, 1000)
      }
    } catch (error) {
      // 5. Handle Unexpected Errors (Network issues, etc.)
      toast.error("An unexpected error occurred. Please try again.", { id: toastId })
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center gap-2 group cursor-pointer shrink-0 mb-8">
            <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
              <Flower2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-3xl tracking-tight bg-gradient-to-br from-stone-900 to-stone-600 dark:from-stone-100 dark:to-stone-400 bg-clip-text text-transparent">
              SadhnaTrk
            </span>
          </div>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    {/* <div className="flex items-center">
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Link
                        href="/login/forgot-password"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div> */}
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your password"
                          {...field}
                          type={showPassword ? "text" : "password"}
                          className="pr-10" // Add padding to the right so text doesn't overlap the icon
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
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Field>
                <Button type="submit">Login</Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/register">Sign up</Link>
                </FieldDescription>
              </Field>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
