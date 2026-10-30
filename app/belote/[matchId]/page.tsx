import TrickGameForm from "@/components/TrickGameForm";

export default async function EditBeloteGamePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <TrickGameForm variant="belote" gameId={matchId} />;
}
