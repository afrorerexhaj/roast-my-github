import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Star, GitFork, Loader2, AlertTriangle, Github } from "lucide-react";

import { useGenerateRoast } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const roastStyles = [
  { value: "normal", label: "Normal" },
  { value: "corporate", label: "Corporate Jargon" },
  { value: "pirate", label: "Pirate" },
  { value: "haiku", label: "Haiku" },
] as const;

const formSchema = z.object({
  username: z.string().min(1, "GitHub username is required"),
  style: z.enum(["normal", "corporate", "pirate", "haiku"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [roastData, setRoastData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roastMutation = useGenerateRoast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      style: "normal",
    },
  });

  const onSubmit = (data: FormValues) => {
    setRoastData(null);
    setErrorMsg(null);
    
    roastMutation.mutate(
      { data },
      {
        onSuccess: (result) => {
          setRoastData(result);
        },
        onError: (error: any) => {
          const apiError = error?.response?.data?.error || "Failed to generate roast. Try again.";
          setErrorMsg(apiError);
        },
      }
    );
  };

  const handleReset = () => {
    setRoastData(null);
    setErrorMsg(null);
    form.reset({ username: "", style: "normal" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary/30 font-mono">
      <div className="w-full max-w-3xl flex flex-col gap-12">
        
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight font-sans"
            data-testid="text-app-title"
          >
            Roast My GitHub <span className="inline-block hover:scale-125 transition-transform cursor-default">🔥</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
          >
            Brutal, AI-generated reality checks for your public repositories.
          </motion.p>
        </div>

        {/* Main Content Area */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {!roastData && !roastMutation.isPending && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto w-full"
              >
                <Card className="border-primary/20 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Github className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    placeholder="torvalds"
                                    className="pl-10 h-14 text-lg font-mono bg-background/50 focus-visible:ring-primary/50"
                                    data-testid="input-username"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="style"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-14 text-base font-mono bg-background/50 focus:ring-primary/50" data-testid="select-style">
                                    <SelectValue placeholder="Select roast style" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roastStyles.map((style) => (
                                    <SelectItem key={style.value} value={style.value} className="font-mono">
                                      {style.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {errorMsg && (
                          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md font-mono text-sm" data-testid="text-error-message">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p>{errorMsg}</p>
                          </div>
                        )}

                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full h-14 text-lg font-bold tracking-wide font-sans hover:shadow-[0_0_20px_rgba(255,100,50,0.4)] transition-all"
                          data-testid="button-submit-roast"
                        >
                          ROAST ME
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {roastMutation.isPending && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                  <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-xl font-mono text-muted-foreground animate-pulse" data-testid="text-loading">
                  Analyzing terrible code choices...
                </p>
              </motion.div>
            )}

            {roastData && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                className="w-full space-y-8"
              >
                {/* User Profile Info */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full blur-md bg-gradient-to-tr from-primary via-destructive to-purple-500 opacity-50" />
                    <Avatar className="h-24 w-24 border-2 border-background relative z-10">
                      <AvatarImage src={roastData.avatarUrl} alt={roastData.username} data-testid="img-avatar" />
                      <AvatarFallback className="text-2xl font-bold bg-secondary">
                        {roastData.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-sans" data-testid="text-result-username">@{roastData.username}</h2>
                    <p className="text-muted-foreground font-mono text-sm" data-testid="text-repo-count">
                      {roastData.repoCount} public repositories of shame
                    </p>
                  </div>
                </div>

                {/* The Roast */}
                <Card className="border-primary/30 bg-card/80 backdrop-blur overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-destructive" />
                  <CardContent className="p-8 md:p-10">
                    <p className="text-xl md:text-2xl leading-relaxed font-sans font-medium whitespace-pre-wrap" data-testid="text-roast-content">
                      {roastData.roast}
                    </p>
                  </CardContent>
                </Card>

                {/* Top Repos */}
                {roastData.topRepos && roastData.topRepos.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-sans text-muted-foreground uppercase tracking-widest pl-2">
                      Prime Offenders
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {roastData.topRepos.map((repo: any, i: number) => (
                        <Card key={i} className="bg-secondary/30 border-secondary-border" data-testid={`card-repo-${i}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-mono truncate text-primary">
                              {repo.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
                              {repo.language && (
                                <span className="flex items-center gap-1.5" data-testid={`text-repo-lang-${i}`}>
                                  <div className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-yellow-500/80" data-testid={`text-repo-stars-${i}`}>
                                <Star className="h-4 w-4 fill-current" />
                                {repo.stars}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-8 pb-12">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleReset}
                    className="font-mono hover:bg-primary hover:text-primary-foreground border-primary/50 text-primary transition-colors"
                    data-testid="button-roast-again"
                  >
                    ROAST SOMEONE ELSE
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
