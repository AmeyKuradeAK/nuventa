"use client";
import React, { useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import axios from "axios";

const sideImg = "/Side-Image.jpg";
// const googleLogo = "/Icon-Google.png"; // Uncomment if using Google auth

interface PopulateResponse {
  success: boolean;
  client?: any;
  error?: string;
}

export default function SignUpPage() {
  const { signOut } = useClerk();
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setLoading(true);
      setError("");

      // Create the sign-up
      const result = await signUp.create({
        emailAddress,
        password,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.errors?.[0]?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setLoading(true);
      setError("");

      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        try {
          const response = await axios.post<PopulateResponse>("/api/populate", {
            email: emailAddress,
          });
          
          if (response.data.success) {
            console.log("Client created in Supabase successfully:", response.data.client);
            router.push("/");
          } else {
            console.error("Failed to create client in Supabase:", response.data.error);
            setError(response.data.error || "Account created but failed to sync with database. Please contact support.");
          }
        } catch (err: any) {
          console.error("Error creating client in Supabase:", err.response?.data || err);
          setError(err.response?.data?.error || "Account created but failed to sync with database. Please contact support.");
        }
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.errors?.[0]?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col xl:flex-row xl:h-[781px] xl:w-[1305px] xl:items-center xl:justify-around xl:mt-12 items-center">
        <div>
          <Image src={sideImg} alt="side-image" height={400} width={600} />
        </div>
        <div className="h-auto w-full max-w-[371px] flex flex-col justify-between items-center">
          <div className="text-left xl:text-left">
            <h1 className="text-[36px] font-medium">Create an Account</h1>
            <p className="text-sm pt-5">Enter your details here</p>
          </div>
          <div className="w-full mt-5">
            {error && (
              <div className="text-red-500 text-sm mb-4">{error}</div>
            )}
            {!pendingVerification ? (
              <div className="flex flex-col items-center w-full max-w-[370px] mt-5">
                <input
                  className="h-[32px] w-full bg-transparent border-b border-black mt-3"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="h-[32px] w-full bg-transparent border-b border-black mt-3"
                  type="email"
                  placeholder="Enter your email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
                <input
                  className="h-[32px] w-full bg-transparent border-b border-black mt-3"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="h-[56px] w-full bg-[#DB4444] text-white mt-5"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full max-w-[370px] mt-5">
                <input
                  className="h-[32px] w-full bg-transparent border-b border-black mt-3"
                  type="text"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className="h-[56px] w-full bg-[#DB4444] text-white mt-5"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </div>
            )}
            <p className="text-center mt-3">
              Already have an account?{" "}
              <Link className="border-b border-black" href="/sign-in">
                Login in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
