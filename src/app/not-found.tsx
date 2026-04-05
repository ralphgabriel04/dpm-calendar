import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link href="/home">
        <Button>Retour à l'accueil</Button>
      </Link>
    </div>
  );
}
