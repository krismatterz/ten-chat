"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.auth.upsertFromClerk);

  useEffect(() => {
    async function syncUser() {
      if (isLoaded && user) {
        try {
          await upsertUser();
          console.log("User synced with Convex");
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }
    }

    syncUser();
  }, [isLoaded, user, upsertUser]);

  return null; // This component doesn't render anything
}
