import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import { KeyRound, User, Lock } from "lucide-react";
import bosjokoLogo from "@assets/image_1773044190239.png";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginForm = z.infer<typeof api.auth.login.input>;

export default function Login() {
  const { login, isLoggingIn } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(api.auth.login.input),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginForm) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
      <div className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="glass-panel p-8 md:p-10 rounded-3xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-primary/25 mb-6 border border-white/10">
              <img src={bosjokoLogo} alt="BOSJOKO Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gradient mb-2">
              System Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Dashboard Monitoring Izin Staff
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          placeholder="Username"
                          className="pl-11 h-12 bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="pl-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          type="password"
                          placeholder="Password"
                          className="pl-11 h-12 bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="pl-1" />
                  </FormItem>
                )}
              />
              
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <KeyRound className="w-5 h-5 mr-2" />
                      Secure Login
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-8 text-center text-xs text-muted-foreground/60 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            IP Restricted Access Area
          </div>
        </div>
      </div>
    </div>
  );
}
