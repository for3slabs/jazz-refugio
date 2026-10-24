import { currentRole } from "@/lib/session";

// The name in the top bar is whoever came in: she reads hers, Brian reads his.
export async function Greeting() {
  const role = await currentRole();
  if (!role) return null;
  return (
    <>
      , <span className="text-accent">{role === "brian" ? "Brian" : "Jazz"}</span>
    </>
  );
}
