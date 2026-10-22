import RegisterForm from "@/components/Account/RegisterForm";

export const metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div className="container mx-auto py-16 flex justify-center">
      <RegisterForm />
    </div>
  );
}
