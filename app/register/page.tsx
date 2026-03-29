import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "הרשמה | BSD-YBM Intelligence",
  description: "בקשת הרשמה לארגון — אישור מנהל מערכת",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
