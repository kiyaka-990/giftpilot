import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="text-gray-600 mt-2">
          You cancelled the PayPal payment. No charges were made.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
