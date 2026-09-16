// "use client";

// import * as React from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// export default function LoginPage() {
//   const router = useRouter();
//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");
//   const [isLoading, setIsLoading] = React.useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     // Simulate authentication hand-off
//     setTimeout(() => {
//       setIsLoading(false);
//       router.push("/");
//     }, 600);
//   };

//   return (
//     <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4">
//       {/* Brand Header */}
//       <div className="mb-6 flex items-center gap-2">
//         <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-[11px] font-bold text-white">
//           AK
//         </div>
//         <span className="text-sm font-semibold text-slate-900">AK Pharma</span>
//       </div>

//       {/* Login Card */}
//       <Card className="w-full max-w-[400px] rounded-xl border border-slate-200/90 shadow-xs">
//         <CardHeader className="space-y-1.5 pb-4 pt-6 text-left">
//           <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
//             Login to your account
//           </CardTitle>
//           <CardDescription className="text-xs text-slate-500">
//             Enter your email below to login to your account
//           </CardDescription>
//         </CardHeader>

//         <CardContent className="space-y-4 pb-6">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Email Field */}
//             <div className="space-y-2 text-left">
//               <Label htmlFor="email" className="text-xs font-semibold text-slate-900">
//                 Email
//               </Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="name@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="h-10 rounded-md border-slate-200 text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-950"
//               />
//             </div>

//             {/* Password Field */}
//             <div className="space-y-2 text-left">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="password" className="text-xs font-semibold text-slate-900">
//                   Password
//                 </Label>
//                 <Link
//                   href="/forgot-password"
//                   className="text-xs font-medium text-slate-900 hover:underline"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>
//               <Input
//                 id="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 className="h-10 rounded-md border-slate-200 text-xs focus-visible:ring-1 focus-visible:ring-slate-950"
//               />
//             </div>

//             {/* Submit Button */}
//             <Button
//               type="submit"
//               disabled={isLoading}
//               className="h-10 w-full rounded-md bg-[#18181B] text-xs font-semibold text-white transition-colors hover:bg-black"
//             >
//               {isLoading ? "Signing in..." : "Login"}
//             </Button>
//           </form>

//           {/* Sign Up Link */}
//           <div className="pt-1 text-center text-xs text-slate-500">
//             Don't have an account?{" "}
//             <Link href="/signup" className="font-semibold text-slate-900 underline underline-offset-4">
//               Sign up
//             </Link>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Terms & Privacy Footer */}
//       <footer className="mt-6 max-w-[320px] text-center text-[11px] leading-relaxed text-slate-500">
//         By clicking continue, you agree to our{" "}
//         <Link href="/terms" className="underline underline-offset-4 hover:text-slate-900">
//           Terms of Service
//         </Link>{" "}
//         and{" "}
//         <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-900">
//           Privacy Policy
//         </Link>
//         .
//       </footer>
//     </main>
//   );
// }