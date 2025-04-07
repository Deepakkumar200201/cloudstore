import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// Schemas for login and registration forms
const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle login submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    await loginMutation.mutateAsync(values);
  };
  
  // Handle registration submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    // Extract confirmPassword so it's not sent to the API
    const { confirmPassword, ...registerData } = values;
    await registerMutation.mutateAsync(registerData);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero section - right side on desktop, top on mobile */}
      <div className="bg-blue-600 text-white p-8 md:w-1/2 md:min-h-screen flex flex-col justify-center items-center md:order-2">
        <div className="max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Cloud className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Welcome to CloudStore</h1>
          <p className="text-lg mb-6">
            The secure cloud storage solution for all your files.
            Access your documents anywhere, anytime.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <i className="fa-solid fa-shield-halved text-2xl mb-2"></i>
              <h3 className="font-medium mb-1">Secure Storage</h3>
              <p className="text-sm text-white/80">Your files are encrypted and stored safely</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <i className="fa-solid fa-share-nodes text-2xl mb-2"></i>
              <h3 className="font-medium mb-1">Easy Sharing</h3>
              <p className="text-sm text-white/80">Share files with anyone with custom permissions</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <i className="fa-solid fa-mobile-screen text-2xl mb-2"></i>
              <h3 className="font-medium mb-1">Access Anywhere</h3>
              <p className="text-sm text-white/80">Use on desktop, tablet, or mobile devices</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <i className="fa-solid fa-folder-open text-2xl mb-2"></i>
              <h3 className="font-medium mb-1">File Organization</h3>
              <p className="text-sm text-white/80">Keep your files organized with folders</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth forms - left side on desktop, bottom on mobile */}
      <div className="flex items-center justify-center p-6 md:w-1/2 md:min-h-screen md:order-1 relative bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Sign in to your account" : "Create a new account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Enter your email and password to access your account" 
                : "Fill out the form below to create your CloudStore account"}
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mx-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <Button 
                      type="submit" 
                      className="w-full mb-4"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                    <p className="text-center text-sm text-secondary-500">
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => setActiveTab("register")}
                      >
                        Register
                      </Button>
                    </p>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <Button 
                      type="submit" 
                      className="w-full mb-4"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                    <p className="text-center text-sm text-secondary-500">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => setActiveTab("login")}
                      >
                        Sign in
                      </Button>
                    </p>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
