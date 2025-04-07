import { useAuth } from "@/hooks/use-auth";

export default function TestPage() {
  const auth = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(auth, null, 2)}
      </pre>
    </div>
  );
}