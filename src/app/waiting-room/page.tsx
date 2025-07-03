import { WaitingRoom } from "./components/WaitingRoom";

export default function WaitingRoomPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Reservation Queue
            </h1>
            <p className="text-lg text-muted-foreground">
              Please wait while we process your request
            </p>
          </div>

          <WaitingRoom />
        </div>
      </div>
    </main>
  );
}
