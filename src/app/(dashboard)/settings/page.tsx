"use client";

import { Calendar, Link2, Cog } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Settings Header */}
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">Paramètres</h1>
      </header>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl space-y-6">
          {/* Calendar Connections */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Connexions Calendrier</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      Non connecté
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent">
                  Connecter
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Microsoft Outlook</p>
                    <p className="text-sm text-muted-foreground">
                      Non connecté
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent">
                  Connecter
                </button>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Cog className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Règles Automatiques</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Configurez des règles pour automatiser votre planning.
              </p>
              <button className="mt-4 px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent">
                Gérer les règles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
