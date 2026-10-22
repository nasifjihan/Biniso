import LoginForm from "@/components/Account/LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <div className="container mx-auto py-16 flex justify-center">
      <LoginForm
        next={typeof params.next === "string" ? params.next : ""}
        notice={typeof params.notice === "string" ? params.notice : ""}
      />
    </div>
  );
}
